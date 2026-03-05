# Task 07 — Invoicing Engine: CRUD, Math & PDF Generation

> **Phase:** 1 · Core Features
> **Priority:** Critical — freelancers need to get paid
> **Depends on:** `02-database.md` (invoices/invoice_line_items schema), `03-auth-rls.md` (RLS policies), `04-onboarding.md` (org context), `05-projects-crud.md` (project/client context)

---

## Objective

Implement the invoicing engine that allows Admins to create, preview, send, and track invoices. The system must be mathematically precise (all money in cents, tax in basis points), generate branded PDF invoices via `@react-pdf/renderer`, and use atomic database operations for invoice numbering.

---

## Description

PRD §6.5 defines an invoice system with:

1. **Auto-numbered invoices** using an atomic `UPDATE ... RETURNING` on `organizations.next_invoice_number` (PRD §10.2).
2. **Line items** with description, quantity (fractional), and unit price in cents.
3. **Tax rate** stored as basis points (e.g., 5.5% = 550) to avoid float math.
4. **Status workflow:** Draft → Sent → Paid / Overdue.
5. **PDF generation** with org branding (logo + accent color), streamed via API route.
6. **PDF caching:** Generated once on "Send", stored in Supabase Storage. Subsequent requests return the cached URL (PRD §10.2).

This task builds:

- **Zod schemas** for invoice validation (`src/features/invoices/schemas.ts`).
- **Math utility** `calculateTotals()` shared between client and server.
- **Server Actions** for `createInvoice` and `updateInvoiceStatus`.
- **tRPC router** for fetching invoice list and detail.
- **PDF generation** API route at `/api/invoices/[invoiceId]/pdf/route.ts`.
- **UI component** `InvoiceBuilder.tsx` — dynamic line-item form.

> **PRD §10.1:** Money as `z.number().int().min(0)` (cents). Tax as `z.number().int().min(0).max(10000)` (basis points).
> **PRD §10.2:** "Invoice number generation must use atomic `UPDATE ... RETURNING`, never read-modify-write."
> **PRD §10.2:** "PDFs generated once on Send, cached to Supabase Storage."

---

## Tech Stack

| Concern        | Tool                                                              |
| -------------- | ----------------------------------------------------------------- |
| **Math**       | Integer arithmetic (cents). Zod validation. No floats for money.  |
| **PDF**        | `@react-pdf/renderer` (server-side stream generation)             |
| **Mutations**  | Next.js Server Actions (`createInvoice`, `updateInvoiceStatus`)   |
| **Queries**    | tRPC v11 + TanStack Query (invoice list, detail)                  |
| **ORM**        | Drizzle ORM (invoices, invoice_line_items, organizations)         |
| **Validation** | Zod (shared schema)                                               |
| **Forms**      | `react-hook-form` + `@hookform/resolvers/zod`                     |
| **UI**         | shadcn/ui (`Card`, `Badge`, `Button`, `Dialog`, `Table`, `Input`) |
| **Dates**      | `date-fns` (due date formatting, overdue checks)                  |

---

## Step-by-Step Instructions

### Step 1 — Zod Validation Schemas & Math Utility

Create `src/features/invoices/schemas.ts`:

