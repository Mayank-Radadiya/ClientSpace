// src/inngest/functions/invoices/retryFailedPdfs.ts
// Nightly cron: re-queues PDF generation for all invoices where pdfStatus = 'failed'.
// Runs at 2am daily. Targets 'sent', 'overdue', and 'paid' invoices only —
// 'draft' invoices don't need PDFs until they are sent.
//
// Security: uses raw DB access (no RLS) to scan across all orgs for failed PDFs.
// The re-dispatched event re-validates orgId in the generate-pdf function.

import { eq, inArray, and } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { invoices } from "@/db/schema";

export const retryFailedPdfs = inngest.createFunction(
  {
    id: "invoices-retry-failed-pdfs",
    retries: 0, // Cron job itself should not retry — individual dispatches handle retries
  },
  {
    cron: "0 2 * * *", // 2:00 AM UTC daily
  },
  async ({ step }) => {
    // Find all invoices with failed PDF generation that are in a "send-ready" state
    const failedInvoices = await step.run("find-failed-pdfs", async () => {
      const db = await createDrizzleClient();

      return db.query.invoices.findMany({
        where: and(
          eq(invoices.pdfStatus, "failed"),
          inArray(invoices.status, ["sent", "overdue", "paid"]),
        ),
        columns: {
          id: true,
          orgId: true,
          number: true,
        },
        limit: 200, // Safety cap — prevents runaway on large backlogs
      });
    });

    if (failedInvoices.length === 0) {
      return { ok: true, retried: 0 };
    }

    // Re-dispatch PDF generation for each failed invoice
    await step.run("redispatch-pdf-jobs", async () => {
      await inngest.send(
        failedInvoices.map((invoice) => ({
          name: "invoices/generate.pdf.requested" as const,
          data: {
            invoiceId: invoice.id,
            orgId: invoice.orgId,
          },
        })),
      );
    });

    return {
      ok: true,
      retried: failedInvoices.length,
      invoiceIds: failedInvoices.map((i) => i.id),
    };
  },
);
