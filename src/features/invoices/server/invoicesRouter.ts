import { z } from "zod";
import { createTRPCRouter, protectedProcedure, rateLimitedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { getInvoiceList, getInvoiceDetail, getProjectFinancialsCached } from "./queries";
import { createInvoiceInDb, updateInvoiceStatusInDb, deleteInvoicesInDb } from "./mutations";
import { createInvoiceSchema } from "../schemas";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { clients } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const invoicesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
        clientId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
      })
    )
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
    .input(z.object({ id: z.string().uuid("Invalid invoice ID") }))
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
    .input(
      z.object({
        id: z.string().uuid("Invalid invoice ID"),
        status: z.enum(["draft", "sent", "paid", "overdue"]),
        pdfUrl: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can update invoice status.",
        });
      }
      try {
        return await updateInvoiceStatusInDb(ctx.orgId, input.id, input.status, input.pdfUrl);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update invoice status.",
        });
      }
    }),

  delete: rateLimitedProcedure
    .input(z.object({ invoiceIds: z.array(z.string().uuid()) }))
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
    .input(z.object({ projectId: z.string().uuid() }))
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
});
