"use server";

import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import { folders, organizations, projects, projectMembers } from "@/db/schema";
import {
  uploadRequestSchema,
  createFileVersionSchema,
  ALLOWED_MIME_TYPES,
} from "../schemas";
import type { ActionState } from "../schemas";
import { PLAN_LIMITS, type PlanTier } from "@/config/plans";
import { createFileVersionInDb, deleteAsset } from "./mutations";

export async function getUploadToken(input: unknown): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in to upload files." };

  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    projectId,
    fileName,
    fileType,
    fileSize,
    folderId,
    existingAssetId,
    autoApproveAfterDays,
  } = parsed.data;

  return withRLS(ctx, async (tx) => {
    if (ctx.role === "client") {
      if (!folderId) {
        return {
          error: "Clients can only upload to the 'Client Uploads' folder.",
        };
      }
      const folder = await tx.query.folders.findFirst({
        where: and(eq(folders.id, folderId), eq(folders.projectId, projectId)),
        columns: { name: true },
      });
      if (!folder || folder.name !== "Client Uploads") {
        return {
          error: "Clients can only upload to the 'Client Uploads' folder.",
        };
      }
    }

    const project = await tx.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)),
      columns: { id: true },
    });
    if (!project) return { error: "Project not found." };

    // Verify project membership for non-owner/admin roles
    if (ctx.role !== "owner" && ctx.role !== "admin") {
      const member = await tx.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, ctx.userId),
        ),
        columns: { projectId: true },
      });
      if (!member) {
        return { error: "You do not have access to this project." };
      }
    }

    const org = await tx.query.organizations.findFirst({
      where: eq(organizations.id, ctx.orgId),
      columns: { plan: true },
    });
    const plan = (org?.plan ?? "starter") as PlanTier;

    const maxSize = PLAN_LIMITS[plan].maxUploadSizeBytes;
    if (fileSize > maxSize) {
      const limitMB = Math.round(maxSize / (1024 * 1024));
      return {
        error: `File exceeds the ${limitMB} MB limit for your plan. Upgrade for larger uploads.`,
      };
    }

    if (
      !ALLOWED_MIME_TYPES.includes(
        fileType as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      return { error: `File type "${fileType}" is not allowed.` };
    }

    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    let folderSegment = "";
    if (folderId) {
      const folder = await tx.query.folders.findFirst({
        where: eq(folders.id, folderId),
        columns: { name: true },
      });
      folderSegment = folder?.name ?? "";
    }

    const storagePath = [
      ctx.orgId,
      projectId,
      folderSegment,
      `${timestamp}-${safeName}`,
    ]
      .filter(Boolean)
      .join("/");

    const supabase = await createClient();
    const { data: signedData, error: signError } = await supabase.storage
      .from("project-files")
      .createSignedUploadUrl(storagePath);

    if (signError || !signedData) {
      console.error("getUploadToken: signed URL error:", signError);
      return { error: "Failed to generate upload URL. Please try again." };
    }

    return {
      success: true,
      data: {
        signedUrl: signedData.signedUrl,
        token: signedData.token,
        path: signedData.path,
        storagePath,
        pendingAssetName: fileName,
        existingAssetId: existingAssetId ?? null,
        folderId: folderId ?? null,
        autoApproveAfterDays: autoApproveAfterDays ?? null,
      },
    };
  });
}

/**
 * Server Action to finalize file version creation in DB and trigger tag revalidations.
 */
export async function createFileVersion(input: unknown): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in." };

  const parsed = createFileVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const result = await createFileVersionInDb(ctx.orgId, ctx.userId, {
      ...parsed.data,
      fileName: parsed.data.fileName ?? undefined,
    });
    
    // Server-side invalidation
    revalidateTag(`org-${ctx.orgId}-files`, "max");
    revalidateTag(`org-${ctx.orgId}-asset-${result.asset.id}`, "max");

    return {
      success: true,
      data: {
        assetId: result.asset.id,
        versionId: result.version.id,
        versionNumber: result.version.versionNumber,
      },
    };
  } catch (error: any) {
    console.error("[createFileVersion] Action error:", error);
    return { error: error.message || "Something went wrong. Please try again." };
  }
}

/**
 * Server Action to delete a file version/asset and trigger tag revalidations.
 */
export async function deleteAssetAction(projectId: string, assetId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in." };

  try {
    await deleteAsset(ctx.orgId, projectId, assetId);

    // Server-side invalidation
    revalidateTag(`org-${ctx.orgId}-files`, "max");
    revalidateTag(`org-${ctx.orgId}-asset-${assetId}`, "max");

    return { success: true };
  } catch (error: any) {
    console.error("[deleteAssetAction] Action error:", error);
    return { error: error.message || "Failed to delete file." };
  }
}
