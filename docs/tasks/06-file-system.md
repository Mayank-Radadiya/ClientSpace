# Task 06 — File System: Upload, Versioning & Asset Management

> **Phase:** 1 · Core Features
> **Priority:** Critical — unblocks approval workflow, comments on files, and client portal
> **Depends on:** `02-database.md` (assets/file_versions schema + trigger), `03-auth-rls.md` (Storage RLS policies), `05-projects-crud.md` (project context)

---

## Objective

Implement the file management engine where freelancers upload deliverables and clients review them. Files are stored in Supabase Storage, metadata is tracked in Postgres via the "double-write" pattern, and the UI provides drag-and-drop upload with version history.

---

## Description

PRD §6.4 defines a file system with:

1. **Supabase Storage** for binary files (S3-compatible bucket `project-files`).
2. **`assets` table** as the stable parent — a logical file identity (e.g., "Logo.png").
3. **`file_versions` table** as the child — each upload creates a new version row.
4. **A DB trigger** (from Task 02) that auto-updates `assets.current_version_id` on every `file_versions` INSERT.

This task builds:

- **Server Actions** for secure upload URL generation and metadata recording.
- **tRPC router** for querying assets, versions, and folders.
- **UI components**: `FileUploader.tsx` (drag-and-drop zone), `AssetList.tsx` (browsable file tree with version history).
- **Page integration** at `/dashboard/projects/[projectId]/files/page.tsx`.

> **PRD §6.4:** "Versioning: `assets` table (stable ID) + `file_versions` table. UI shows generic names (e.g. 'Main Logo') with dropdown history."
> **PRD §10.2:** "Server Actions strictly reserved for RSC form mutations. All client-side queries must use tRPC."

---

## Tech Stack

| Concern        | Tool                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| **Upload UI**  | `react-dropzone` (drag-and-drop zone), `lucide-react` (icons)              |
| **Storage**    | Supabase Storage (S3-compatible bucket `project-files`)                    |
| **Mutations**  | Next.js Server Actions (`getUploadToken`, `createFileVersion`)             |
| **Queries**    | tRPC v11 + TanStack Query (asset list, version history)                    |
| **ORM**        | Drizzle ORM (assets, file_versions, folders)                               |
| **Validation** | Zod (file metadata schema)                                                 |
| **UI**         | shadcn/ui (`Card`, `Badge`, `Button`, `DropdownMenu`, `Sheet`, `Progress`) |
| **Utilities**  | `date-fns` (timestamps), `pretty-bytes` (file sizes)                       |

---

## Step-by-Step Instructions

### Step 1 — Supabase Storage Bucket Setup

Create the `project-files` bucket in Supabase Dashboard or via migration:

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);
```

**Path convention:**

```
{org_id}/{project_id}/{folder_name?}/{filename}
```

Examples:

- `abc-org-123/proj-456/Logo-v1.png`
- `abc-org-123/proj-456/Client Uploads/reference.pdf`

> **RLS is already configured in Task 03.** The policies enforce:
>
> - **Owner/Admin/Member:** Can upload anywhere within their org path.
> - **Client:** Can ONLY upload to the `{org_id}/{project_id}/Client Uploads/` sub-folder.
> - **Guest:** No upload access.

---

### Step 2 — Zod Validation Schemas

Create `src/features/files/schemas.ts`:

```typescript
import { z } from "zod";

/**
 * Allowed MIME types — PRD §6.4.
 * Validated server-side before accepting metadata.
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "image/gif",
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  // Design
  "image/vnd.adobe.photoshop", // PSD
  "application/postscript", // AI
  "application/x-figma",
  "application/x-sketch",
] as const;

/**
 * Plan-based file size limits in bytes — PRD §9.
 */
export const MAX_FILE_SIZE: Record<string, number> = {
  starter: 50 * 1024 * 1024, // 50 MB
  pro: 75 * 1024 * 1024, // 75 MB
  growth: 100 * 1024 * 1024, // 100 MB
  business: Infinity, // Unlimited (BYOS handles storage)
};

