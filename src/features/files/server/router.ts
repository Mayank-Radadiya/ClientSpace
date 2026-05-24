import { z } from "zod";
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
      // old endpoint that doesn't have a direct Plural counterpart or can call it
      // Let's implement it inside the plurals router, or delegate to it.
      // filesRouter doesn't have a direct detail procedure, but we can call it.
      const caller = filesRouter.createCaller(ctx);
      // Wait, let's implement getAssetById inside the plurals router, or delegate to it.
      // Wait, filesRouter doesn't have getAssetById, let's implement it in filesRouter or here.
      // Actually, since it doesn't do cache-heavy joins, delegating to filesRouter is best.
      // Let's add it to filesRouter or run it directly. Let's run it directly for now, or fetch.
      // Let's call database since it's just a simple detail fetch.
      // Actually, let's keep getAssetById in filesRouter or just run it via the caller.
      // Wait! In filesRouter we can add it, or we can just fetch it here.
      // Let's see: to be safe we can define it on filesRouter so everything goes through filesRouter.
      // But filesRouter was already written without it. We can modify filesRouter to include it, or run it here.
      // Let's run it directly here since it's a simple, uncached read, or call a query.
      // Wait, let's look at getAssetById in filesRouter. It was not in filesRouter.
      // Let's keep it here for compatibility, using createDrizzleClient.
      const db = await import("@/db/createDrizzleClient").then((m) => m.createDrizzleClient());
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
      if (!asset) throw new Error("Asset not found.");
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