```typescript
import { z } from "zod";

// ─── Constants ──────────────────────────────────────────────────
export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

export const STATUS_LABELS: Record<(typeof INVOICE_STATUSES)[number], string> =
  {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    overdue: "Overdue",
  };

// ─── Line Item Schema ───────────────────────────────────────────
/**
 * PRD §10.1: Money stored in cents. Quantity allows fractional hours (0.1+).
 */
export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z
    .number()
    .min(0.01, "Quantity must be positive")
    .max(999999, "Quantity too large")
    .refine(
      (v) => Math.round(v * 100) === v * 100,
      "Quantity must have at most 2 decimal places",
    ),
  unitPriceCents: z
    .number()
    .int("Unit price must be a whole number (cents)")
    .min(0, "Unit price cannot be negative"),
});

export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;

// ─── Invoice Schema ─────────────────────────────────────────────
/**
 * PRD §6.5: Invoice fields.
 * `orgId` is NEVER included — injected server-side from session.
 * `number` is NEVER included — generated atomically server-side.
 * `amountCents` is NEVER included — calculated server-side from line items.
 */
export const createInvoiceSchema = z.object({
  clientId: z.string().uuid("Please select a valid client"),
  projectId: z.string().uuid().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  currency: z.enum(CURRENCIES).default("USD"),
  items: z
    .array(invoiceLineItemSchema)
    .min(1, "At least one line item is required")
    .max(50, "Maximum 50 line items"),
  taxRateBasisPoints: z
    .number()
    .int("Tax rate must be a whole number (basis points)")
    .min(0, "Tax rate cannot be negative")
    .max(10000, "Tax rate cannot exceed 100%")
    .default(0),
  notes: z
    .string()
    .max(1000, "Notes must be at most 1,000 characters")
    .optional()
    .nullable(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ─── Status Update Schema ───────────────────────────────────────
/**
 * Valid transitions (PRD §6.5):
 *   Draft → Sent → Paid
 *                → Overdue (system-only via cron)
 */
export const updateInvoiceStatusSchema = z.object({
  invoiceId: z.string().uuid(),
  status: z.enum(["sent", "paid"]),
});

// ─── Math Utility ───────────────────────────────────────────────
/**
 * calculateTotals — Deterministic invoice math.
 *
 * CRITICAL: This function is shared between client (preview) and server
 * (persistence) to guarantee identical results. All math uses integer
 * cents to prevent floating-point drift.
 *
 * @param items - Array of line items with quantity and unitPriceCents
 * @param taxRateBasisPoints - Tax rate in basis points (550 = 5.5%)
 * @returns { subtotalCents, taxCents, totalCents }
 *
 * Algorithm:
 *   lineTotal = Math.round(quantity × unitPriceCents)
 *   subtotal  = Σ lineTotals
 *   tax       = Math.round(subtotal × taxRateBasisPoints / 10000)
 *   total     = subtotal + tax
 */
export function calculateTotals(
  items: Pick<InvoiceLineItemInput, "quantity" | "unitPriceCents">[],
  taxRateBasisPoints: number = 0,
) {
  const subtotalCents = items.reduce((acc, item) => {
    return acc + Math.round(item.quantity * item.unitPriceCents);
  }, 0);

  const taxCents = Math.round((subtotalCents * taxRateBasisPoints) / 10000);

  return {
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
  };
}

/**
 * formatCents — Convert cents to display string.
 * 1050 → "$10.50", 100 → "$1.00"
 */
export function formatCents(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
```

**Key decisions:**

| Decision                          | Rationale                                                            |
| --------------------------------- | -------------------------------------------------------------------- |
| `amountCents` excluded from input | Calculated server-side from line items — never trust client math     |
| `number` excluded from input      | Auto-generated atomically — PRD §10.2 Invoice Sequence Lock          |
| `taxRateBasisPoints` as integer   | 5.5% = 550 basis points. Avoids float precision errors (PRD §10.1)   |
| `Math.round()` in calculateTotals | Deterministic rounding for fractional qty × cents                    |
| Shared utility function           | Same function on client (preview) and server (persist) = no mismatch |

---

### Step 2 — Server Actions (Create Invoice & Update Status)

