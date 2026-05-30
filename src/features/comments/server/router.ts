import { z } from "zod";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { comments, orgMemberships, assets, users } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { createClient } from "@/lib/supabase/server";
import type { CommentMetadata } from "@/features/comments/types";

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

  createAnnotation: protectedProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        body: z.string().min(1, "Comment body is required"),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        page: z.number().int().positive().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const asset = await tx.query.assets.findFirst({
          where: eq(assets.id, input.assetId),
          columns: { projectId: true, orgId: true },
        });

        if (!asset) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Asset not found.",
          });
        }

        const countRes = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(comments)
          .where(
            and(
              eq(comments.assetId, input.assetId),
              isNull(comments.parentId),
              eq(comments.resolved, false)
            )
          );

        const pinNumber = (countRes[0]?.count ?? 0) + 1;
        const sanitizedBody = input.body.replace(/<[^>]*>/g, "");

        const [inserted] = await tx
          .insert(comments)
          .values({
            orgId: asset.orgId,
            projectId: asset.projectId,
            assetId: input.assetId,
            authorId: ctx.userId,
            body: sanitizedBody,
            resolved: false,
            metadata: {
              x: input.x,
              y: input.y,
              page: input.page ?? null,
              resolved: false,
              pinNumber,
            },
          })
          .returning();

        if (!inserted) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create comment.",
          });
        }

        const author = await tx.query.users.findFirst({
          where: eq(users.id, ctx.userId),
          columns: { id: true, name: true, avatarUrl: true, email: true },
        });

        if (!author) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found.",
          });
        }

        const commentWithAuthor = {
          ...inserted,
          author: {
            id: author.id,
            name: author.name ?? null,
            email: author.email ?? "",
            avatarUrl: author.avatarUrl ?? null,
            role: ctx.role,
          },
          replies: [],
        };

        try {
          const supabase = await createClient();
          const channel = supabase.channel(`asset:${input.assetId}`);
          await channel.subscribe();
          await channel.send({
            type: "broadcast",
            event: "annotation:created",
            payload: { comment: commentWithAuthor },
          });
        } catch (e) {
          console.error("Supabase realtime broadcast failed:", e);
        }

        return commentWithAuthor;
      });
    }),

  createReply: protectedProcedure
    .input(
      z.object({
        parentId: z.string().uuid(),
        body: z.string().min(1, "Comment body is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const parent = await tx.query.comments.findFirst({
          where: eq(comments.id, input.parentId),
          columns: { id: true, assetId: true, projectId: true, orgId: true },
        });

        if (!parent || !parent.assetId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parent annotation not found.",
          });
        }

        const sanitizedBody = input.body.replace(/<[^>]*>/g, "");

        const [inserted] = await tx
          .insert(comments)
          .values({
            orgId: parent.orgId,
            projectId: parent.projectId,
            assetId: parent.assetId,
            authorId: ctx.userId,
            body: sanitizedBody,
            parentId: input.parentId,
            resolved: false,
            metadata: null,
          })
          .returning();

        if (!inserted) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create reply.",
          });
        }

        const author = await tx.query.users.findFirst({
          where: eq(users.id, ctx.userId),
          columns: { id: true, name: true, avatarUrl: true, email: true },
        });

        if (!author) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found.",
          });
        }

        const replyWithAuthor = {
          ...inserted,
          author: {
            id: author.id,
            name: author.name ?? null,
            email: author.email ?? "",
            avatarUrl: author.avatarUrl ?? null,
            role: ctx.role,
          },
        };

        try {
          const supabase = await createClient();
          const channel = supabase.channel(`asset:${parent.assetId}`);
          await channel.subscribe();
          await channel.send({
            type: "broadcast",
            event: "annotation:reply",
            payload: { comment: replyWithAuthor },
          });
        } catch (e) {
          console.error("Supabase realtime broadcast failed:", e);
        }

        return replyWithAuthor;
      });
    }),

  resolveAnnotation: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Clients cannot resolve annotations.",
        });
      }

      return withRLS(ctx, async (tx) => {
        const comment = await tx.query.comments.findFirst({
          where: eq(comments.id, input.commentId),
          columns: { id: true, assetId: true, metadata: true },
        });

        if (!comment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Annotation not found.",
          });
        }

        const updatedMetadata = comment.metadata
          ? { ...(comment.metadata as CommentMetadata), resolved: true }
          : null;

        await tx
          .update(comments)
          .set({
            resolved: true,
            metadata: updatedMetadata,
          })
          .where(eq(comments.id, input.commentId));

        try {
          const supabase = await createClient();
          const channel = supabase.channel(`asset:${comment.assetId}`);
          await channel.subscribe();
          await channel.send({
            type: "broadcast",
            event: "annotation:resolved",
            payload: { commentId: input.commentId },
          });
        } catch (e) {
          console.error("Supabase realtime broadcast failed:", e);
        }

        return { success: true };
      });
    }),

  getAnnotationsForAsset: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const rows = await tx.query.comments.findMany({
          where: and(
            eq(comments.assetId, input.assetId),
            isNull(comments.parentId),
            eq(comments.resolved, false)
          ),
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                avatarUrl: true,
                email: true,
              },
            },
            replies: {
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
              orderBy: [asc(comments.createdAt)],
            },
          },
        });

        // Resolve roles
        const authorIds = new Set<string>();
        for (const c of rows) {
          authorIds.add(c.authorId);
          if (c.replies) {
            for (const r of c.replies) {
              authorIds.add(r.authorId);
            }
          }
        }

        const authorIdsArr = Array.from(authorIds);
        const memberships =
          authorIdsArr.length > 0
            ? await tx.query.orgMemberships.findMany({
                where: and(
                  eq(orgMemberships.orgId, ctx.orgId),
                  inArray(orgMemberships.userId, authorIdsArr),
                ),
                columns: { userId: true, role: true },
              })
            : [];
        const roleByUserId = new Map(memberships.map((m) => [m.userId, m.role]));

        const formatUser = (u: { id: string; name: string | null; avatarUrl: string | null; email: string | null }, id: string) => ({
          ...u,
          role: roleByUserId.get(id) ?? null,
        });

        const sortedRows = rows.map((c) => ({
          ...c,
          author: formatUser(c.author, c.authorId),
          replies: c.replies.map((r) => ({
            ...r,
            author: formatUser(r.author, r.authorId),
          })),
        }));

        // Sort by pinNumber inside metadata
        sortedRows.sort((a, b) => {
          const pinA = (a.metadata as CommentMetadata)?.pinNumber ?? 0;
          const pinB = (b.metadata as CommentMetadata)?.pinNumber ?? 0;
          return pinA - pinB;
        });

        return sortedRows;
      });
    }),
});
