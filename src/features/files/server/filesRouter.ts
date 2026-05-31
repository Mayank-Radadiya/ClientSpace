import { z } from "zod";
import { createTRPCRouter, protectedProcedure, rateLimitedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { getFileList, getFileVersionHistory } from "./queries";
import { createFileVersionInDb, deleteAsset } from "./mutations";
import { createClient } from "@/lib/supabase/server";
import { createFileVersionSchema } from "../schemas";
import { folders } from "@/db/schema";
import { and, eq, isNull, asc } from "drizzle-orm";
import { createDrizzleClient } from "@/db/createDrizzleClient";

export const filesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid("Invalid project ID"),
        folderId: z.string().uuid().optional().nullable(),
        cursor: z.string().uuid().optional(),
        limit: z.coerce.number().int().positive().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const items = await getFileList(ctx.orgId, ctx.userId, input.projectId, input.folderId ?? null, input.cursor);
        
        const hasMore = items.length > input.limit;
        const resultItems = hasMore ? items.slice(0, input.limit) : items;
        const nextCursor = hasMore && resultItems.length > 0
          ? resultItems[resultItems.length - 1]!.id
          : undefined;

        return {
          items: resultItems,
          nextCursor,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list files.",
        });
      }
    }),

  versions: protectedProcedure
    .input(z.object({ assetId: z.string().uuid("Invalid asset ID") }))
    .query(async ({ ctx, input }) => {
      try {
        return await getFileVersionHistory(ctx.orgId, ctx.userId, input.assetId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch file versions.",
        });
      }
    }),

  create: rateLimitedProcedure
    .input(createFileVersionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createFileVersionInDb(ctx.orgId, ctx.userId, {
          ...input,
          fileName: input.fileName ?? undefined,
        });
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create file version.",
        });
      }
    }),

  delete: rateLimitedProcedure
    .input(
      z.object({
        projectId: z.string().uuid("Invalid project ID"),
        assetId: z.string().uuid("Invalid asset ID"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await deleteAsset(ctx.orgId, input.projectId, input.assetId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file.",
        });
      }
    }),

  getFolders: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid("Invalid project ID"),
        parentId: z.string().uuid().optional().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await createDrizzleClient(ctx);
        const parentCondition = input.parentId
          ? eq(folders.parentId, input.parentId)
          : isNull(folders.parentId);

        return await db
          .select({
            id: folders.id,
            name: folders.name,
            parentId: folders.parentId,
            createdAt: folders.createdAt,
          })
          .from(folders)
          .where(
            and(
              eq(folders.projectId, input.projectId),
              eq(folders.orgId, ctx.orgId),
              parentCondition
            )
          )
          .orderBy(asc(folders.name));
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch folders.",
        });
      }
    }),

  getSignedDownloadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1, "Storage path is required"),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.storage
          .from("project-files")
          .createSignedUrl(input.storagePath, 3600, {
            download: input.fileName || true,
          });

        if (error || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to generate download URL: ${error?.message}`,
          });
        }
        return { url: data.signedUrl };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate download URL.",
        });
      }
    }),
});