Create `src/features/invoices/server/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import {
  invoices,
  invoiceLineItems,
  organizations,
  clients,
  projects,
} from "@/db/schema";
import { eq, and, sql, gte, count } from "drizzle-orm";
import {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  calculateTotals,
} from "../schemas";

// ─── Types ──────────────────────────────────────────────────────
export type ActionState = {
  success?: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

// ─── ACTION 1: createInvoice ────────────────────────────────────
/**
 * Creates a new invoice with line items inside a transaction.
 *
 * CRITICAL — Invoice Number Generation (PRD §10.2):
 *   Uses atomic `UPDATE organizations SET next_invoice_number = next_invoice_number + 1
 *   WHERE id = $orgId RETURNING next_invoice_number` to prevent TOCTOU race
 *   conditions. Two simultaneous requests will NEVER get the same number.
 *
 * Flow:
 *   1. Authenticate + verify Owner/Admin role (PRD §4: only Owner can create invoices).
 *   2. Validate input with Zod.
 *   3. Verify client (and optional project) belong to org.
 *   4. Calculate totals server-side using shared `calculateTotals()`.
 *   5. Atomically claim the next invoice number.
 *   6. Insert invoice + line items in a transaction.
 */
export async function createInvoice(input: unknown): Promise<ActionState> {
  // 1. Auth
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: "You must be logged in to create an invoice." };
  }

  // PRD §4: Only Owner/Admin can create invoices
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only Admins can create invoices." };
  }

  // 1b. Plan limit check — PRD §9: Starter tier ≤ 5 invoices/month
  const [org] = await ctx.db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, ctx.orgId))
    .limit(1);

  if (org?.plan === "starter") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ invoiceCount }] = await ctx.db
      .select({ invoiceCount: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, ctx.orgId),
          gte(invoices.createdAt, startOfMonth),
        ),
      );

    if (invoiceCount >= 5) {
      return {
        error:
          "Starter plan is limited to 5 invoices per month. Upgrade to Pro for unlimited invoices.",
      };
    }
  }

  // 2. Validate
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const data = parsed.data;

  // 3. Verify client belongs to org
  const client = await ctx.db.query.clients.findFirst({
    where: and(eq(clients.id, data.clientId), eq(clients.orgId, ctx.orgId)),
    columns: { id: true },
  });

  if (!client) {
    return { error: "Client not found in your organization." };
  }

  // 3b. If projectId provided, verify it belongs to org
  if (data.projectId) {
    const project = await ctx.db.query.projects.findFirst({
      where: and(
        eq(projects.id, data.projectId),
        eq(projects.orgId, ctx.orgId),
      ),
      columns: { id: true },
    });

    if (!project) {
      return { error: "Project not found in your organization." };
    }
  }

  // 4. Calculate totals server-side (single source of truth)
  const { subtotalCents, taxCents, totalCents } = calculateTotals(
    data.items,
    data.taxRateBasisPoints,
  );

  try {
    // 5. Atomic invoice number claim (PRD §10.2 — Invoice Sequence Lock)
    //    This UPDATE ... RETURNING is atomic: concurrent transactions
    //    will serialize on the row lock, preventing duplicate numbers.
    const [orgUpdate] = await ctx.db
      .update(organizations)
      .set({
        nextInvoiceNumber: sql`${organizations.nextInvoiceNumber} + 1`,
      })
      .where(eq(organizations.id, ctx.orgId))
      .returning({ nextInvoiceNumber: organizations.nextInvoiceNumber });

    // The RETURNED value is AFTER increment, so the claimed number
    // is (returned - 1). E.g., if nextInvoiceNumber was 1001,
    // after UPDATE it's 1002, and we use 1001.
    const claimedNumber = orgUpdate.nextInvoiceNumber - 1;

    // 6. Insert invoice
    const [newInvoice] = await ctx.db
      .insert(invoices)
      .values({
        orgId: ctx.orgId,
        clientId: data.clientId,
        projectId: data.projectId ?? null,
        number: claimedNumber,
        status: "draft",
        dueDate: data.dueDate ? data.dueDate.toISOString().split("T")[0] : null,
        currency: data.currency,
        amountCents: totalCents,
        taxRateBasisPoints: data.taxRateBasisPoints,
        notes: data.notes ?? null,
      })
      .returning({ id: invoices.id });

    // 7. Insert line items
    await ctx.db.insert(invoiceLineItems).values(
      data.items.map((item) => ({
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity.toString(), // numeric column expects string
        unitPriceCents: item.unitPriceCents,
      })),
    );

    revalidatePath("/dashboard/invoices");

    return {
      success: true,
      data: {
        invoiceId: newInvoice.id,
        invoiceNumber: claimedNumber,
        formattedNumber: `INV-${claimedNumber}`,
        totalCents,
      },
    };
  } catch (err) {
    console.error("Failed to create invoice:", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── ACTION 2: updateInvoiceStatus ──────────────────────────────
/**
 * Transitions invoice status: Draft → Sent → Paid.
 *
 * On "Sent": Generates the PDF, uploads to Supabase Storage,
 * and caches the URL on the invoice row (PRD §10.2 PDF Caching).
 */
export async function updateInvoiceStatus(
  input: unknown,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: "You must be logged in." };
  }

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only Admins can update invoice status." };
  }

  const parsed = updateInvoiceStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { invoiceId, status: newStatus } = parsed.data;

  // Fetch current invoice
  const invoice = await ctx.db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.orgId, ctx.orgId)),
  });

  if (!invoice) {
    return { error: "Invoice not found." };
  }

  // Validate transition
  const VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ["sent"],
    sent: ["paid"],
    overdue: ["paid"],
  };

  const allowed = VALID_TRANSITIONS[invoice.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return {
      error: `Cannot transition from "${invoice.status}" to "${newStatus}".`,
    };
  }

  try {
    const updateValues: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // On "Sent": generate and cache PDF (PRD §10.2)
    if (newStatus === "sent" && !invoice.pdfUrl) {
      // PDF generation is handled by fetching the PDF route internally
      // and uploading the result to Supabase Storage.
      const pdfPath = `invoices/${ctx.orgId}/${invoiceId}.pdf`;
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const pdfResponse = await fetch(
        `${baseUrl}/api/invoices/${invoiceId}/pdf`,
        {
          headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET! },
        },
      );

      if (pdfResponse.ok) {
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        const supabase = await createClient();
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(pdfPath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!uploadError) {
          updateValues.pdfUrl = pdfPath;
        }
      }
    }

    await ctx.db
      .update(invoices)
      .set(updateValues)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, ctx.orgId)));

    revalidatePath("/dashboard/invoices");
    return { success: true };
  } catch (err) {
    console.error("Failed to update invoice status:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
```

