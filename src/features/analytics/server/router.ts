import { and, count, eq, sql, sum } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, invoices, projects } from "@/db/schema";

export const analyticsRouter = createTRPCRouter({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      const [revenueRows, outstandingRows, projectsRows, clientsRows] =
        await Promise.all([
          tx
            .select({ value: sum(invoices.amountCents) })
            .from(invoices)
            .where(and(eq(invoices.orgId, ctx.orgId), eq(invoices.status, "paid"))),

          tx
            .select({ value: sum(invoices.amountCents) })
            .from(invoices)
            .where(
              and(
                eq(invoices.orgId, ctx.orgId),
                sql`${invoices.status} IN ('draft', 'sent')`,
              ),
            ),

          tx
            .select({ value: count() })
            .from(projects)
            .where(
              and(
                eq(projects.orgId, ctx.orgId),
                sql`${projects.status} != 'archived'`,
              ),
            ),

          tx
            .select({ value: count() })
            .from(clients)
            .where(
              and(eq(clients.orgId, ctx.orgId), eq(clients.status, "active")),
            ),
        ]);

      return {
        revenueTotalCents: Number(revenueRows[0]?.value ?? 0),
        outstandingCents: Number(outstandingRows[0]?.value ?? 0),
        activeProjects: Number(projectsRows[0]?.value ?? 0),
        activeClients: Number(clientsRows[0]?.value ?? 0),
      };
    });
  }),

  getRevenueChart: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      const monthTrunc = sql`DATE_TRUNC('month', ${invoices.paidAt})`;

      const rows = await tx
        .select({
          month: sql<string>`TO_CHAR(${monthTrunc}, 'Mon YYYY')`,
          monthKey: sql<string>`TO_CHAR(${monthTrunc}, 'YYYY-MM')`,
          amountCents: sum(invoices.amountCents),
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.orgId, ctx.orgId),
            eq(invoices.status, "paid"),
            sql`${invoices.paidAt} >= NOW() - INTERVAL '12 months'`,
          ),
        )
        .groupBy(monthTrunc)
        .orderBy(monthTrunc);

      return rows.map((row) => ({
        month: row.month,
        monthKey: row.monthKey,
        amountCents: Number(row.amountCents ?? 0),
      }));
    });
  }),
});
