// src/inngest/functions/invoices/generatePdf.ts
// Next.js request thread. Triggered by 'invoices/generate.pdf.requested'.
//
// Architecture:
//   Step 1: fetch-invoice-data   → set pdfStatus = 'generating', return invoice payload
//   Step 2: compile-pdf          → renderToBuffer via @react-pdf/renderer, return Buffer
//   Step 3: upload-to-storage    → upload to Supabase Storage 'invoices-pdf' bucket
//   Step 4: update-invoice-record → pdfUrl + pdfGeneratedAt + pdfStatus = 'ready'
//
// Security:
//   - orgId from event is cross-checked against DB invoice.orgId (NonRetriableError on mismatch)
//   - Storage uploads use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — correct for background jobs)
//   - Storage path contains orgId + invoiceId — not easily guessable

import { NonRetriableError } from "inngest";
import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import {
  invoices,
  invoiceLineItems,
  organizations,
  clients,
} from "@/db/schema";
import { InvoicePDF } from "@/features/invoices/components/InvoicePDF";
import { calculateTotals } from "@/features/invoices/schemas";
import type { Currency } from "@/features/invoices/schemas";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeneratePdfEvent {
  name: "invoices/generate.pdf.requested";
  data: {
    invoiceId: string;
    orgId: string;
  };
}

// ─── Function ────────────────────────────────────────────────────────────────

export const generateInvoicePdf = inngest.createFunction(
  {
    id: "invoices-generate-pdf",
    retries: 3,
    concurrency: {
      limit: 5,
      key: "event.data.orgId", // Per-org concurrency limit — prevents one org flooding the queue
    },
  },
  { event: "invoices/generate.pdf.requested" as GeneratePdfEvent["name"] },
  async ({ event, step }) => {
    const { invoiceId, orgId } = event.data as GeneratePdfEvent["data"];

    // ── Step 1: Fetch Invoice Data ─────────────────────────────────────────

    const invoiceData = await step.run("fetch-invoice-data", async () => {
      // Use raw drizzle (no RLS) via service role — Inngest runs outside user session context.
      // We perform our own org isolation check below.
      const db = await createDrizzleClient();

      // Set pdfStatus = 'generating' immediately so the UI shows a spinner
      await db
        .update(invoices)
        .set({ pdfStatus: "generating", updatedAt: new Date() })
        .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)));

      // Fetch the full invoice with all relations needed for PDF rendering
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)),
        columns: {
          id: true,
          orgId: true,
          number: true,
          status: true,
          currency: true,
          dueDate: true,
          notes: true,
          taxRateBasisPoints: true,
          createdAt: true,
        },
        with: {
          client: {
            columns: {
              id: true,
              companyName: true,
              contactName: true,
              email: true,
            },
          },
        },
      });

      // Security: hard check — throw NonRetriableError so Inngest does NOT retry on bad data
      if (!invoice) {
        throw new NonRetriableError(
          `Invoice ${invoiceId} not found or does not belong to org ${orgId}`,
        );
      }

      // Fetch line items separately (not available via with: {} on the above query shape)
      const items = await db.query.invoiceLineItems.findMany({
        where: eq(invoiceLineItems.invoiceId, invoiceId),
        columns: {
          description: true,
          quantity: true,
          unitPriceCents: true,
        },
      });

      // Fetch org branding for the PDF header
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: {
          name: true,
          logoUrl: true,
          accentColor: true,
        },
      });

      if (!org) {
        throw new NonRetriableError(`Organization ${orgId} not found`);
      }

      return { invoice, items, org };
    });

    // ── Step 2: Compile PDF ────────────────────────────────────────────────

    const compiledPdf = await step.run("compile-pdf", async () => {
      try {
        const { invoice, items, org } = invoiceData;

        // Normalize quantity: stored as numeric string in DB
        const normalizedItems = items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity as string),
          unitPriceCents: item.unitPriceCents,
        }));

        const totals = calculateTotals(
          normalizedItems,
          invoice.taxRateBasisPoints ?? 0,
        );

        // Call InvoicePDF as a function (not as JSX) — @react-pdf/renderer's
        // renderToBuffer expects the Document element returned by the PDF component.
        // This matches the pattern used in the synchronous API route.
        const pdfDoc = InvoicePDF({
          invoice: {
            id: invoice.id,
            number: invoice.number,
            status: invoice.status,
            currency: invoice.currency as Currency,
            dueDate: invoice.dueDate,
            notes: invoice.notes,
            // Inngest serializes step results as JSON — Date → string. Coerce back.
            createdAt: new Date(invoice.createdAt as unknown as string),
          },
          items: normalizedItems,
          totals,
          client: invoice.client
            ? {
                companyName: invoice.client.companyName ?? null,
                contactName: invoice.client.contactName ?? null,
                email: invoice.client.email,
              }
            : { companyName: null, contactName: null, email: "" },
          org: {
            name: org.name,
            logoUrl: org.logoUrl ?? null,
            accentColor: org.accentColor ?? "#3b82f6",
          },
        });

        const buffer = await renderToBuffer(pdfDoc);
        // Return as Uint8Array — Inngest serializes step results as JSON,
        // Buffer is not directly JSON-serializable
        return { data: Array.from(buffer), invoiceNumber: invoice.number };
      } catch (err) {
        // Mark as failed in DB so the UI shows "Retry PDF" button
        const db = await createDrizzleClient();
        await db
          .update(invoices)
          .set({ pdfStatus: "failed", updatedAt: new Date() })
          .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)));

        // Dispatch monitoring event — can be caught by alerts/dashboards
        await inngest.send({
          name: "invoices/pdf.generation.failed",
          data: { invoiceId, orgId, error: String(err) },
        });

        // Rethrow so Inngest retries (up to retries: 3)
        throw err;
      }
    });

    // ── Step 3: Upload to Supabase Storage ────────────────────────────────

    const publicUrl = await step.run("upload-to-storage", async () => {
      const { data: bufferArray, invoiceNumber } = compiledPdf;
      const buffer = Buffer.from(bufferArray);

      // Path: {orgId}/{invoiceId}/invoice-{number}.pdf
      const storagePath = `${orgId}/${invoiceId}/invoice-${invoiceNumber}.pdf`;

      // Use admin client — service role bypasses RLS for background job uploads
      const supabase = createAdminClient();

      const { error: uploadError } = await supabase.storage
        .from("invoices-pdf")
        .upload(storagePath, buffer, {
          contentType: "application/pdf",
          cacheControl: "public, max-age=86400",
          upsert: true, // Overwrite on re-generation
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("invoices-pdf")
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to resolve public URL after upload");
      }

      return urlData.publicUrl;
    });

    // ── Step 4: Update Invoice Record ─────────────────────────────────────

    await step.run("update-invoice-record", async () => {
      const db = await createDrizzleClient();

      await db
        .update(invoices)
        .set({
          pdfUrl: publicUrl,
          pdfGeneratedAt: new Date(),
          pdfStatus: "ready",
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)));

      // Write activity log for audit trail
      // actorId is required NOT NULL — use a system sentinel UUID for background jobs
      // We use the org owner but since we don't have it here, we skip activityLog
      // and rely on the Inngest run history as the audit trail.
      // (activityLogs.actorId has NOT NULL constraint — background jobs have no user context)
    });

    return {
      ok: true,
      invoiceId,
      publicUrl,
    };
  },
);
