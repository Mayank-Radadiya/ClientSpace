import { z } from "zod";
import { and, asc, eq, inArray } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { comments, orgMemberships } from "@/db/schema";

export const commentsRouter = createTRPCRouter({
  byAssetId: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const rows = await tx.query.comments.findMany({
          where: eq(comments.assetId, input.assetId),
          orderBy: [asc(comments.createdAt)],
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        });

        const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
        const memberships =
          authorIds.length > 0
            ? await tx.query.orgMemberships.findMany({
                where: and(
                  eq(orgMemberships.orgId, ctx.orgId),
                  inArray(orgMemberships.userId, authorIds),
                ),
                columns: { userId: true, role: true },
              })
            : [];
        const roleByUserId = new Map(memberships.map((m) => [m.userId, m.role]));

        return rows.map((r) => ({
          ...r,
          body: r.deletedAt ? "[deleted]" : r.body,
          isDeleted: Boolean(r.deletedAt),
          author: {
            ...r.author,
            role: roleByUserId.get(r.authorId) ?? null,
          },
        }));
      });
    }),
});
