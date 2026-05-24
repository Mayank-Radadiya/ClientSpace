import { createDrizzleClient } from "@/db/createDrizzleClient";
import { unstable_cache } from "next/cache";
import { and, eq, desc, lt, inArray } from "drizzle-orm";
import { activityLogs, orgMemberships } from "@/db/schema";

/**
 * Cached query to retrieve activity logs for an organization, optionally scoped by project.
 * 
 * Cache Tag: `org-{orgId}-activity`
 * Invalidation: Invalidated by events that generate new activity entries.
 */
export const getActivityLogsCached = (
  orgId: string,
  userId: string,
  projectId?: string | null,
  limit = 20,
  cursor?: string
) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });

        const conditions = [
          eq(activityLogs.orgId, orgId),
          projectId ? eq(activityLogs.projectId, projectId) : undefined,
          cursor ? lt(activityLogs.createdAt, new Date(cursor)) : undefined,
        ].filter(Boolean);

        const rows = await db.query.activityLogs.findMany({
          where: and(...(conditions as any)),
          orderBy: [desc(activityLogs.createdAt)],
          limit: limit + 1,
          with: {
            actor: {
              columns: { id: true, name: true, avatarUrl: true, email: true },
            },
            project: { columns: { id: true, name: true } },
          },
        });

        const hasMore = rows.length > limit;
        const items = hasMore ? rows.slice(0, limit) : rows;

        // Resolve roles for actors in parallel
        const actorIds = Array.from(new Set(items.map((i) => i.actorId)));
        const memberships =
          actorIds.length > 0
            ? await db.query.orgMemberships.findMany({
                where: and(
                  eq(orgMemberships.orgId, orgId),
                  inArray(orgMemberships.userId, actorIds)
                ),
                columns: { userId: true, role: true },
              })
            : [];

        const roleByUserId = new Map(memberships.map((m) => [m.userId, m.role]));

        const logs = items.map((row) => ({
          ...row,
          actor: row.actor
            ? {
                ...row.actor,
                role: roleByUserId.get(row.actorId) ?? null,
              }
            : null,
          actorRole: roleByUserId.get(row.actorId) ?? null,
        }));

        const nextCursor = hasMore && logs.length > 0
          ? logs[logs.length - 1]!.createdAt.toISOString()
          : undefined;

        return {
          logs,
          nextCursor,
        };
      } catch (error) {
        console.error("[getActivityLogsCached] Database read failed:", error);
        throw new Error("Failed to fetch activity logs.");
      }
    },
    ["activity-logs", orgId, projectId ?? "all", String(limit), cursor ?? ""],
    { tags: [`org-${orgId}-activity`], revalidate: false }
  )();
