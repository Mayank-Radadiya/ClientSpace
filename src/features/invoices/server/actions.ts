"use server";

// src/features/invoices/server/actions.ts
// Server Actions for invoice mutations: create and status transitions.
// All operations are RLS-scoped, RBAC-checked, and atomically safe.

import { revalidatePath } from "next/cache";
import { and, count, eq, gte, sql } from "drizzle-orm";
import {
  clients,
  invoiceLineItems,
  invoices,
  organizations,
  projects,
} from "@/db/schema";
import { withRLS } from "@/db/createDrizzleClient";
import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  calculateTotals,
  canTransition,
  createInvoiceSchema,
  type CreateInvoiceInput,
  type InvoiceStatus,
  updateInvoiceStatusSchema,
  type UpdateInvoiceStatusInput,
} from "../schemas";

export type ActionState<T = undefined> = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
};

// ─── createInvoice ────────────────────────────────────────────────────────────

export type CreateInvoiceResult = {
  invoiceId: string;
  invoiceNumber: number;
  formattedNumber: string;
  totalCents: number;
};

/**
 * Creates a new invoice atomically:
 * 1. Auth + RBAC (owner/admin only)
 * 2. Plan limits (Starter: 5/month)
 * 3. Zod validation
 * 4. FK verification (client + optional project)
 * 5. Server-side total calculation
 * 6. Atomic invoice number assignment (UPDATE...RETURNING)
 * 7. Transaction: INSERT invoice + line items
 */
export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<ActionState<CreateInvoiceResult>> {
  // 1. Auth & RBAC
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in." };
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only Admins and Owners can create invoices." };
  }

  // 2. Zod validation
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const data = parsed.data;

  return withRLS(ctx, async (tx) => {
    // 3. Plan limit check (Starter: 5 invoices/month)
    const org = await tx.query.organizations.findFirst({
      where: eq(organizations.id, ctx.orgId),
      columns: { plan: true },
    });

    if (org?.plan === "starter") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [countResult] = await tx
        .select({ value: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.orgId, ctx.orgId),
            gte(invoices.createdAt, startOfMonth),
          ),
        );

      if ((countResult?.value ?? 0) >= 5) {
        return {
          error:
            "You have reached the 5 invoice/month limit on the Starter plan. Upgrade to Pro to create more invoices.",
        };
      }
    }

    // 4. FK verification — client must belong to this org
    const client = await tx.query.clients.findFirst({
      where: and(eq(clients.id, data.clientId), eq(clients.orgId, ctx.orgId)),
      columns: { id: true },
    });
    if (!client) return { error: "Client not found in your organization." };

    // Optional project FK verification
    if (data.projectId) {
      const project = await tx.query.projects.findFirst({
        where: and(
          eq(projects.id, data.projectId),
          eq(projects.orgId, ctx.orgId),
        ),
        columns: { id: true },
      });
      if (!project) return { error: "Project not found in your organization." };
    }

    // 5. Server-side math — NEVER trust client-submitted total
    const { total: totalCents } = calculateTotals(
      data.items,
      data.taxRateBasisPoints,
    );

    // 6. Atomic invoice number assignment
    // UPDATE...RETURNING guarantees uniqueness under concurrent requests (Postgres row-level lock)
    const [orgUpdate] = await tx
      .update(organizations)
      .set({
        nextInvoiceNumber: sql`${organizations.nextInvoiceNumber} + 1`,
      })
      .where(eq(organizations.id, ctx.orgId))
      .returning({ nextInvoiceNumber: organizations.nextInvoiceNumber });

    if (!orgUpdate) return { error: "Failed to assign invoice number." };

    // The org now has nextInvoiceNumber = N+1, so claimed number = N (the old value)
    const claimedNumber = orgUpdate.nextInvoiceNumber - 1;

    // 7. Insert invoice + line items in a single transaction
    let newInvoiceId: string;
    try {
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          orgId: ctx.orgId,
          clientId: data.clientId,
          projectId: data.projectId ?? null,
          number: claimedNumber,
          status: "draft",
          dueDate: data.dueDate ?? null,
          currency: data.currency,
          amountCents: totalCents,
          taxRateBasisPoints: data.taxRateBasisPoints,
          notes: data.notes ?? null,
        })
        .returning({ id: invoices.id });

      if (!newInvoice) return { error: "Failed to create invoice." };
      newInvoiceId = newInvoice.id;

      await tx.insert(invoiceLineItems).values(
        data.items.map((item) => ({
          invoiceId: newInvoiceId,
          description: item.description,
          quantity: item.quantity.toString(), // numeric column expects string
          unitPriceCents: item.unitPriceCents,
        })),
      );
    } catch (err) {
      console.error("[createInvoice] DB error:", err);
      return { error: "Failed to save invoice. Please try again." };
    }

    revalidatePath("/dashboard/invoices");

    return {
      success: true,
      data: {
        invoiceId: newInvoiceId,
        invoiceNumber: claimedNumber,
        formattedNumber: `INV-${claimedNumber}`,
        totalCents,
      },
    };
  });
}

// ─── updateInvoiceStatus ──────────────────────────────────────────────────────

/**
 * Transitions an invoice to a new status:
 * - Enforces VALID_TRANSITIONS state machine
 * - On → "sent": Calls PDF route internally and uploads to Storage (best-effort)
 * - On → "paid": Sets paidAt timestamp
 */
export async function updateInvoiceStatus(
  input: UpdateInvoiceStatusInput,
): Promise<ActionState> {
  // 1. Auth & RBAC
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in." };
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only Admins and Owners can update invoice status." };
  }

  // 2. Zod validation
  const parsed = updateInvoiceStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input." };
  }
  const { invoiceId, status: newStatus } = parsed.data;

  return withRLS(ctx, async (tx) => {
    // 3. Fetch current invoice (enforces orgId filter — critical for multi-tenancy)
    const invoice = await tx.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.orgId, ctx.orgId)),
      columns: { id: true, status: true, pdfUrl: true, number: true },
    });

    if (!invoice) return { error: "Invoice not found." };

    // 4. Validate state transition
    if (!canTransition(invoice.status as InvoiceStatus, newStatus)) {
      return {
        error: `Cannot transition invoice from "${invoice.status}" to "${newStatus}".`,
      };
    }

    // 5. Build update values
    const updateValues: Partial<typeof invoices.$inferInsert> = {
      status: newStatus,
      updatedAt: new Date(),
      ...(newStatus === "paid" ? { paidAt: new Date() } : {}),
    };

    // 6. PDF caching on → "sent" (best-effort: status update succeeds even if PDF fails)
    if (newStatus === "sent" && !invoice.pdfUrl) {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const pdfPath = `invoices/${ctx.orgId}/${invoiceId}.pdf`;

        const pdfResponse = await fetch(
          `${baseUrl}/api/invoices/${invoiceId}/pdf`,
          {
            headers: {
              "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
            },
            signal: AbortSignal.timeout(30_000), // 30-second timeout
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
          } else {
            console.error(
              "[updateInvoiceStatus] PDF upload failed:",
              uploadError,
            );
            // Non-fatal: status still changes, PDF can be regenerated on demand
          }
        } else {
          console.error(
            "[updateInvoiceStatus] PDF fetch failed:",
            pdfResponse.status,
          );
        }
      } catch (err) {
        console.error("[updateInvoiceStatus] PDF caching error:", err);
        // Non-fatal: continue with status update
      }
    }

    // 7. Update invoice
    await tx
      .update(invoices)
      .set(updateValues)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, ctx.orgId)));

    revalidatePath("/dashboard/invoices");

    return { success: true };
  });
}
