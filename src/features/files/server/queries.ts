import { and, desc, eq, isNull } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { assets, clients, fileVersions, folders, projects, users } from "@/db/schema";
import type { TRPCContext } from "@/lib/trpc/init";
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

export async function getProjectFilesPageData(
  projectId: string,
  ctx: TRPCContext,
): Promise<ProjectFilesPageData | null> {
  return withRLS(ctx, async (tx) => {
    const [project] = await tx
      .select({
        id: projects.id,
        name: projects.name,
        clientName: clients.companyName,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)))
      .limit(1);

    if (!project) return null;

    const [folderRows, fileRows, recentUploadRows] = await Promise.all([
      tx
        .select({
          id: folders.id,
          name: folders.name,
          createdAt: folders.createdAt,
        })
        .from(folders)
        .where(and(eq(folders.projectId, projectId), isNull(folders.parentId)))
        .orderBy(folders.name),
      tx
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
            isNull(assets.deletedAt),
          ),
        )
        .orderBy(desc(assets.updatedAt)),
      tx
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
  });
}
