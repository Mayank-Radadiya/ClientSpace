import { createDrizzleClient } from "@/db/createDrizzleClient";
import { redis } from "@/lib/redis";
import { and, eq, count, sum, sql } from "drizzle-orm";
import { clients, invoices, projects } from "@/db/schema";

/**
 * Cached query for dashboard stats aggregates.
 * Uses Upstash Redis with a 60s TTL.
 */
export async function getDashboardStatsCached(orgId: string, userId: string) {
  const cacheKey = `analytics:${orgId}:dashboard_stats`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }
    } catch (e) {
      console.error("[getDashboardStatsCached] Redis read failed, falling back to DB:", e);
    }
  }

  try {
    const db = await createDrizzleClient({ orgId, userId });
    const [revenueRows, outstandingRows, projectsRows, clientsRows] = await Promise.all([
      db
        .select({ value: sum(invoices.amountCents) })
        .from(invoices)
        .where(and(eq(invoices.orgId, orgId), eq(invoices.status, "paid"))),
      db
        .select({ value: sum(invoices.amountCents) })
        .from(invoices)
        .where(
          and(
            eq(invoices.orgId, orgId),
            sql`${invoices.status} IN ('draft', 'sent')`
          )
        ),
      db
        .select({ value: count() })
        .from(projects)
        .where(
          and(
            eq(projects.orgId, orgId),
            sql`${projects.status} != 'archived'`
          )
        ),
      db
        .select({ value: count() })
        .from(clients)
        .where(
          and(eq(clients.orgId, orgId), eq(clients.status, "active"))
        ),
    ]);

    const stats = {
      revenueTotalCents: Number(revenueRows[0]?.value ?? 0),
      outstandingCents: Number(outstandingRows[0]?.value ?? 0),
      activeProjects: Number(projectsRows[0]?.value ?? 0),
      activeClients: Number(clientsRows[0]?.value ?? 0),
    };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(stats), { ex: 60 });
      } catch (e) {
        console.error("[getDashboardStatsCached] Redis write failed:", e);
      }
    }

    return stats;
  } catch (error) {
    console.error("[getDashboardStatsCached] Database read failed:", error);
    throw new Error("Failed to fetch dashboard stats.");
  }
}

/**
 * Cached query for revenue monthly chart aggregates.
 * Uses Upstash Redis with a 60s TTL.
 */
export async function getRevenueChartCached(orgId: string, userId: string) {
  const cacheKey = `analytics:${orgId}:revenue_chart`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }
    } catch (e) {
      console.error("[getRevenueChartCached] Redis read failed, falling back to DB:", e);
    }
  }

  try {
    const db = await createDrizzleClient({ orgId, userId });
    const monthTrunc = sql`DATE_TRUNC('month', ${invoices.paidAt})`;

    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(${monthTrunc}, 'Mon YYYY')`,
        monthKey: sql<string>`TO_CHAR(${monthTrunc}, 'YYYY-MM')`,
        amountCents: sum(invoices.amountCents),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          eq(invoices.status, "paid"),
          sql`${invoices.paidAt} >= NOW() - INTERVAL '12 months'`
        )
      )
      .groupBy(monthTrunc)
      .orderBy(monthTrunc);

    const chartData = rows.map((row) => ({
      month: row.month,
      monthKey: row.monthKey,
      amountCents: Number(row.amountCents ?? 0),
    }));

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(chartData), { ex: 60 });
      } catch (e) {
        console.error("[getRevenueChartCached] Redis write failed:", e);
      }
    }

    return chartData;
  } catch (error) {
    console.error("[getRevenueChartCached] Database read failed:", error);
    throw new Error("Failed to fetch revenue chart.");
  }
}