/**
 * Storage provider abstraction — PRD §9 (Business tier).
 * Business tier uses "Bring Your Own Storage" (AWS S3 / Cloudflare R2).
 *
 * Phase 2: `getUploadToken` checks `org.storageProvider` and routes to
 * the appropriate presigned URL generator.
 *
 * @see Task 16 (planned) for full BYOS implementation.
 */
export type StorageProvider = "supabase" | "aws-s3" | "cloudflare-r2";

/** Default provider for Starter/Pro/Growth tiers. */
export const DEFAULT_STORAGE_PROVIDER: StorageProvider = "supabase";

/**
 * Schema for requesting a signed upload URL.
 * Validated on the server before generating the presigned URL.
 */
export const uploadRequestSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().int().positive("File size must be positive"),
  folderId: z.string().uuid().optional().nullable(),
  /** If provided, this upload is a NEW VERSION of an existing asset. */
  existingAssetId: z.string().uuid().optional().nullable(),
  /**
   * PRD §6.4: "Optional setting per file to 'Auto-approve after N business
   * days if no action taken'". Null = manual approval only.
   */
  autoApproveAfterDays: z.number().int().min(1).max(30).optional().nullable(),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

/**
 * Schema for recording file metadata AFTER successful upload.
 * This is the "write" step of the double-write pattern.
 *
 * NOTE: Asset creation is DEFERRED to this step (not getUploadToken)
 * to prevent ghost records when the binary upload fails.
 */
export const createFileVersionSchema = z.object({
  projectId: z.string().uuid(),
  storagePath: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileType: z.string().min(1),
  /** For new assets: the file name. Null when uploading a new version. */
  fileName: z.string().max(255).optional().nullable(),
  /** For new assets: the folder. Null for root-level uploads. */
  folderId: z.string().uuid().optional().nullable(),
  /** If provided, this upload is a new version of an existing asset. */
  existingAssetId: z.string().uuid().optional().nullable(),
  /** Auto-approve configuration (PRD §6.4). */
  autoApproveAfterDays: z.number().int().min(1).max(30).optional().nullable(),
});

