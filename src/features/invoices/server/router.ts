// src/features/invoices/server/router.ts
// tRPC router for invoice queries: getAll (list) and getById (detail).
// All procedures are protected and RLS-scoped via withRLS().

import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, invoiceLineItems, invoices } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { INVOICE_STATUSES } from "../schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a 1-hour signed URL for a PDF stored in Supabase Storage.
 * Returns null if path is null or signing fails.
 */
async function getSignedPdfUrl(
  storagePath: string | null,
): Promise<string | null> {
  if (!storagePath) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 3600); // 1 hour
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const invoiceRouter = createTRPCRouter({
  /**
   * invoice.getAll — List invoices for the current org.
   *
   * - Optional status filter
   * - Client role: scoped to their own invoices only
   * - Includes clientCompanyName and clientEmail via LEFT JOIN
   * - Signed PDF URL (1-hour expiry) included when cached
   * - Ordered by createdAt DESC, capped at 100
   */
  getAll: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(INVOICE_STATUSES as unknown as [string, ...string[]])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        // For client role: resolve their client record
        let clientIdFilter: string | null = null;
        if (ctx.role === "client") {
          const clientRecord = await tx.query.clients.findFirst({
            where: and(
              eq(clients.userId, ctx.userId),
              eq(clients.orgId, ctx.orgId),
            ),
            columns: { id: true },
          });
          if (!clientRecord) return [] as never[];
          clientIdFilter = clientRecord.id;
        }

        const results = await tx
          .select({
            id: invoices.id,
            number: invoices.number,
            status: invoices.status,
            currency: invoices.currency,
            amountCents: invoices.amountCents,
            taxRateBasisPoints: invoices.taxRateBasisPoints,
            dueDate: invoices.dueDate,
            pdfUrl: invoices.pdfUrl,
            paidAt: invoices.paidAt,
            createdAt: invoices.createdAt,
            updatedAt: invoices.updatedAt,
            clientId: invoices.clientId,
            projectId: invoices.projectId,
            notes: invoices.notes,
            clientCompanyName: clients.companyName,
            clientEmail: clients.email,
            clientContactName: clients.contactName,
          })
          .from(invoices)
          .leftJoin(clients, eq(invoices.clientId, clients.id))
          .where(
            and(
              eq(invoices.orgId, ctx.orgId),
              ...(input.status
                ? [
                    eq(
                      invoices.status,
                      input.status as "draft" | "sent" | "paid" | "overdue",
                    ),
                  ]
                : []),
              ...(clientIdFilter
                ? [eq(invoices.clientId, clientIdFilter)]
                : []),
            ),
          )
          .orderBy(desc(invoices.createdAt))
          .limit(100);

        return results;
      });
    }),

  /**
   * invoice.getById — Full invoice detail with line items.
   *
   * - Verifies org ownership (critical multi-tenancy check)
   * - Client role: verifies invoice belongs to their client record
   * - Two parallel queries: invoice + line items
   * - Includes signed PDF URL
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid("Invalid invoice ID") }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const invoice = await tx.query.invoices.findFirst({
          where: and(eq(invoices.id, input.id), eq(invoices.orgId, ctx.orgId)),
          with: {
            client: {
              columns: {
                id: true,
                companyName: true,
                email: true,
                contactName: true,
              },
            },
          },
        });

        if (!invoice) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found.",
          });
        }

        // Client role: verify this invoice belongs to their client record
        if (ctx.role === "client") {
          const clientRecord = await tx.query.clients.findFirst({
            where: and(
              eq(clients.userId, ctx.userId),
              eq(clients.orgId, ctx.orgId),
            ),
            columns: { id: true },
          });
          if (!clientRecord || invoice.clientId !== clientRecord.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have access to this invoice.",
            });
          }
        }

        // Fetch line items (separate query — O(2) not O(N+1))
        const items = await tx.query.invoiceLineItems.findMany({
          where: eq(invoiceLineItems.invoiceId, input.id),
          columns: {
            id: true,
            description: true,
            quantity: true,
            unitPriceCents: true,
          },
        });

        const pdfSignedUrl = await getSignedPdfUrl(invoice.pdfUrl);

        return {
          ...invoice,
          items,
          pdfSignedUrl,
        };
      });
    }),
});
