"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import {
  assets,
  fileVersions,
  folders,
  organizations,
  projects,
} from "@/db/schema";
import {
  uploadRequestSchema,
  createFileVersionSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "../schemas";
import type { ActionState } from "../schemas";

// ─── Helper: Build business-day auto-approve timestamp ────────────────────────

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++; // Skip Saturday (6) and Sunday (0)
  }
  return result;
}

// ─── ACTION 1: getUploadToken ─────────────────────────────────────────────────
// Validates the request, checks plan limits and MIME type,
// then returns a Supabase signed upload URL.
// Does NOT write to the database — deferred to createFileVersion.

export async function getUploadToken(input: unknown): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in to upload files." };

  // Parse + validate input
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

  // All DB operations go through withRLS for tenant isolation
  return withRLS(ctx, async (tx) => {
    // Role check: clients may only upload to "Client Uploads" folder
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

    // Verify project belongs to this org
    const project = await tx.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)),
      columns: { id: true },
    });
    if (!project) return { error: "Project not found." };

    // Fetch org plan for size limit
    const org = await tx.query.organizations.findFirst({
      where: eq(organizations.id, ctx.orgId),
      columns: { plan: true },
    });
    const plan = org?.plan ?? "starter";

    // Enforce plan-based size limit
    const maxSize = MAX_FILE_SIZE[plan] ?? MAX_FILE_SIZE["starter"]!;
    if (fileSize > maxSize) {
      const limitMB = Math.round(maxSize / (1024 * 1024));
      return {
        error: `File exceeds the ${limitMB} MB limit for your plan. Upgrade for larger uploads.`,
      };
    }

    // Enforce MIME type allowlist
    if (
      !ALLOWED_MIME_TYPES.includes(
        fileType as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      return { error: `File type "${fileType}" is not allowed.` };
    }

    // If existing asset, verify it belongs to this project
    if (existingAssetId) {
      const existing = await tx.query.assets.findFirst({
        where: and(
          eq(assets.id, existingAssetId),
          eq(assets.projectId, projectId),
        ),
        columns: { id: true },
      });
      if (!existing) return { error: "Asset not found in this project." };
    }

    // Build storage path: {org_id}/{project_id}/{folder_name?}/{timestamp}-{safe_name}
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

    // Generate signed upload URL (Supabase client — not a DB operation)
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

// ─── ACTION 2: createFileVersion ─────────────────────────────────────────────
// Called AFTER the client has successfully uploaded the binary to Storage.
// Creates the asset row (if new) and inserts the file_versions row.
// The DB trigger handles assets.current_version_id automatically.

export async function createFileVersion(input: unknown): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in." };

  const parsed = createFileVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    projectId,
    storagePath,
    fileSize,
    fileType,
    fileName,
    folderId,
    existingAssetId,
    autoApproveAfterDays,
  } = parsed.data;

  return withRLS(ctx, async (tx) => {
    // Verify project belongs to org
    const project = await tx.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)),
      columns: { id: true },
    });
    if (!project) return { error: "Project not found." };

    try {
      let assetId: string;

      if (existingAssetId) {
        // New version of existing asset
        const existing = await tx.query.assets.findFirst({
          where: and(
            eq(assets.id, existingAssetId),
            eq(assets.projectId, projectId),
          ),
          columns: { id: true },
        });
        if (!existing) return { error: "Asset not found in this project." };
        assetId = existingAssetId;
      } else {
        // New asset — fileName is required
        if (!fileName)
          return { error: "File name is required for new assets." };

        const autoApproveAt = autoApproveAfterDays
          ? addBusinessDays(new Date(), autoApproveAfterDays)
          : null;

        const [newAsset] = await tx
          .insert(assets)
          .values({
            orgId: ctx.orgId, // Required — de-normalized for RLS
            projectId,
            folderId: folderId ?? null,
            name: fileName,
            type: fileType,
            approvalStatus: "pending_review",
            autoApproveAt,
          })
          .returning({ id: assets.id });

        if (!newAsset) throw new Error("Asset insert returned no row.");
        assetId = newAsset.id;
      }

      // Calculate version number
      const [countResult] = await tx
        .select({ count: count() })
        .from(fileVersions)
        .where(eq(fileVersions.assetId, assetId));
      const versionNumber = (countResult?.count ?? 0) + 1;

      // Insert version row — DB trigger auto-updates assets.current_version_id
      const [newVersion] = await tx
        .insert(fileVersions)
        .values({
          orgId: ctx.orgId, // Required — de-normalized for RLS
          assetId,
          versionNumber,
          storagePath,
          size: fileSize,
          uploadedBy: ctx.userId,
        })
        .returning({ id: fileVersions.id });

      if (!newVersion) throw new Error("file_versions insert returned no row.");

      // Reset approval status to pending_review on every new version
      await tx
        .update(assets)
        .set({
          approvalStatus: "pending_review",
          type: fileType,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, assetId));

      revalidatePath(`/projects/${projectId}/files`);

      return {
        success: true,
        data: { assetId, versionId: newVersion.id, versionNumber },
      };
    } catch (err) {
      console.error("createFileVersion:", err);
      return { error: "Something went wrong. Please try again." };
    }
  });
}