export type CreateFileVersionInput = z.infer<typeof createFileVersionSchema>;
```

> **⚠️ BYOS (Business Tier):** The `StorageProvider` type above is a Phase 2 extension point. Currently all tiers use Supabase Storage. For Business tier BYOS, `getUploadToken` should check `org.storageProvider` and generate presigned URLs for the configured provider (AWS S3 / Cloudflare R2). This prevents catastrophic infrastructure costs from Business tier users consuming internal storage.

**Key decisions:**

| Decision                         | Rationale                                                           |
| -------------------------------- | ------------------------------------------------------------------- |
| MIME type allowlist              | PRD §6.4 specifies exact allowed types. Reject unknown on server.   |
| Plan-based size limits           | PRD §9 defines per-plan limits. Enforced server-side, not client.   |
| `existingAssetId` optional       | Null = new asset. Populated = new version of existing asset.        |
| Deferred asset creation          | Asset row created in `createFileVersion`, not `getUploadToken`.     |
| `autoApproveAfterDays` field     | PRD §6.4: optional auto-approve after N business days.              |
| `StorageProvider` type (Phase 2) | BYOS extension point for Business tier AWS S3 / R2 storage.         |
| Separate upload vs. record steps | "Double-write" pattern: binary → Storage, then metadata → Postgres. |

---

### Step 3 — Server Actions (Upload Token + File Record)

Create `src/features/files/server/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import {
  assets,
  fileVersions,
  projects,
  organizations,
  folders,
} from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import {
  uploadRequestSchema,
  createFileVersionSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "../schemas";

// ─── Types ──────────────────────────────────────────────────────
export type ActionState = {
  success?: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

// ─── ACTION 1: getUploadToken ───────────────────────────────────
/**
 * Generates a Signed Upload URL for direct browser → Supabase Storage upload.
 *
 * Flow:
 *   1. Validate user session + org membership.
 *   2. Verify project belongs to the user's org.
 *   3. Enforce plan-based file size limits (PRD §9).
 *   4. Enforce MIME type allowlist (PRD §6.4).
 *   5. Determine storage path: {org_id}/{project_id}/{folder?}/{filename}.
 *   6. Return a signed URL (1-hour expiry) + metadata for `createFileVersion`.
 *
 * NOTE: Asset creation is DEFERRED to `createFileVersion` to prevent
 * "ghost records" when the binary upload fails mid-flight.
 *
 * If `existingAssetId` is provided → validates it belongs to this project.
 * If not → returns `pendingAssetName` for deferred creation.
 */
export async function getUploadToken(input: unknown): Promise<ActionState> {
  // 1. Auth — uses shared utility (PRD §10.2: no bare db)
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: "You must be logged in to upload files." };
  }

  // Fetch org plan for file size limit enforcement
  const org = await ctx.db.query.organizations.findFirst({
    where: eq(organizations.id, ctx.orgId),
    columns: { plan: true },
  });
  const plan = org?.plan ?? "starter";

  // 2. Parse input
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
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

  // 3. Role check — Clients can ONLY upload to "Client Uploads" folder
  //    (Full enforcement is in Storage RLS, but we pre-check here for UX)
  if (ctx.role === "client") {
    if (folderId) {
      const folder = await ctx.db.query.folders.findFirst({
        where: and(eq(folders.id, folderId), eq(folders.projectId, projectId)),
        columns: { name: true },
      });
      if (!folder || folder.name !== "Client Uploads") {
        return {
          error: "Clients can only upload to the 'Client Uploads' folder.",
        };
      }
    }
  }

  // Guests cannot upload at all
  if (
    ctx.role !== "owner" &&
    ctx.role !== "admin" &&
    ctx.role !== "member" &&
    ctx.role !== "client"
  ) {
    return { error: "You do not have permission to upload files." };
  }

  // 4. Verify project belongs to org
  const project = await ctx.db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)),
    columns: { id: true },
  });

  if (!project) {
    return { error: "Project not found." };
  }

  // 5. Enforce file size limit per plan (PRD §9)
  const maxSize = MAX_FILE_SIZE[plan] ?? MAX_FILE_SIZE.starter;
  if (fileSize > maxSize) {
    const limitMB = Math.round(maxSize / (1024 * 1024));
    return {
      error: `File exceeds the ${limitMB} MB limit for your plan. Upgrade for larger uploads.`,
    };
  }

  // 6. Enforce MIME type allowlist
  if (!ALLOWED_MIME_TYPES.includes(fileType as any)) {
    return { error: `File type "${fileType}" is not allowed.` };
  }

  // 7. If existing asset, validate it belongs to this project
  if (existingAssetId) {
    const existingAsset = await ctx.db.query.assets.findFirst({
      where: and(
        eq(assets.id, existingAssetId),
        eq(assets.projectId, projectId),
      ),
      columns: { id: true },
    });

    if (!existingAsset) {
      return { error: "Asset not found in this project." };
    }
  }

  // 8. Build the storage path
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folderSegment = folderId
    ? await ctx.db.query.folders
        .findFirst({
          where: eq(folders.id, folderId),
          columns: { name: true },
        })
        .then((f) => f?.name ?? "")
    : "";

  const storagePath = [
    ctx.orgId,
    projectId,
    folderSegment,
    `${timestamp}-${safeName}`,
  ]
    .filter(Boolean)
    .join("/");

  // 9. Generate signed upload URL via Supabase Storage
  const supabase = await createClient();
  const { data: signedUrl, error: signError } = await supabase.storage
    .from("project-files")
    .createSignedUploadUrl(storagePath);

  if (signError || !signedUrl) {
    console.error("Failed to generate signed URL:", signError);
    return { error: "Failed to generate upload URL. Please try again." };
  }

  return {
    success: true,
    data: {
      signedUrl: signedUrl.signedUrl,
      token: signedUrl.token,
      path: signedUrl.path,
      storagePath,
      // Deferred data — passed back to createFileVersion
      pendingAssetName: fileName,
      existingAssetId: existingAssetId ?? null,
      folderId: folderId ?? null,
      autoApproveAfterDays: autoApproveAfterDays ?? null,
    },
  };
}

