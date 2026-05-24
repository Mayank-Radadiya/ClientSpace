import { createDrizzleClient } from "@/db/createDrizzleClient";
import { and, count, eq, isNull } from "drizzle-orm";
import { assets, fileVersions } from "@/db/schema";

/**
 * Creates a file version, creating the parent asset if it does not exist.
 */
export async function createFileVersionInDb(
  orgId: string,
  userId: string,
  input: {
    projectId: string;
    storagePath: string;
    fileSize: number;
    fileType: string;
    fileName?: string;
    folderId?: string | null;
    existingAssetId?: string | null;
    autoApproveAfterDays?: number | null;
  }
) {
  try {
    const db = await createDrizzleClient();
    let assetId = input.existingAssetId;

    if (assetId) {
      const existing = await db.query.assets.findFirst({
        where: and(
          eq(assets.id, assetId),
          eq(assets.projectId, input.projectId),
          eq(assets.orgId, orgId)
        ),
        columns: { id: true },
      });
      if (!existing) throw new Error("Asset not found in this project.");
    } else {
      if (!input.fileName) throw new Error("File name is required for new assets.");

      const addBusinessDays = (date: Date, days: number): Date => {
        const result = new Date(date);
        let added = 0;
        while (added < days) {
          result.setDate(result.getDate() + 1);
          const day = result.getDay();
          if (day !== 0 && day !== 6) added++;
        }
        return result;
      };

      const autoApproveAt = input.autoApproveAfterDays
        ? addBusinessDays(new Date(), input.autoApproveAfterDays)
        : null;

      const [newAsset] = await db
        .insert(assets)
        .values({
          orgId,
          projectId: input.projectId,
          folderId: input.folderId ?? null,
          name: input.fileName,
          type: input.fileType,
          approvalStatus: "pending_review",
          autoApproveAt,
        })
        .returning({ id: assets.id });

      if (!newAsset) throw new Error("Failed to insert asset.");
      assetId = newAsset.id;
    }

    const [countResult] = await db
      .select({ count: count() })
      .from(fileVersions)
      .where(eq(fileVersions.assetId, assetId));
    const versionNumber = (countResult?.count ?? 0) + 1;

    const [newVersion] = await db
      .insert(fileVersions)
      .values({
        orgId,
        assetId,
        versionNumber,
        storagePath: input.storagePath,
        size: input.fileSize,
        uploadedBy: userId,
      })
      .returning({
        id: fileVersions.id,
        orgId: fileVersions.orgId,
        assetId: fileVersions.assetId,
        versionNumber: fileVersions.versionNumber,
        storagePath: fileVersions.storagePath,
        size: fileVersions.size,
        uploadedBy: fileVersions.uploadedBy,
        createdAt: fileVersions.createdAt,
      });

    if (!newVersion) throw new Error("Failed to insert file version.");

    const [updatedAsset] = await db
      .update(assets)
      .set({
        approvalStatus: "pending_review",
        type: input.fileType,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
      .returning({
        id: assets.id,
        name: assets.name,
        type: assets.type,
        approvalStatus: assets.approvalStatus,
        currentVersionId: assets.currentVersionId,
        projectId: assets.projectId,
        orgId: assets.orgId,
        folderId: assets.folderId,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      });

    if (!updatedAsset) throw new Error("Failed to update asset.");

    return {
      asset: updatedAsset,
      version: newVersion,
    };
  } catch (error) {
    console.error("[createFileVersionInDb] Database insert failed:", error);
    throw error;
  }
}

/**
 * Soft deletes an asset/file in the database.
 */
export async function deleteAsset(orgId: string, projectId: string, assetId: string) {
  try {
    const db = await createDrizzleClient();
    const [updated] = await db
      .update(assets)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(assets.id, assetId),
          eq(assets.projectId, projectId),
          eq(assets.orgId, orgId),
          isNull(assets.deletedAt)
        )
      )
      .returning({
        id: assets.id,
        name: assets.name,
        type: assets.type,
        approvalStatus: assets.approvalStatus,
        currentVersionId: assets.currentVersionId,
        projectId: assets.projectId,
        orgId: assets.orgId,
        folderId: assets.folderId,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      });

    if (!updated) {
      throw new Error("Asset not found or already deleted.");
    }
    return updated;
  } catch (error) {
    console.error("[deleteAsset] Database update failed:", error);
    throw error;
  }
}
