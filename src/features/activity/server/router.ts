import { z } from "zod";
import { and, count, desc, eq, inArray, lt } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS, createDrizzleClient } from "@/db/createDrizzleClient";
import { activityLogs, notifications, orgMemberships } from "@/db/schema";
import { getActivityLogsCached } from "./queries";

export const activityRouter = createTRPCRouter({
  getActivityLogs: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const result = await getActivityLogsCached(ctx.orgId, ctx.userId, null, input.limit);
      const db = await createDrizzleClient(ctx);
      const [totalRow] = await db
        .select({ value: count() })
        .from(activityLogs)
        .where(eq(activityLogs.orgId, ctx.orgId));

      return {
        logs: result.logs,
        total: Number(totalRow?.value ?? 0),
      };
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
      const result = await getActivityLogsCached(ctx.orgId, ctx.userId, input.projectId, input.limit, input.cursor);
      return {
        items: result.logs,
        nextCursor: result.nextCursor,
      };
    }),

  dashboard: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const result = await getActivityLogsCached(ctx.orgId, ctx.userId, null, input.limit);
      return result.logs;
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