// ─── ACTION 2: createFileVersion ────────────────────────────────
/**
 * Called AFTER the client-side upload succeeds.
 * Records the file version in Postgres AND creates the asset if needed.
 *
 * This is the ONLY place where asset rows are created, preventing
 * "ghost records" from failed uploads.
 *
 * The DB trigger (Task 02) automatically updates:
 *   assets.current_version_id = this new version's ID
 *   assets.updated_at = NOW()
 */
export async function createFileVersion(input: unknown): Promise<ActionState> {
  // 1. Auth
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: "You must be logged in." };
  }

  // 2. Parse
  const parsed = createFileVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
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

  // 3. Verify project belongs to org
  const project = await ctx.db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)),
    columns: { id: true },
  });

  if (!project) {
    return { error: "Project not found." };
  }

  try {
    let assetId: string;

    if (existingAssetId) {
      // Verify the existing asset belongs to this project
      const asset = await ctx.db.query.assets.findFirst({
        where: and(
          eq(assets.id, existingAssetId),
          eq(assets.projectId, projectId),
        ),
        columns: { id: true },
      });

      if (!asset) {
        return { error: "Asset not found in this project." };
      }
      assetId = existingAssetId;
    } else {
      // 4. Create the asset NOW (deferred from getUploadToken)
      if (!fileName) {
        return { error: "File name is required for new assets." };
      }

      const [newAsset] = await ctx.db
        .insert(assets)
        .values({
          projectId,
          folderId: folderId ?? null,
          name: fileName,
          type: fileType,
          approvalStatus: "pending_review",
          autoApproveAfterDays: autoApproveAfterDays ?? null,
        })
        .returning({ id: assets.id });

      assetId = newAsset.id;
    }

    // 5. Calculate version number (count existing + 1)
    const [versionCount] = await ctx.db
      .select({ count: count() })
      .from(fileVersions)
      .where(eq(fileVersions.assetId, assetId));

    const versionNumber = (versionCount?.count ?? 0) + 1;

    // 6. Insert version — the DB trigger handles assets.current_version_id
    const [newVersion] = await ctx.db
      .insert(fileVersions)
      .values({
        assetId,
        versionNumber,
        storagePath,
        size: fileSize,
        uploadedBy: ctx.userId,
      })
      .returning({ id: fileVersions.id });

    // 7. Reset approval status to pending_review on new version upload
    await ctx.db
      .update(assets)
      .set({
        approvalStatus: "pending_review",
        type: fileType,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId));

    revalidatePath(`/dashboard/projects/${projectId}/files`);

    return {
      success: true,
      data: {
        assetId,
        versionId: newVersion.id,
        versionNumber,
      },
    };
  } catch (err) {
    console.error("Failed to create file version:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
```

> **⚠️ Garbage Collection:** The double-write pattern can leave orphaned binaries in Storage (e.g., upload succeeds but the server crashes before `createFileVersion` completes). Implement a background Inngest cron job that periodically sweeps the `project-files` bucket and deletes any files older than 24 hours that have no matching `storage_path` in the `file_versions` table. This is a post-MVP background task.

**Constraints enforced:**

| Constraint                | Implementation                                                             |
| ------------------------- | -------------------------------------------------------------------------- |
| Org isolation             | `ctx.db` from `getSessionContext()` — RLS-scoped via `createDrizzleClient` |
| No bare `db` imports      | All DB access uses `ctx.db` from shared session utility (PRD §10.2)        |
| Plan-based file limits    | `MAX_FILE_SIZE[plan]` checked before signed URL generation                 |
| MIME type allowlist       | `ALLOWED_MIME_TYPES.includes()` check server-side                          |
| Client folder restriction | Pre-check + Storage RLS enforces "Client Uploads" folder only              |
| Deferred asset creation   | Asset row created in `createFileVersion` only — no ghost records           |
| Double-write pattern      | Binary → Storage (via signed URL), then metadata → Postgres                |
| Version auto-increment    | `COUNT(*) + 1` for `version_number`                                        |
| Approval status reset     | New version upload resets asset to `pending_review`                        |
| Auto-approve config       | `autoApproveAfterDays` stored on asset (cron job in Task 11)               |

---

### Step 4 — tRPC Router (Queries)

Create `src/features/files/server/router.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { assets, fileVersions, folders, users } from "@/db/schema";
import { eq, and, isNull, desc, asc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export const fileRouter = createTRPCRouter({
  /**
   * getAssets — Fetch all assets for a project, grouped by folder.
   * Includes the current version's metadata via join.
   *
   * PRD §6.4: "UI shows generic names (e.g. 'Main Logo') with dropdown history."
   */
  getAssets: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        folderId: z.string().uuid().optional().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify project belongs to org
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq((await import("@/db/schema")).projects.id, input.projectId),
          eq((await import("@/db/schema")).projects.orgId, ctx.orgId),
        ),
        columns: { id: true },
      });

      if (!project) {
        throw new Error("Project not found.");
      }

      // Build folder filter
      const folderCondition = input.folderId
        ? eq(assets.folderId, input.folderId)
        : isNull(assets.folderId);

      const results = await ctx.db
        .select({
          id: assets.id,
          name: assets.name,
          type: assets.type,
          approvalStatus: assets.approvalStatus,
          currentVersionId: assets.currentVersionId,
          folderId: assets.folderId,
          createdAt: assets.createdAt,
          updatedAt: assets.updatedAt,
          // Current version metadata
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

      return results;
    }),

  /**
   * getVersionHistory — Fetch all versions of a specific asset.
   * Shown in the version dropdown panel.
   */
  getVersionHistory: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const versions = await ctx.db
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

      return versions;
    }),

  /**
   * getFolders — Fetch all folders for a project.
   * Supports nested folder structure.
   */
  getFolders: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        parentId: z.string().uuid().optional().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const parentCondition = input.parentId
        ? eq(folders.parentId, input.parentId)
        : isNull(folders.parentId);

      const results = await ctx.db
        .select({
          id: folders.id,
          name: folders.name,
          parentId: folders.parentId,
          createdAt: folders.createdAt,
        })
        .from(folders)
        .where(and(eq(folders.projectId, input.projectId), parentCondition))
        .orderBy(asc(folders.name));

      return results;
    }),

  /**
   * getSignedDownloadUrl — Generate a signed URL for secure file download.
   * PRD §6.4: "Supabase signed URLs, 1-hour expiry, regenerated on-demand."
   */
  getSignedDownloadUrl: protectedProcedure
    .input(z.object({ storagePath: z.string().min(1) }))
    .query(async ({ input }) => {
      const supabase = await createClient();
      const { data, error } = await supabase.storage
        .from("project-files")
        .createSignedUrl(input.storagePath, 3600); // 1 hour

      if (error || !data) {
        throw new Error("Failed to generate download URL.");
      }

      return { url: data.signedUrl };
    }),
});
```

> **Wire into the root router:** In `src/lib/trpc/root.ts`, import and merge:
>
> ```typescript
> import { fileRouter } from "@/features/files/server/router";
>
> export const appRouter = createTRPCRouter({
>   file: fileRouter,
>   // ...other routers
> });
> ```

---

### Step 5 — FileUploader Component

Create `src/features/files/components/FileUploader.tsx`:

```tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileIcon, CheckCircle2, AlertCircle, X } from "lucide-react";

