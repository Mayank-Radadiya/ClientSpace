import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { filesRouter } from "./filesRouter";
import { createFileVersionSchema } from "../schemas";

export const fileRouter = createTRPCRouter({
  getAssets: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        folderId: z.string().uuid().optional().nullable(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const caller = filesRouter.createCaller(ctx);
      const result = await caller.list(input);
      return result.items; // old router returns array directly
    }),

  getVersionHistory: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const caller = filesRouter.createCaller(ctx);
      return caller.versions({ assetId: input.assetId });
    }),

  getFolders: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        parentId: z.string().uuid().optional().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const caller = filesRouter.createCaller(ctx);
      return caller.getFolders(input);
    }),

  getSignedDownloadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const caller = filesRouter.createCaller(ctx);
      return caller.getSignedDownloadUrl(input);
    }),

  getAssetById: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // FIX: Was missing RLS context — using createDrizzleClient without ctx can bypass RLS
      const { createDrizzleClient } = await import("@/db/createDrizzleClient");
      const db = await createDrizzleClient(ctx);
      const asset = await db.query.assets.findFirst({
        where: (assets, { and, eq, isNull }) => and(
          eq(assets.id, input.assetId),
          eq(assets.orgId, ctx.orgId),
          isNull(assets.deletedAt)
        ),
        columns: {
          id: true,
          name: true,
          projectId: true,
          approvalStatus: true,
          type: true,
          updatedAt: true,
        }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
      return asset;
    }),

  deleteAsset: protectedProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        projectId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const caller = filesRouter.createCaller(ctx);
      return caller.delete({
        projectId: input.projectId,
        assetId: input.assetId,
      });
    }),
});
