import { z } from "zod";
import { and, asc, desc, eq, gt, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { assets, fileVersions, folders, users } from "@/db/schema";

export const fileRouter = createTRPCRouter({
  // ─── All assets in a project (current folder level) ───────────────────────
  // Joins file_versions on current_version_id for version metadata.
  getAssets: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        folderId: z.string().uuid().optional().nullable(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const folderCondition = input.folderId
          ? eq(assets.folderId, input.folderId)
          : isNull(assets.folderId);

        const cursorCondition = input.cursor
          ? gt(assets.id, input.cursor)
          : undefined;

        return tx
          .select({
            id: assets.id,
            name: assets.name,
            type: assets.type,
            approvalStatus: assets.approvalStatus,
            currentVersionId: assets.currentVersionId,
            folderId: assets.folderId,
            createdAt: assets.createdAt,
            updatedAt: assets.updatedAt,
            // Current version metadata (via join on current_version_id)
            versionNumber: fileVersions.versionNumber,
            storagePath: fileVersions.storagePath,
            size: fileVersions.size,
            uploadedBy: fileVersions.uploadedBy,
            versionCreatedAt: fileVersions.createdAt,
          })
          .from(assets)
          .leftJoin(fileVersions, eq(assets.currentVersionId, fileVersions.id))
          .where(
            and(
              eq(assets.projectId, input.projectId),
              eq(assets.orgId, ctx.orgId),
              folderCondition,
              cursorCondition,
              isNull(assets.deletedAt), // Exclude soft-deleted
            ),
          )
          .orderBy(desc(assets.updatedAt))
          .limit(input.limit);
      });
    }),

  // ─── All versions of a specific asset ─────────────────────────────────────
  // Joins users for uploader name. Sorted DESC by version number.
  getVersionHistory: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        return tx
          .select({
            id: fileVersions.id,
            versionNumber: fileVersions.versionNumber,
            storagePath: fileVersions.storagePath,
            size: fileVersions.size,
            uploadedBy: fileVersions.uploadedBy,
            uploaderName: users.name,
            createdAt: fileVersions.createdAt,
          })
          .from(fileVersions)
          .leftJoin(users, eq(fileVersions.uploadedBy, users.id))
          .where(
            and(
              eq(fileVersions.assetId, input.assetId),
              eq(fileVersions.orgId, ctx.orgId),
            ),
          )
          .orderBy(desc(fileVersions.versionNumber));
      });
    }),

  // ─── Folders at the current navigation level ──────────────────────────────
  getFolders: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        parentId: z.string().uuid().optional().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const parentCondition = input.parentId
          ? eq(folders.parentId, input.parentId)
          : isNull(folders.parentId);

        return tx
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
              parentCondition,
            ),
          )
          .orderBy(asc(folders.name));
      });
    }),

  // ─── Generate signed download URL on demand (1-hour expiry) ───────────────
  // MUST be a mutation — queries cannot be called imperatively from event handlers
  getSignedDownloadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        fileName: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      console.log("[getSignedDownloadUrl] storagePath:", input.storagePath);

      const { data, error } = await supabase.storage
        .from("project-files")
        .createSignedUrl(input.storagePath, 3600, {
          download: input.fileName || true,
        }); // 1 hour

      console.log("[getSignedDownloadUrl] error:", error);
      if (error || !data) {
        console.error("[getSignedDownloadUrl] full error:", error);
        throw new Error(`Failed to generate download URL: ${error?.message}`);
      }
      return { url: data.signedUrl };
    }),

  getAssetById: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const asset = await tx.query.assets.findFirst({
          where: and(
            eq(assets.id, input.assetId),
            eq(assets.orgId, ctx.orgId),
            isNull(assets.deletedAt),
          ),
          columns: {
            id: true,
            name: true,
            projectId: true,
            approvalStatus: true,
            type: true,
            updatedAt: true,
          },
        });

        if (!asset) {
          throw new Error("Asset not found.");
        }

        return asset;
      });
    }),

  // ─── Soft-delete an asset ──────────────────────────────────────────────────
  // Sets deletedAt timestamp — filtered out by getAssets (isNull check).
  deleteAsset: protectedProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        projectId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const updated = await tx
          .update(assets)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(assets.id, input.assetId),
              eq(assets.projectId, input.projectId),
              eq(assets.orgId, ctx.orgId),
              isNull(assets.deletedAt),
            ),
          )
          .returning({ id: assets.id });

        if (updated.length === 0) {
          throw new Error("Asset not found or already deleted.");
        }

        revalidatePath(`/projects/${input.projectId}/files`);

        return { success: true };
      });
    }),
});
