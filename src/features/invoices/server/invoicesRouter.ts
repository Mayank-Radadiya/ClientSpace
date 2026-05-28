import { createTRPCRouter, protectedProcedure, rateLimitedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { getInvoiceList, getInvoiceDetail, getProjectFinancialsCached } from "./queries";
import { createInvoiceInDb, updateInvoiceStatusInDb, deleteInvoicesInDb } from "./mutations";
import {
  createInvoiceSchema,
  listInvoicesSchema,
  invoiceIdSchema,
  updateInvoiceInputSchema,
  deleteInvoicesSchema,
  projectFinancialsSchema,
} from "../schemas";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { clients, invoices } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";

export const invoicesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listInvoicesSchema)
    .query(async ({ ctx, input }) => {
      try {
        let clientId = input.clientId;
        if (ctx.role === "client") {
          const db = await createDrizzleClient();
          const clientRecord = await db.query.clients.findFirst({
            where: and(
              eq(clients.userId, ctx.userId),
              eq(clients.orgId, ctx.orgId)
            ),
            columns: { id: true },
          });
          if (!clientRecord) {
            return { items: [] };
          }
          clientId = clientRecord.id;
        }

        const items = await getInvoiceList(ctx.orgId, ctx.userId, input.status, clientId, input.projectId);
        return {
          items,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list invoices.",
        });
      }
    }),

  byId: protectedProcedure
    .input(invoiceIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        const invoice = await getInvoiceDetail(ctx.orgId, ctx.userId, input.id);
        if (!invoice) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found.",
          });
        }

        if (ctx.role === "client") {
          const db = await createDrizzleClient();
          const clientRecord = await db.query.clients.findFirst({
            where: and(
              eq(clients.userId, ctx.userId),
              eq(clients.orgId, ctx.orgId)
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

        return invoice;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch invoice details.",
        });
      }
    }),

  create: rateLimitedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can create invoices.",
        });
      }
      try {
        return await createInvoiceInDb(ctx.orgId, {
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create invoice.",
        });
      }
    }),

  update: rateLimitedProcedure
    .input(updateInvoiceInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can update invoice status.",
        });
      }
      try {
        // pdfUrl is now managed exclusively by the Inngest worker
        return await updateInvoiceStatusInDb(ctx.orgId, input.id, input.status);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update invoice status.",
        });
      }
    }),

  delete: rateLimitedProcedure
    .input(deleteInvoicesSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can delete invoices.",
        });
      }
      try {
        return await deleteInvoicesInDb(ctx.orgId, input.invoiceIds);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete invoices.",
        });
      }
    }),

  getProjectFinancials: protectedProcedure
    .input(projectFinancialsSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await getProjectFinancialsCached(ctx.orgId, ctx.userId, input.projectId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project financials.",
        });
      }
    }),

  /**
   * Manually re-trigger PDF generation for an invoice.
   * Rate-limited: cannot re-trigger within 60 seconds of the last generation attempt.
   * Used by the UI "Retry PDF" button when pdfStatus = 'failed'.
   */
  regeneratePdf: rateLimitedProcedure
    .input(invoiceIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can regenerate invoice PDFs.",
        });
      }

      const db = await createDrizzleClient();

      // Fetch current invoice to check pdfGeneratedAt for rate-limiting
      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.id, input.id),
          eq(invoices.orgId, ctx.orgId),
        ),
        columns: {
          id: true,
          orgId: true,
          pdfGeneratedAt: true,
          pdfStatus: true,
          status: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found.",
        });
      }

      // Rate limit: prevent re-generation within 60 seconds of the last attempt
      if (invoice.pdfGeneratedAt) {
        const secondsSinceLastAttempt =
          (Date.now() - new Date(invoice.pdfGeneratedAt).getTime()) / 1000;
        if (secondsSinceLastAttempt < 60) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `PDF was last generated ${Math.ceil(secondsSinceLastAttempt)}s ago. Please wait ${Math.ceil(60 - secondsSinceLastAttempt)}s before retrying.`,
          });
        }
      }

      // Reset pdfStatus to 'pending' so the UI shows the spinner immediately
      await db
        .update(invoices)
        .set({ pdfStatus: "pending", updatedAt: new Date() })
        .where(and(eq(invoices.id, input.id), eq(invoices.orgId, ctx.orgId)));

      // Dispatch the Inngest event — generation happens in background
      await inngest.send({
        name: "invoices/generate.pdf.requested",
        data: { invoiceId: input.id, orgId: ctx.orgId },
      });

      return { ok: true };
    }),
});