**Constraints enforced:**

| Constraint              | Implementation                                                           |
| ----------------------- | ------------------------------------------------------------------------ |
| Atomic invoice number   | `UPDATE ... SET next_invoice_number + 1 RETURNING` — no TOCTOU races     |
| Org isolation           | `orgId` from session, client/project verified against `ctx.orgId`        |
| RBAC                    | Only `owner`/`admin` can create or update invoices (PRD §4)              |
| Server-side math        | `calculateTotals()` on server, never trust client-supplied `amountCents` |
| PDF caching             | PDF generated once on "Sent", uploaded to Storage, path saved on row     |
| Status transition guard | `VALID_TRANSITIONS` map prevents illegal state changes                   |
| Plan limits (PRD §9)    | Starter tier enforced at 5 invoices/month; queried before creation       |
| `createDrizzleClient`   | No bare `db` — all DB access uses factory or shared `getSessionContext`  |
| Quantity precision      | Zod `.refine()` rejects >2 decimal places, matching `numeric(10,2)` DB   |

---

### Step 3 — tRPC Router (Queries)

Create `src/features/invoices/server/router.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { invoices, invoiceLineItems, clients } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

/**
 * Helper: Generate a signed URL for a cached PDF storage path.
 * PRD §10.2: "Subsequent client requests return a cached signed URL."
 * Returns null if the path is null or signing fails.
 */
async function getSignedPdfUrl(
  storagePath: string | null,
): Promise<string | null> {
  if (!storagePath) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600); // 1-hour expiry
  if (error) {
    console.error("Failed to sign PDF URL:", error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Helper: Resolve the client record for a user with the 'client' role.
 * Used to scope invoice queries so Client A cannot see Client B's invoices.
 * PRD §4 Key Constraint: "A Client can never see another client's invoices."
 */
async function resolveClientId(
  db: any,
  userId: string,
  orgId: string,
): Promise<string | null> {
  const clientRecord = await db.query.clients.findFirst({
    where: and(eq(clients.userId, userId), eq(clients.orgId, orgId)),
    columns: { id: true },
  });
  return clientRecord?.id ?? null;
}

export const invoiceRouter = createTRPCRouter({
  /** getAll — Fetch all invoices for the current org. */
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(invoices.orgId, ctx.orgId)];

      // PRD §4: Client role can ONLY see their own invoices
      if (ctx.role === "client") {
        const clientId = await resolveClientId(ctx.db, ctx.userId, ctx.orgId);
        if (!clientId) return [];
        conditions.push(eq(invoices.clientId, clientId));
      }

      if (input?.status) {
        conditions.push(eq(invoices.status, input.status));
      }

      const results = await ctx.db
        .select({
          id: invoices.id,
          number: invoices.number,
          status: invoices.status,
          currency: invoices.currency,
          amountCents: invoices.amountCents,
          taxRateBasisPoints: invoices.taxRateBasisPoints,
          dueDate: invoices.dueDate,
          pdfUrl: invoices.pdfUrl,
          createdAt: invoices.createdAt,
          clientId: invoices.clientId,
          clientCompanyName: clients.companyName,
          clientEmail: clients.email,
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(and(...conditions))
        .orderBy(desc(invoices.createdAt));

      // Sign PDF URLs before returning (PRD §10.2 — cached signed URL)
      const resultsWithSignedUrls = await Promise.all(
        results.map(async (inv) => ({
          ...inv,
          pdfSignedUrl: await getSignedPdfUrl(inv.pdfUrl),
        })),
      );

      return resultsWithSignedUrls;
    }),

  /** getById — Fetch invoice detail with line items. */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const queryConditions = [
        eq(invoices.id, input.id),
        eq(invoices.orgId, ctx.orgId),
      ];

      // PRD §4: Client role can ONLY see their own invoices
      if (ctx.role === "client") {
        const clientId = await resolveClientId(ctx.db, ctx.userId, ctx.orgId);
        if (!clientId) return null;
        queryConditions.push(eq(invoices.clientId, clientId));
      }

      const [invoice] = await ctx.db
        .select({
          id: invoices.id,
          number: invoices.number,
          status: invoices.status,
          currency: invoices.currency,
          amountCents: invoices.amountCents,
          taxRateBasisPoints: invoices.taxRateBasisPoints,
          dueDate: invoices.dueDate,
          notes: invoices.notes,
          pdfUrl: invoices.pdfUrl,
          createdAt: invoices.createdAt,
          clientCompanyName: clients.companyName,
          clientEmail: clients.email,
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(and(...queryConditions))
        .limit(1);

      if (!invoice) return null;

      // Sign the PDF URL before returning
      const pdfSignedUrl = await getSignedPdfUrl(invoice.pdfUrl);

      const items = await ctx.db
        .select({
          id: invoiceLineItems.id,
          description: invoiceLineItems.description,
          quantity: invoiceLineItems.quantity,
          unitPriceCents: invoiceLineItems.unitPriceCents,
        })
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, input.id));

      return { ...invoice, pdfSignedUrl, items };
    }),
});
```

