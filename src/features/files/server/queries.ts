import { createDrizzleClient } from "@/db/createDrizzleClient";
import { unstable_cache } from "next/cache";
import { and, desc, eq, isNull, gt } from "drizzle-orm";
import { assets, clients, fileVersions, folders, projects, users } from "@/db/schema";
import type {
  FileKind,
  ProjectFile,
  ProjectFilesPageData,
  RecentUpload,
} from "@/features/files/types";

function toFileKind(mimeType: string): FileKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("pdf")) return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  ) {
    return "doc";
  }
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "archive";
  return "other";
}

/**
 * Cached query to retrieve the files/assets list for a project folder.
 * 
 * Cache Tag: `org-{orgId}-files`
 * Invalidation: Invalidated on upload or soft delete.
 */
export const getFileList = (orgId: string, userId: string, projectId: string, folderId: string | null, cursor?: string) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });
        return await db.query.assets.findMany({
          where: and(
            eq(assets.projectId, projectId),
            eq(assets.orgId, orgId),
            folderId ? eq(assets.folderId, folderId) : isNull(assets.folderId),
            isNull(assets.deletedAt),
            cursor ? gt(assets.id, cursor) : undefined
          ),
          columns: {
            id: true,
            orgId: true,
            projectId: true,
            folderId: true,
            name: true,
            type: true,
            currentVersionId: true,
            approvalStatus: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            versions: {
              columns: {
                id: true,
                versionNumber: true,
                storagePath: true,
                size: true,
                uploadedBy: true,
                createdAt: true,
              },
              orderBy: [desc(fileVersions.versionNumber)],
            },
          },
          orderBy: [desc(assets.updatedAt)],
          limit: 50,
        });
      } catch (error) {
        console.error("[getFileList] Database read failed:", error);
        throw new Error("Failed to fetch files list.");
      }
    },
    ["files-list", orgId, projectId, folderId ?? "root", cursor ?? ""],
    { tags: [`org-${orgId}-files`], revalidate: false }
  )();

/**
 * Cached query to retrieve version history of a specific file/asset.
 * 
 * Cache Tag: `org-{orgId}-asset-{assetId}`
 * Invalidation: Invalidated when a new version is created.
 */
export const getFileVersionHistory = (orgId: string, userId: string, assetId: string) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });
        return await db.query.fileVersions.findMany({
          where: and(
            eq(fileVersions.assetId, assetId),
            eq(fileVersions.orgId, orgId)
          ),
          columns: {
            id: true,
            orgId: true,
            assetId: true,
            versionNumber: true,
            storagePath: true,
            size: true,
            uploadedBy: true,
            createdAt: true,
          },
          with: {
            uploader: {
              columns: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: [desc(fileVersions.versionNumber)],
        });
      } catch (error) {
        console.error("[getFileVersionHistory] Database read failed:", error);
        throw new Error("Failed to fetch file version history.");
      }
    },
    ["file-versions", orgId, assetId],
    { tags: [`org-${orgId}-asset-${assetId}`], revalidate: false }
  )();

/**
 * Uncached Page Data query combining project, folders, files, and recent uploads.
 */
export async function getProjectFilesPageData(
  projectId: string
): Promise<ProjectFilesPageData | null> {
  try {
    const db = await createDrizzleClient();
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        clientName: clients.companyName,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) return null;

    const [folderRows, fileRows, recentUploadRows] = await Promise.all([
      db
        .select({
          id: folders.id,
          name: folders.name,
          createdAt: folders.createdAt,
        })
        .from(folders)
        .where(and(eq(folders.projectId, projectId), isNull(folders.parentId)))
        .orderBy(folders.name),
      db
        .select({
          id: assets.id,
          name: assets.name,
          mimeType: assets.type,
          approvalStatus: assets.approvalStatus,
          versionNumber: fileVersions.versionNumber,
          sizeBytes: fileVersions.size,
          updatedAt: assets.updatedAt,
          storagePath: fileVersions.storagePath,
        })
        .from(assets)
        .leftJoin(fileVersions, eq(assets.currentVersionId, fileVersions.id))
        .where(
          and(
            eq(assets.projectId, projectId),
            isNull(assets.folderId),
            isNull(assets.deletedAt)
          )
        )
        .orderBy(desc(assets.updatedAt)),
      db
        .select({
          id: fileVersions.id,
          assetId: assets.id,
          fileName: assets.name,
          mimeType: assets.type,
          sizeBytes: fileVersions.size,
          createdAt: fileVersions.createdAt,
          uploaderName: users.name,
        })
        .from(fileVersions)
        .innerJoin(assets, eq(fileVersions.assetId, assets.id))
        .leftJoin(users, eq(fileVersions.uploadedBy, users.id))
        .where(and(eq(assets.projectId, projectId), isNull(assets.deletedAt)))
        .orderBy(desc(fileVersions.createdAt))
        .limit(6),
    ]);

    const files: ProjectFile[] = fileRows.map((row) => ({
      id: row.id,
      name: row.name,
      mimeType: row.mimeType,
      fileKind: toFileKind(row.mimeType),
      approvalStatus: row.approvalStatus,
      versionNumber: row.versionNumber,
      sizeBytes: row.sizeBytes,
      updatedAt: row.updatedAt,
      storagePath: row.storagePath,
    }));

    const recentUploads: RecentUpload[] = recentUploadRows.map((row) => ({
      id: row.id,
      assetId: row.assetId,
      fileName: row.fileName,
      fileKind: toFileKind(row.mimeType),
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt,
      uploaderName: row.uploaderName,
    }));

    return {
      project,
      folders: folderRows,
      files,
      recentUploads,
    };
  } catch (error) {
    console.error("[getProjectFilesPageData] failed:", error);
    return null;
  }
}
