// src/app/api/invoices/[invoiceId]/pdf/route.ts
// PDF download route.
//
// All PDF generation is now handled asynchronously by the Inngest worker
// (src/inngest/functions/invoices/generatePdf.ts). This route is a pure
// redirect proxy:
//
//   Fast path: invoice.pdfStatus === 'ready' → 302 redirect to public Supabase URL
//   Pending:   pdfStatus = 'pending' | 'generating' → 202 Accepted (UI should poll)
//   Failed:    pdfStatus = 'failed' → 503 with retry guidance
//   No URL:    404
//
// Two auth modes:
//   1. External: Supabase session cookie (browser download)
//   2. Internal: x-internal-secret header (reserved for server-to-server calls)

import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { invoices } from "@/db/schema";
import { withRLS } from "@/db/createDrizzleClient";
import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

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
  const isInternal = (() => {
    if (!internalSecret || !process.env.INTERNAL_API_SECRET) return false;
    try {
      const a = Buffer.from(internalSecret);
      const b = Buffer.from(process.env.INTERNAL_API_SECRET);
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  })();

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
    role = "admin";
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
        columns: {
          pdfUrl: true,
          pdfStatus: true,
          number: true,
          clientId: true,
        },
        with: {
          client: {
            columns: {
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

    // ── Fast Path: Redirect to public Storage URL ─────────────────────────

    if (invoice.pdfStatus === "ready" && invoice.pdfUrl) {
      return NextResponse.redirect(invoice.pdfUrl, { status: 302 });
    }

    // ── Pending: PDF not yet ready ────────────────────────────────────────

    if (
      invoice.pdfStatus === "pending" ||
      invoice.pdfStatus === "generating"
    ) {
      return NextResponse.json(
        {
          error: "PDF is being generated",
          pdfStatus: invoice.pdfStatus,
          message:
            "The PDF for this invoice is being prepared. Please try again in a few seconds.",
        },
        { status: 202 },
      );
    }

    // ── Failed: Generation failed ─────────────────────────────────────────

    if (invoice.pdfStatus === "failed") {
      return NextResponse.json(
        {
          error: "PDF generation failed",
          pdfStatus: "failed",
          message:
            "PDF generation failed for this invoice. Use the Retry PDF button in the dashboard.",
        },
        { status: 503 },
      );
    }

    // ── No PDF URL (unexpected state) ─────────────────────────────────────

    return NextResponse.json(
      {
        error: "PDF not available",
        pdfStatus: invoice.pdfStatus,
        message:
          "No PDF is available for this invoice. Mark it as Sent to trigger generation.",
      },
      { status: 404 },
    );
  } catch (err) {
    console.error("[PDF Route] Error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve PDF" },
      { status: 500 },
    );
  }
}
