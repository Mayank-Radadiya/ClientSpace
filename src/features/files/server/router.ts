import { z } from "zod";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { assets, fileVersions, folders, projects, users } from "@/db/schema";

export const fileRouter = createTRPCRouter({
  // ─── All assets in a project (current folder level) ───────────────────────
  // Joins file_versions on current_version_id for version metadata.
  getAssets: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        folderId: z.string().uuid().optional().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        // Verify project belongs to this org
        const project = await tx.query.projects.findFirst({
          where: and(
            eq(projects.id, input.projectId),
            eq(projects.orgId, ctx.orgId),
          ),
          columns: { id: true },
        });
        if (!project) throw new Error("Project not found.");

        const folderCondition = input.folderId
          ? eq(assets.folderId, input.folderId)
          : isNull(assets.folderId);

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
              folderCondition,
              isNull(assets.deletedAt), // Exclude soft-deleted
            ),
          )
          .orderBy(desc(assets.updatedAt));
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
          .where(eq(fileVersions.assetId, input.assetId))
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
          .where(and(eq(folders.projectId, input.projectId), parentCondition))
          .orderBy(asc(folders.name));
      });
    }),

  // ─── Generate signed download URL on demand (1-hour expiry) ───────────────
  // MUST be a mutation — queries cannot be called imperatively from event handlers
  getSignedDownloadUrl: protectedProcedure
    .input(z.object({ storagePath: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { data, error } = await supabase.storage
        .from("project-files")
        .createSignedUrl(input.storagePath, 3600); // 1 hour

      if (error || !data) throw new Error("Failed to generate download URL.");
      return { url: data.signedUrl };
    }),
});
