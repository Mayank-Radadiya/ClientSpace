import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { getDashboardStatsCached, getRevenueChartCached } from "./queries";

export const analyticsRouter = createTRPCRouter({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    return getDashboardStatsCached(ctx.orgId, ctx.userId);
  }),

  getRevenueChart: protectedProcedure.query(async ({ ctx }) => {
    return getRevenueChartCached(ctx.orgId, ctx.userId);
  }),
});