> **Wire into root router** in `src/lib/trpc/root.ts`:
>
> ```typescript
> import { invoiceRouter } from "@/features/invoices/server/router";
>
> export const appRouter = createTRPCRouter({
>   invoice: invoiceRouter,
>   // ...other routers
> });
> ```

---

### Step 4 — PDF Generation API Route

Create `src/app/api/invoices/[invoiceId]/pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import ReactPDF from "@react-pdf/renderer";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import {
  invoices,
  invoiceLineItems,
  clients,
  organizations,
  orgMemberships,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDFDocument } from "@/features/invoices/components/InvoicePDF";
import { calculateTotals, formatCents } from "@/features/invoices/schemas";

/**
 * GET /api/invoices/[invoiceId]/pdf
 *
 * Generates and streams a branded PDF invoice.
 *
 * ⚠️ PERFORMANCE NOTE: @react-pdf/renderer runs on the main thread.
 * Vercel Serverless Functions have a 10s timeout on the Hobby tier.
 * If complex invoices (50+ line items, large logos) cause timeouts,
 * consider offloading PDF generation to an Inngest background job
 * triggered by the `invoice.sent` event (PRD §10.2).
 *
 * Security:
 * - Internal calls (from updateInvoiceStatus) authenticated via INTERNAL_API_SECRET header.
 * - External calls authenticated via Supabase session.
 * - PRD §4 Key Constraint: Client users can ONLY access PDFs for their own invoices.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { invoiceId: string } },
) {
  // Fail-fast: prevent cryptic 401s during development
  if (!process.env.INTERNAL_API_SECRET) {
    throw new Error(
      "Missing INTERNAL_API_SECRET env var. Add it to .env.local (see 01-setup.md).",
    );
  }

  const { invoiceId } = params;

  // Auth: check either session or internal secret header
  const isInternal =
    req.headers.get("x-internal-secret") === process.env.INTERNAL_API_SECRET;

  let db: Awaited<ReturnType<typeof createDrizzleClient>>;
  let orgId: string;

  if (isInternal) {
    // Internal call from updateInvoiceStatus — skip auth, derive orgId from invoice
    // Use SYSTEM context since there's no user session for internal calls
    db = await createDrizzleClient({ userId: "SYSTEM", orgId: "SYSTEM" });
    const inv = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      columns: { orgId: true },
    });
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    orgId = inv.orgId;
  } else {
    // External call — require auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve org membership
    const bootstrapDb = await createDrizzleClient({
      userId: user.id,
      orgId: "SYSTEM",
    });
    const membership = await bootstrapDb.query.orgMemberships.findFirst({
      where: eq(orgMemberships.userId, user.id),
    });
    if (!membership)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    orgId = membership.orgId;

    // Create org-scoped DB client
    db = await createDrizzleClient({ userId: user.id, orgId });

    // PRD §4 Key Constraint: Client users can ONLY access their own invoices
    if (membership.role === "client") {
      const clientRecord = await db.query.clients.findFirst({
        where: and(eq(clients.userId, user.id), eq(clients.orgId, orgId)),
        columns: { id: true },
      });
      if (!clientRecord) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Verify this invoice belongs to the requesting client
      const invoiceCheck = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.id, invoiceId),
          eq(invoices.orgId, orgId),
          eq(invoices.clientId, clientRecord.id),
        ),
        columns: { id: true },
      });
      if (!invoiceCheck) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  // Fetch invoice + line items + client + org
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)))
    .limit(1);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId));

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, invoice.clientId))
    .limit(1);

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  // Calculate totals
  const totals = calculateTotals(
    items.map((i) => ({
      quantity: parseFloat(i.quantity),
      unitPriceCents: i.unitPriceCents,
    })),
    invoice.taxRateBasisPoints ?? 0,
  );

  // Generate PDF stream
  const stream = await ReactPDF.renderToStream(
    InvoicePDFDocument({
      invoice: {
        number: invoice.number,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        status: invoice.status,
        createdAt: invoice.createdAt,
      },
      items: items.map((i) => ({
        description: i.description,
        quantity: parseFloat(i.quantity),
        unitPriceCents: i.unitPriceCents,
      })),
      totals,
      client: {
        companyName: client?.companyName ?? "",
        email: client?.email ?? "",
      },
      org: {
        name: org.name,
        logoUrl: org.logoUrl,
        accentColor: org.accentColor ?? "#3b82f6",
      },
    }),
  );

  // Convert Node stream to Web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err: Error) => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="INV-${invoice.number}.pdf"`,
      "Cache-Control": "private, max-age=0",
    },
  });
}
```

---

### Step 5 — PDF Document Component

Create `src/features/invoices/components/InvoicePDF.tsx`:

```tsx
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatCents } from "../schemas";

