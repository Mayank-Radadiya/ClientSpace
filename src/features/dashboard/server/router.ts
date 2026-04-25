// src/features/dashboard/server/router.ts
// Dashboard router - provides aggregated metrics, recent activity, and quick insights

import { z } from "zod";
import { desc, eq, gte, sql, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { projects, invoices, assets, activityLogs, clients } from "@/db/schema";

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Calculate start of current month in user's timezone
 */
function getStartOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Format currency amount from cents to display string
 */
function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const dashboardRouter = createTRPCRouter({
  /**
   * Get aggregated metrics for dashboard overview
   * Returns: revenue, project stats, invoice stats, file counts
   */
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      const startOfMonth = getStartOfCurrentMonth();

      // Parallel queries for performance
      const [
        revenueData,
        projectStats,
        invoiceStats,
        fileStats,
        monthlyFileCount,
      ] = await Promise.all([
        // 1. Revenue: Sum of paid invoices (current month)
        tx
          .select({
            total: sql<number>`COALESCE(SUM(${invoices.amountCents}), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.orgId, ctx.orgId),
              eq(invoices.status, "paid"),
              gte(invoices.updatedAt, startOfMonth),
            ),
          ),

        // 2. Project stats: total count + active count
        tx
          .select({
            total: sql<number>`COUNT(*)`,
            active: sql<number>`COUNT(*) FILTER (WHERE ${projects.status} IN ('not_started', 'in_progress', 'review'))`,
          })
          .from(projects)
          .where(eq(projects.orgId, ctx.orgId)),

        // 3. Invoice stats: pending count + pending amount
        tx
          .select({
            count: sql<number>`COUNT(*)`,
            amount: sql<number>`COALESCE(SUM(${invoices.amountCents}), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.orgId, ctx.orgId),
              sql`${invoices.status} IN ('sent', 'overdue')`,
            ),
          ),

        // 4. Total file count
        tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(assets)
          .where(eq(assets.orgId, ctx.orgId)),

        // 5. Files uploaded this month
        tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(assets)
          .where(
            and(
              eq(assets.orgId, ctx.orgId),
              gte(assets.createdAt, startOfMonth),
            ),
          ),
      ]);

      return {
        revenue: {
          total: Number(revenueData[0]?.total ?? 0),
          formatted: formatCurrency(Number(revenueData[0]?.total ?? 0)),
          period: "current_month",
        },
        projects: {
          total: Number(projectStats[0]?.total ?? 0),
          active: Number(projectStats[0]?.active ?? 0),
        },
        invoices: {
          pendingCount: Number(invoiceStats[0]?.count ?? 0),
          pendingAmount: Number(invoiceStats[0]?.amount ?? 0),
          pendingAmountFormatted: formatCurrency(
            Number(invoiceStats[0]?.amount ?? 0),
          ),
        },
        files: {
          total: Number(fileStats[0]?.count ?? 0),
          thisMonth: Number(monthlyFileCount[0]?.count ?? 0),
        },
      };
    });
  }),

  /**
   * Get recent projects (top 5 by updatedAt)
   */
  getRecentProjects: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      const recentProjects = await tx.query.projects.findMany({
        where: eq(projects.orgId, ctx.orgId),
        orderBy: [desc(projects.updatedAt)],
        limit: 5,
        with: {
          client: {
            columns: {
              companyName: true,
              contactName: true,
            },
          },
        },
      });

      return recentProjects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        priority: p.priority,
        deadline: p.deadline,
        updatedAt: p.updatedAt,
        clientName: p.client?.companyName ?? p.client?.contactName ?? "Unknown",
      }));
    });
  }),

  /**
   * Get recent activity (last 10 events from activity logs)
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        // Manual join since activityLogs doesn't have relations defined in schema
        const activities = await tx
          .select({
            id: activityLogs.id,
            eventType: activityLogs.eventType,
            metadata: activityLogs.metadata,
            createdAt: activityLogs.createdAt,
            actorId: activityLogs.actorId,
            projectId: activityLogs.projectId,
          })
          .from(activityLogs)
          .where(eq(activityLogs.orgId, ctx.orgId))
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit);

        return activities.map((activity) => ({
          id: activity.id,
          eventType: activity.eventType,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
          actorId: activity.actorId,
          projectId: activity.projectId,
        }));
      });
    }),
});
