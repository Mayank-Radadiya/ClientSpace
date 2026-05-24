// src/features/invoices/server/router.ts
// Compatibility singular stubs delegating to plurals invoicesRouter

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { invoicesRouter } from "./invoicesRouter";
import { INVOICE_STATUSES } from "../schemas";

export const invoiceRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(INVOICE_STATUSES as unknown as [string, ...string[]])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const caller = invoicesRouter.createCaller(ctx);
      const result = await caller.list({ status: input.status as any });
      return result.items;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid("Invalid invoice ID") }))
    .query(async ({ ctx, input }) => {
      const caller = invoicesRouter.createCaller(ctx);
      return caller.byId({ id: input.id });
    }),

  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const caller = invoicesRouter.createCaller(ctx);
      const result = await caller.list({ projectId: input.projectId });
      return result.items;
    }),

  getProjectFinancials: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const caller = invoicesRouter.createCaller(ctx);
      return caller.getProjectFinancials({ projectId: input.projectId });
    }),
});