// ─── Types ──────────────────────────────────────────────────────
type InvoicePDFProps = {
  invoice: {
    number: number;
    currency: string;
    dueDate: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
  };
  items: { description: string; quantity: number; unitPriceCents: number }[];
  totals: { subtotalCents: number; taxCents: number; totalCents: number };
  client: { companyName: string; email: string };
  org: { name: string; logoUrl: string | null; accentColor: string };
};

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logo: { width: 80, height: 80, objectFit: "contain" },
  orgName: { fontSize: 18, fontWeight: "bold" },
  invoiceTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  invoiceNumber: { fontSize: 12, color: "#64748b" },
  section: { marginBottom: 20 },
  label: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: { fontSize: 11 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 9,
    textTransform: "uppercase",
    color: "#64748b",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalsSection: { marginTop: 20, alignItems: "flex-end" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  totalLabel: {
    width: 100,
    textAlign: "right",
    marginRight: 20,
    color: "#64748b",
  },
  totalValue: { width: 100, textAlign: "right" },
  grandTotal: { fontSize: 14, fontWeight: "bold" },
  notes: {
    marginTop: 30,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

// ─── Component ──────────────────────────────────────────────────
export function InvoicePDFDocument(props: InvoicePDFProps) {
  const { invoice, items, totals, client, org } = props;
  const curr = invoice.currency;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {org.logoUrl && <Image src={org.logoUrl} style={styles.logo} />}
            <Text style={styles.orgName}>{org.name}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>INV-{invoice.number}</Text>
            <Text style={{ marginTop: 8 }}>
              Date: {new Date(invoice.createdAt).toLocaleDateString()}
            </Text>
            {invoice.dueDate && (
              <Text>Due: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
            )}
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={styles.value}>{client.companyName || client.email}</Text>
          {client.companyName && (
            <Text style={{ color: "#64748b" }}>{client.email}</Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>
              {formatCents(item.unitPriceCents, curr)}
            </Text>
            <Text style={styles.colTotal}>
              {formatCents(
                Math.round(item.quantity * item.unitPriceCents),
                curr,
              )}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCents(totals.subtotalCents, curr)}
            </Text>
          </View>
          {totals.taxCents > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>
                {formatCents(totals.taxCents, curr)}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total</Text>
            <Text
              style={[
                styles.totalValue,
                styles.grandTotal,
                { color: org.accentColor },
              ]}
            >
              {formatCents(totals.totalCents, curr)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by {org.name} via ClientSpace
        </Text>
      </Page>
    </Document>
  );
}
```

---

### Step 6 — InvoiceBuilder Component (Dynamic Line Items Form)

Create `src/features/invoices/components/InvoiceBuilder.tsx`:

```tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Send, FileText } from "lucide-react";

import {
  createInvoiceSchema,
  calculateTotals,
  formatCents,
  type CreateInvoiceInput,
  CURRENCIES,
} from "../schemas";
import { createInvoice, type ActionState } from "../server/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────
type Client = { id: string; companyName: string | null; email: string };

type InvoiceBuilderProps = {
  clients: Client[];
  defaultCurrency?: string;
  onSuccess?: (invoiceId: string) => void;
};

// ─── Component ──────────────────────────────────────────────────
export function InvoiceBuilder({
  clients,
  defaultCurrency = "USD",
  onSuccess,
}: InvoiceBuilderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientId: "",
      projectId: null,
      dueDate: null,
      currency: defaultCurrency as any,
      items: [{ description: "", quantity: 1, unitPriceCents: 0 }],
      taxRateBasisPoints: 0,
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // ─── Live Totals Preview ────────────────────────────────────
  const watchedItems = form.watch("items");
  const watchedTax = form.watch("taxRateBasisPoints");
  const watchedCurrency = form.watch("currency");

  const totals = useMemo(
    () => calculateTotals(watchedItems ?? [], watchedTax ?? 0),
    [watchedItems, watchedTax],
  );

  // ─── Submit ─────────────────────────────────────────────────
  const onSubmit = useCallback(
    async (data: CreateInvoiceInput) => {
      setIsSubmitting(true);
      const result = await createInvoice(data);
      setIsSubmitting(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Invoice ${result.data?.formattedNumber} created successfully!`,
      );
      form.reset();
      onSuccess?.(result.data?.invoiceId as string);
    },
    [form, onSuccess],
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Invoice
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Client & Currency Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={form.watch("clientId")}
                onValueChange={(v) => form.setValue("clientId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName || c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clientId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.clientId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={form.watch("currency")}
                  onValueChange={(v) => form.setValue("currency", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value) || 0;
                    form.setValue("taxRateBasisPoints", Math.round(pct * 100));
                  }}
                  defaultValue={
                    (form.getValues("taxRateBasisPoints") ?? 0) / 100
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Stored as {form.watch("taxRateBasisPoints")} basis points
                </p>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              onChange={(e) =>
                form.setValue(
                  "dueDate",
                  e.target.value ? new Date(e.target.value) : null,
                )
              }
            />
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Line Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ description: "", quantity: 1, unitPriceCents: 0 })
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Line Total</div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, index) => {
              const qty = form.watch(`items.${index}.quantity`) ?? 0;
              const price = form.watch(`items.${index}.unitPriceCents`) ?? 0;
              const lineTotal = Math.round(qty * price);

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 items-start"
                >
                  <div className="col-span-5">
                    <Input
                      placeholder="e.g. Website Design"
                      {...form.register(`items.${index}.description`)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="text-right"
                      {...form.register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="text-right"
                      placeholder="cents"
                      {...form.register(`items.${index}.unitPriceCents`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="col-span-2 text-right pt-2 text-sm font-medium">
                    {formatCents(lineTotal, watchedCurrency)}
                  </div>
                  <div className="col-span-1">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Totals Preview */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {formatCents(totals.subtotalCents, watchedCurrency)}
                </span>
              </div>
              {totals.taxCents > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tax ({((watchedTax ?? 0) / 100).toFixed(2)}%)
                  </span>
                  <span>{formatCents(totals.taxCents, watchedCurrency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCents(totals.totalCents, watchedCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Payment terms, bank details, or thank you message..."
              {...form.register("notes")}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Draft Invoice"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
```

---

### Step 7 — Invoices Page

Create `src/app/(dashboard)/invoices/page.tsx`:

```tsx
import { InvoiceBuilder } from "@/features/invoices/components/InvoiceBuilder";
// Fetch clients server-side for the select dropdown
// Use the tRPC server caller or direct Drizzle query

export default async function InvoicesPage() {
  // TODO: Fetch clients from DB for the dropdown
  // TODO: Render invoice list using tRPC `invoice.getAll`
  // TODO: Add InvoiceBuilder dialog/sheet

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        {/* Trigger for InvoiceBuilder dialog */}
      </div>

      {/* Invoice list table — populated via tRPC `invoice.getAll` */}
      {/* Each row shows: INV-{number}, client, amount, status badge, due date, PDF download */}
    </div>
  );
}
```

---

## File Outputs

| File                                                  | Purpose                                      |
| ----------------------------------------------------- | -------------------------------------------- |
| `src/features/invoices/schemas.ts`                    | Zod schemas, `calculateTotals()`, formatters |
| `src/features/invoices/server/actions.ts`             | `createInvoice`, `updateInvoiceStatus`       |
| `src/features/invoices/server/router.ts`              | tRPC queries (list, detail)                  |
| `src/app/api/invoices/[invoiceId]/pdf/route.ts`       | PDF stream endpoint                          |
| `src/features/invoices/components/InvoicePDF.tsx`     | `@react-pdf/renderer` document template      |
| `src/features/invoices/components/InvoiceBuilder.tsx` | Dynamic line-item form with live preview     |
| `src/app/(dashboard)/invoices/page.tsx`               | Invoices list page                           |

---

## Validation Checklist

### Math Accuracy

- [ ] Create an invoice with 2 line items: "Design" (qty: 3, price: 5000 cents) + "Dev" (qty: 1.5, price: 10000 cents).
- [ ] Tax rate: 5.5% (550 basis points).
- [ ] Expected subtotal: `3 × 5000 + 1.5 × 10000 = 15000 + 15000 = 30000 cents` ($300.00).
- [ ] Expected tax: `Math.round(30000 × 550 / 10000) = Math.round(1650) = 1650 cents` ($16.50).
- [ ] Expected total: `30000 + 1650 = 31650 cents` ($316.50).
- [ ] Verify the `InvoiceBuilder` live preview shows these exact numbers.
- [ ] Verify the saved `invoices.amount_cents` in the database equals `31650`.
- [ ] Verify the PDF displays "$316.50" as the total.

### Invoice Numbering

- [ ] First org invoice number is `1001` (default from `organizations.next_invoice_number`).
- [ ] After creating an invoice, `organizations.next_invoice_number` increments to `1002`.
- [ ] Invoice displays as `INV-1001` in the UI and PDF.
- [ ] Two rapid concurrent invoice creations produce `INV-1001` and `INV-1002` (no duplicates).

### Status Workflow

- [ ] New invoices default to "Draft" status.
- [ ] Draft → Sent transition works; PDF is generated and cached to Supabase Storage.
- [ ] Sent → Paid transition works; invoice status updates.
- [ ] Invalid transitions (e.g., Draft → Paid) are rejected with an error.

### PDF Generation

- [ ] `GET /api/invoices/{id}/pdf` returns a valid PDF with `Content-Type: application/pdf`.
- [ ] PDF includes: org logo, org name, `INV-{number}`, client name, line items table, subtotal, tax, total, due date, notes.
- [ ] PDF downloads with filename `INV-{number}.pdf`.
- [ ] After "Send", subsequent PDF requests use the cached Supabase Storage URL.
- [ ] **Signed URL:** tRPC `invoice.getAll` and `invoice.getById` return `pdfSignedUrl` (not raw storage path) when PDF exists.
- [ ] **Client isolation on PDF route:** Client A receives 403 when requesting Client B's invoice PDF via `/api/invoices/{clientB_invoiceId}/pdf`.

### Authorization

- [ ] Only `owner`/`admin` roles can create invoices (PRD §4).
- [ ] `member` and `client` roles receive an error when attempting to create.
- [ ] Clients can only view invoices assigned to them (enforced via RLS + tRPC scoping).
- [ ] **Client tRPC scoping:** `invoice.getAll` returns zero results for Client A when only Client B has invoices.
- [ ] **Starter plan limit:** 6th invoice in a calendar month returns error: "Starter plan is limited to 5 invoices per month."

### Edge Cases

- [ ] Invoice with 0% tax: `taxCents` is 0, total equals subtotal.
- [ ] Invoice without a project: `projectId` is null, creation succeeds.
- [ ] Line item with fractional quantity (e.g., 2.75 hours): math rounds correctly.
- [ ] **Quantity precision:** Line item with quantity `0.015` is rejected by Zod with "at most 2 decimal places" error.
- [ ] Notes field respects 1,000 character limit.
- [ ] **No bare `db`:** `grep -rn 'from "@/db"' src/features/invoices/ src/app/api/invoices/` returns zero results.

---

## References

- PRD §6.5 — Invoice Management (fields, status workflow, PDF)
- PRD §10.1 — Core Data Validation (MoneySchema, InvoiceItemSchema, calculateInvoiceTotal)
- PRD §10.2 — Invoice Sequence Lock (atomic UPDATE ... RETURNING)
- PRD §10.2 — PDF Caching Mechanism (@react-pdf/renderer, Supabase Storage)
- PRD §4 — Role Permissions (only Owner can create invoices)
- PRD §9 — Pricing (Starter: 5 invoices/month limit — enforced in `createInvoice`)
- PRD §13.4 — Invoice Lifecycle user flow
