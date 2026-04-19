import { z } from "zod";
import { and, count, desc, eq, inArray, lt } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { activityLogs, notifications, orgMemberships } from "@/db/schema";

export const activityRouter = createTRPCRouter({
  getActivityLogs: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx.query.activityLogs.findMany({
            where: eq(activityLogs.orgId, ctx.orgId),
            orderBy: [desc(activityLogs.createdAt)],
            limit: input.limit,
            with: {
              actor: {
                columns: { id: true, name: true, avatarUrl: true, email: true },
              },
              project: { columns: { id: true, name: true } },
            },
          }),
          tx
            .select({ value: count() })
            .from(activityLogs)
            .where(eq(activityLogs.orgId, ctx.orgId)),
        ]);

        const actorIds = Array.from(new Set(rows.map((i) => i.actorId)));
        const memberships =
          actorIds.length > 0
            ? await tx.query.orgMemberships.findMany({
                where: and(
                  eq(orgMemberships.orgId, ctx.orgId),
                  inArray(orgMemberships.userId, actorIds),
                ),
                columns: { userId: true, role: true },
              })
            : [];

        const roleByUserId = new Map(memberships.map((m) => [m.userId, m.role]));

        const logs = rows.map((row) => ({
          ...row,
          actor: row.actor
            ? {
                ...row.actor,
                role: roleByUserId.get(row.actorId) ?? null,
              }
            : null,
          actorRole: roleByUserId.get(row.actorId) ?? null,
        }));

        return {
          logs,
          total: Number(totalRows[0]?.value ?? 0),
        };
      });
    }),

  byProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const rows = await tx.query.activityLogs.findMany({
          where: and(
            eq(activityLogs.projectId, input.projectId),
            eq(activityLogs.orgId, ctx.orgId),
            input.cursor
              ? lt(activityLogs.createdAt, new Date(input.cursor))
              : undefined,
          ),
          orderBy: [desc(activityLogs.createdAt)],
          limit: input.limit + 1,
          with: {
            actor: {
              columns: { id: true, name: true, avatarUrl: true, email: true },
            },
            project: { columns: { id: true, name: true } },
          },
        });

        const hasMore = rows.length > input.limit;
        const items = hasMore ? rows.slice(0, input.limit) : rows;

        const actorIds = Array.from(new Set(items.map((i) => i.actorId)));
        const memberships =
          actorIds.length > 0
            ? await tx.query.orgMemberships.findMany({
                where: and(
                  eq(orgMemberships.orgId, ctx.orgId),
                  inArray(orgMemberships.userId, actorIds),
                ),
                columns: { userId: true, role: true },
              })
            : [];

        const roleByUserId = new Map(
          memberships.map((m) => [m.userId, m.role]),
        );
        const withRole = items.map((item) => ({
          ...item,
          actor: item.actor
            ? {
                ...item.actor,
                role: roleByUserId.get(item.actorId) ?? null,
              }
            : null,
          actorRole: roleByUserId.get(item.actorId) ?? null,
        }));

        return {
          items: withRole,
          nextCursor: hasMore
            ? withRole[withRole.length - 1]?.createdAt.toISOString()
            : undefined,
        };
      });
    }),

  dashboard: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const rows = await tx.query.activityLogs.findMany({
          where: eq(activityLogs.orgId, ctx.orgId),
          orderBy: [desc(activityLogs.createdAt)],
          limit: input.limit,
          with: {
            actor: {
              columns: { id: true, name: true, avatarUrl: true, email: true },
            },
            project: { columns: { id: true, name: true } },
          },
        });

        const actorIds = Array.from(new Set(rows.map((i) => i.actorId)));
        const memberships =
          actorIds.length > 0
            ? await tx.query.orgMemberships.findMany({
                where: and(
                  eq(orgMemberships.orgId, ctx.orgId),
                  inArray(orgMemberships.userId, actorIds),
                ),
                columns: { userId: true, role: true },
              })
            : [];

        const roleByUserId = new Map(
          memberships.map((m) => [m.userId, m.role]),
        );

        return rows.map((row) => ({
          ...row,
          actor: row.actor
            ? {
                ...row.actor,
                role: roleByUserId.get(row.actorId) ?? null,
              }
            : null,
          actorRole: roleByUserId.get(row.actorId) ?? null,
        }));
      });
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      const rows = await tx
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.userId),
            eq(notifications.orgId, ctx.orgId),
            eq(notifications.read, false),
          ),
        )
        .limit(99);

      return { count: rows.length };
    });
  }),

  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const rows = await tx.query.notifications.findMany({
          where: and(
            eq(notifications.userId, ctx.userId),
            eq(notifications.orgId, ctx.orgId),
          ),
          orderBy: [desc(notifications.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        const [totalRow] = await tx
          .select({ value: count() })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, ctx.userId),
              eq(notifications.orgId, ctx.orgId),
            ),
          );

        const [unreadRow] = await tx
          .select({ value: count() })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, ctx.userId),
              eq(notifications.orgId, ctx.orgId),
              eq(notifications.read, false),
            ),
          );

        return {
          notifications: rows,
          total: Number(totalRow?.value ?? 0),
          unreadCount: Number(unreadRow?.value ?? 0),
        };
      });
    }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        await tx
          .update(notifications)
          .set({ read: true })
          .where(
            and(
              eq(notifications.id, input.notificationId),
              eq(notifications.userId, ctx.userId),
              eq(notifications.orgId, ctx.orgId),
            ),
          );

        return { success: true };
      });
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      await tx
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.userId, ctx.userId),
            eq(notifications.orgId, ctx.orgId),
            eq(notifications.read, false),
          ),
        );

      return { success: true };
    });
  }),
});