import { getUploadToken, createFileVersion } from "../server/actions";
import { ALLOWED_MIME_TYPES } from "../schemas";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────
type FileUploadState = {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

type FileUploaderProps = {
  projectId: string;
  folderId?: string | null;
  /** If provided, this upload creates a new version of an existing asset. */
  existingAssetId?: string | null;
  onUploadComplete?: () => void;
};

// ─── Component ──────────────────────────────────────────────────
export function FileUploader({
  projectId,
  folderId,
  existingAssetId,
  onUploadComplete,
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);

  const updateUpload = (index: number, update: Partial<FileUploadState>) => {
    setUploads((prev) =>
      prev.map((u, i) => (i === index ? { ...u, ...update } : u)),
    );
  };

  /**
   * Upload a single file using the "Double-Write" pattern:
   *   1. getUploadToken → signed URL + asset ID
   *   2. Upload binary to Supabase Storage via signed URL
   *   3. createFileVersion → record metadata in Postgres
   */
  const uploadFile = useCallback(
    async (file: File, index: number) => {
      updateUpload(index, { status: "uploading", progress: 10 });

      // Step 1: Get signed upload URL + asset ID
      const tokenResult = await getUploadToken({
        projectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folderId: folderId ?? null,
        existingAssetId: existingAssetId ?? null,
      });

      if (tokenResult.error || !tokenResult.data) {
        updateUpload(index, {
          status: "error",
          error: tokenResult.error ?? "Failed to get upload token.",
        });
        return;
      }

      updateUpload(index, { progress: 30 });

      const { signedUrl, token, path, assetId, storagePath } =
        tokenResult.data as {
          signedUrl: string;
          token: string;
          path: string;
          assetId: string;
          storagePath: string;
        };

      // Step 2: Upload binary to Supabase Storage
      try {
        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        updateUpload(index, { progress: 70 });
      } catch (err) {
        updateUpload(index, {
          status: "error",
          error: "Upload to storage failed. Please try again.",
        });
        return;
      }

      // Step 3: Record metadata in Postgres
      const recordResult = await createFileVersion({
        projectId,
        assetId,
        storagePath,
        fileSize: file.size,
        fileType: file.type,
      });

      if (recordResult.error) {
        updateUpload(index, {
          status: "error",
          error: recordResult.error,
        });
        return;
      }

      updateUpload(index, { status: "success", progress: 100 });
      onUploadComplete?.();
    },
    [projectId, folderId, existingAssetId, onUploadComplete],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newUploads: FileUploadState[] = acceptedFiles.map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
      }));

      setUploads((prev) => [...prev, ...newUploads]);

      // Start uploading each file
      const startIndex = uploads.length;
      acceptedFiles.forEach((file, i) => {
        uploadFile(file, startIndex + i);
      });
    },
    [uploads.length, uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_MIME_TYPES.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {} as Record<string, string[]>,
    ),
    maxFiles: 10,
  });

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop files, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Images, PDFs, Documents, Design files • Max 10 files at a time
        </p>
      </div>

      {/* Upload Progress List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={`${upload.file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              {/* Icon */}
              {upload.status === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : upload.status === "error" ? (
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              ) : (
                <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              )}

              {/* File info + progress */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {upload.file.name}
                </p>
                {upload.status === "uploading" && (
                  <Progress value={upload.progress} className="mt-1 h-1.5" />
                )}
                {upload.error && (
                  <p className="text-xs text-destructive mt-1">
                    {upload.error}
                  </p>
                )}
              </div>

              {/* Remove button */}
              {(upload.status === "success" || upload.status === "error") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeUpload(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Step 6 — AssetList Component

Create `src/features/files/components/AssetList.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  FileIcon,
  FolderIcon,
  ChevronRight,
  Download,
  History,
  MoreVertical,
  Image,
  FileText,
  Archive,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { trpc } from "@/lib/trpc/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Types ──────────────────────────────────────────────────────

const APPROVAL_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending_review: "outline",
  approved: "default",
  changes_requested: "destructive",
};

const APPROVAL_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  changes_requested: "Changes Requested",
};

// ─── File Icon Resolver ─────────────────────────────────────────
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return FileText;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
  return FileIcon;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Props ──────────────────────────────────────────────────────
type AssetListProps = {
  projectId: string;
};

// ─── Component ──────────────────────────────────────────────────
export function AssetList({ projectId }: AssetListProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "Files" }]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // ─── Queries ────────────────────────────────────────────────
  const assetsQuery = trpc.file.getAssets.useQuery({
    projectId,
    folderId: currentFolderId,
  });

  const foldersQuery = trpc.file.getFolders.useQuery({
    projectId,
    parentId: currentFolderId,
  });

  const versionHistoryQuery = trpc.file.getVersionHistory.useQuery(
    { assetId: selectedAssetId! },
    { enabled: !!selectedAssetId },
  );

  // ─── Navigation ─────────────────────────────────────────────
  const enterFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderBreadcrumbs((prev) => [
      ...prev,
      { id: folderId, name: folderName },
    ]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const crumb = folderBreadcrumbs[index];
    setCurrentFolderId(crumb.id);
    setFolderBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  // ─── Download ───────────────────────────────────────────────
  const downloadMutation = trpc.file.getSignedDownloadUrl.useQuery(
    { storagePath: "" },
    { enabled: false }, // Manual trigger only
  );

  const handleDownload = async (storagePath: string, fileName: string) => {
    // Use a direct query call for download
    try {
      const result = await trpc.file.getSignedDownloadUrl.useQuery({
        storagePath,
      });
      // Open in new tab for download
      window.open(result.data?.url, "_blank");
    } catch {
      // Fallback: use the trpc utils
    }
  };

  // ─── Render ─────────────────────────────────────────────────
  const isLoading = assetsQuery.isLoading || foldersQuery.isLoading;
  const allFolders = foldersQuery.data ?? [];
  const allAssets = assetsQuery.data ?? [];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            {folderBreadcrumbs.map((crumb, i) => (
              <span key={crumb.id ?? "root"} className="flex items-center">
                {i > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className={
                    i === folderBreadcrumbs.length - 1
                      ? "font-medium text-foreground"
                      : "hover:text-foreground transition-colors"
                  }
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>

          <CardTitle className="text-lg">Project Files</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : allFolders.length === 0 && allAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">No files yet</p>
              <p className="text-sm mt-1">
                Upload your first deliverable above
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Folders */}
              {allFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => enterFolder(folder.id, folder.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <FolderIcon className="h-5 w-5 text-yellow-500 shrink-0" />
                  <span className="font-medium text-sm">{folder.name}</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </button>
              ))}

              {/* Assets */}
              {allAssets.map((asset) => {
                const Icon = getFileIcon(asset.type);
                return (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {asset.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {asset.size && (
                          <span>{formatFileSize(asset.size)}</span>
                        )}
                        {asset.versionNumber && (
                          <span>v{asset.versionNumber}</span>
                        )}
                        {asset.updatedAt && (
                          <span>
                            {formatDistanceToNow(new Date(asset.updatedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Approval Badge */}
                    <Badge
                      variant={
                        APPROVAL_BADGE_VARIANT[asset.approvalStatus] ??
                        "outline"
                      }
                      className="text-xs shrink-0"
                    >
                      {APPROVAL_LABELS[asset.approvalStatus] ??
                        asset.approvalStatus}
                    </Badge>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            asset.storagePath &&
                            handleDownload(asset.storagePath, asset.name)
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedAssetId(asset.id)}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Version History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version History Side Panel */}
      <Sheet
        open={!!selectedAssetId}
        onOpenChange={(open) => !open && setSelectedAssetId(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {versionHistoryQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : (
              versionHistoryQuery.data?.map((version) => (
                <div
                  key={version.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Version {version.versionNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {version.uploaderName ?? "Unknown"} •{" "}
                      {formatFileSize(version.size)} •{" "}
                      {formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(
                        version.storagePath,
                        `v${version.versionNumber}`,
                      )
                    }
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

---

### Step 7 — Files Page Integration

Update `src/app/(dashboard)/projects/[projectId]/files/page.tsx`:

```tsx
import { Suspense } from "react";
import { FileUploader } from "@/features/files/components/FileUploader";
import { AssetList } from "@/features/files/components/AssetList";

type FilesPageProps = {
  params: { projectId: string };
};

export default function FilesPage({ params }: FilesPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Files</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload deliverables, manage versions, and track approvals.
        </p>
      </div>

      {/* Upload Zone */}
      <FileUploader projectId={params.projectId} />

      {/* File List */}
      <Suspense
        fallback={
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        }
      >
        <AssetList projectId={params.projectId} />
      </Suspense>
    </div>
  );
}
```

---

## Critical PRD Constraints Cross-Check

| PRD Constraint                                         | Where Enforced             | Implementation                                                  |
| ------------------------------------------------------ | -------------------------- | --------------------------------------------------------------- |
| **Versioning:** Nest versions under generic asset name | `AssetList.tsx`            | UI groups by `assets.name`; version dropdown via `Sheet`        |
| **DB trigger:** `current_version_id` auto-updates      | `02-database.md`           | `on_new_version_upload` trigger fires on `file_versions` INSERT |
| **Approval reset on new version**                      | `createFileVersion` action | Sets `approvalStatus = 'pending_review'` on every new version   |
| **Client Uploads folder restriction**                  | `getUploadToken` + RLS     | Pre-check in action + Storage RLS policy from Task 03           |
| **Signed URLs (1-hour expiry)**                        | `getSignedDownloadUrl`     | `createSignedUrl(path, 3600)`                                   |
| **Max file size per plan**                             | `getUploadToken`           | Checked against `MAX_FILE_SIZE[ctx.plan]`                       |
| **MIME type allowlist**                                | `getUploadToken`           | Checked against `ALLOWED_MIME_TYPES` array                      |
| **Soft delete**                                        | `getAssets` query          | `isNull(assets.deletedAt)` filter excludes deleted assets       |
| **Mutation Boundary**                                  | Architecture               | Server Actions for mutations, tRPC for queries (PRD §10.2)      |

---

## File Outputs

| File                                                      | Purpose                                               |
| --------------------------------------------------------- | ----------------------------------------------------- |
| `src/features/files/schemas.ts`                           | Zod schemas, MIME types, size limits                  |
| `src/features/files/server/actions.ts`                    | `getUploadToken` + `createFileVersion` Server Actions |
| `src/features/files/server/router.ts`                     | tRPC queries for assets, versions, folders, downloads |
| `src/features/files/components/FileUploader.tsx`          | Drag-and-drop upload zone with progress               |
| `src/features/files/components/AssetList.tsx`             | Browsable file list with folder nav + version history |
| `src/app/(dashboard)/projects/[projectId]/files/page.tsx` | Page wiring the uploader + asset list                 |

---

## Validation Checklist

### Functional

- [ ] Supabase Storage bucket `project-files` exists and is set to **private**.
- [ ] Uploading `Logo.png` creates **one** row in `assets` + **one** row in `file_versions` (v1).
- [ ] Uploading `Logo.png` again (as v2 of the same asset) creates **no new asset** + **one** new row in `file_versions` (v2).
- [ ] After v2 upload, `assets.current_version_id` points to the v2 `file_versions.id` (trigger verification).
- [ ] `assets.approval_status` resets to `pending_review` on every new version upload.
- [ ] The `AssetList` displays `Logo.png` once, showing `v2` as the current version.
- [ ] Clicking "Version History" opens the `Sheet` panel showing both v1 and v2 with download buttons.
- [ ] Downloading a file opens a signed URL that expires after 1 hour.

### Security

- [ ] Client role can ONLY upload to a folder named **"Client Uploads"** — server action rejects other folders.
- [ ] Guest role cannot upload at all — server action returns error.
- [ ] File size exceeding plan limit is rejected **before** generating a signed URL.
- [ ] MIME type outside the allowlist is rejected server-side.
- [ ] Project ownership is verified against `ctx.orgId` in both upload actions.

### UI

- [ ] Drag-and-drop zone highlights on drag-over.
- [ ] Progress bar animates during upload (pending → uploading → success/error).
- [ ] Empty state shows when no files exist in the project.
- [ ] Folder breadcrumb navigation works (root → subfolder → back).
- [ ] Loading skeletons display while queries are in-flight.
- [ ] Approval status badges use correct colors: `pending_review` = outline, `approved` = green, `changes_requested` = red.

---

## References

- PRD §6.4 — File Sharing & Approval System (versioning, storage, approval workflow)
- PRD §9 — Pricing (plan-based file size and storage limits)
- PRD §10.2 — Architectural Rules (mutation boundary, Drizzle RLS factory)
- PRD §11 — Database Schema (assets, file_versions, folders tables)
- PRD §11 — Database Triggers (update_asset_latest_version)
- PRD §12 — Non-Functional Requirements (signed URL expiry, performance targets)
- Task 02 — Database schema and file versioning trigger
- Task 03 — RLS policies for Storage (Client Uploads folder restriction)
