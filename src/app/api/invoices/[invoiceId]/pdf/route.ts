// src/app/api/invoices/[invoiceId]/pdf/route.ts
// PDF generation and download route.
//
// Two auth modes:
// 1. Internal: x-internal-secret header (called by updateInvoiceStatus action)
// 2. External: Supabase session cookie (browser download)
//
// Fast path: If invoice.pdfUrl is set → redirect to 1-hour signed URL (302)
// Slow path: Generate PDF on-the-fly from invoice + line items + client + org data

import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  clients,
  invoiceLineItems,
  invoices,
  organizations,
} from "@/db/schema";
import { withRLS } from "@/db/createDrizzleClient";
import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDF } from "@/features/invoices/components/InvoicePDF";
import { calculateTotals } from "@/features/invoices/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
): Promise<NextResponse> {
  const { invoiceId } = await params;

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  // ── Auth Resolution ────────────────────────────────────────────────────────

  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal =
    internalSecret &&
    process.env.INTERNAL_API_SECRET &&
    internalSecret === process.env.INTERNAL_API_SECRET;

  let orgId: string;
  let userId: string;
  let role: string;

  if (isInternal) {
    // Internal mode: bootstrap with SYSTEM to resolve orgId from invoice
    const invoice = await withRLS(
      { userId: "SYSTEM", orgId: "SYSTEM" },
      async (tx) => {
        return tx.query.invoices.findFirst({
          where: eq(invoices.id, invoiceId),
          columns: { orgId: true },
        });
      },
    );
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    orgId = invoice.orgId;
    userId = "INTERNAL";
    role = "admin"; // Internal calls have full access
  } else {
    // External mode: validate session
    const ctx = await getSessionContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    orgId = ctx.orgId;
    userId = ctx.userId;
    role = ctx.role;
  }

  // ── Fetch Invoice ──────────────────────────────────────────────────────────

  try {
    const invoice = await withRLS({ userId, orgId }, async (tx) => {
      return tx.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)),
        with: {
          client: {
            columns: {
              id: true,
              companyName: true,
              email: true,
              contactName: true,
              userId: true,
            },
          },
        },
      });
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Client role: verify invoice belongs to their record
    if (role === "client" && !isInternal) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || invoice.client?.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Fast Path: Redirect to signed URL ─────────────────────────────────

    if (invoice.pdfUrl) {
      const supabase = await createClient();
      const { data } = await supabase.storage
        .from("project-files")
        .createSignedUrl(invoice.pdfUrl, 3600);

      if (data?.signedUrl) {
        return NextResponse.redirect(data.signedUrl, { status: 302 });
      }
      // Signed URL creation failed — fall through to on-the-fly generation
    }

    // ── Slow Path: Generate PDF on-the-fly ────────────────────────────────

    const [items, org] = await Promise.all([
      withRLS({ userId, orgId }, async (tx) => {
        return tx.query.invoiceLineItems.findMany({
          where: eq(invoiceLineItems.invoiceId, invoiceId),
          columns: {
            id: true,
            description: true,
            quantity: true,
            unitPriceCents: true,
          },
        });
      }),
      withRLS({ userId, orgId }, async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, orgId),
          columns: {
            name: true,
            logoUrl: true,
            accentColor: true,
          },
        });
      }),
    ]);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Normalize items for calculation (quantity stored as string from numeric column)
    const normalizedItems = items.map((item) => ({
      description: item.description,
      quantity: parseFloat(item.quantity as string),
      unitPriceCents: item.unitPriceCents,
    }));

    const totals = calculateTotals(
      normalizedItems,
      invoice.taxRateBasisPoints ?? 0,
    );

    const pdfDoc = InvoicePDF({
      invoice: {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        currency: invoice.currency as "USD" | "EUR" | "GBP" | "CAD" | "AUD",
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        createdAt: invoice.createdAt,
      },
      items: normalizedItems,
      totals,
      client: invoice.client
        ? {
            companyName: invoice.client.companyName ?? null,
            email: invoice.client.email,
            contactName: invoice.client.contactName ?? null,
          }
        : { companyName: null, email: "", contactName: null },
      org: {
        name: org.name,
        logoUrl: org.logoUrl ?? null,
        accentColor: org.accentColor ?? "#3b82f6",
      },
    });

    const buffer = await renderToBuffer(pdfDoc);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="INV-${invoice.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[PDF Route] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
