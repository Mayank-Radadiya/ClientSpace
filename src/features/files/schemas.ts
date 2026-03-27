import { z } from "zod";

// ─── MIME Type Allowlist ──────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  // Images
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "image/gif",
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  // Design
  "image/vnd.adobe.photoshop",
  "application/postscript",
  "application/x-figma",
  "application/x-sketch",
] as const;

// ─── Plan-based File Size Limits (PRD §9) ─────────────────────────────────────

export const MAX_FILE_SIZE: Record<string, number> = {
  starter: 50 * 1024 * 1024, // 50 MB
  pro: 75 * 1024 * 1024, // 75 MB
  growth: 100 * 1024 * 1024, // 100 MB
  business: Infinity, // Unlimited (Phase 2: BYOS)
};

// ─── Shared Action Return Type ────────────────────────────────────────────────

export type ActionState = {
  success?: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

// ─── Step 1: Request a Signed Upload URL ──────────────────────────────────────

export const uploadRequestSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
  folderId: z.string().uuid().optional().nullable(),
  existingAssetId: z.string().uuid().optional().nullable(), // null = new asset
  autoApproveAfterDays: z.number().int().min(1).max(30).optional().nullable(),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

// ─── Step 3: Record Metadata After Successful Upload ──────────────────────────

export const createFileVersionSchema = z.object({
  projectId: z.string().uuid(),
  storagePath: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileType: z.string().min(1),
  fileName: z.string().max(255).optional().nullable(), // required for new assets
  folderId: z.string().uuid().optional().nullable(),
  existingAssetId: z.string().uuid().optional().nullable(),
  autoApproveAfterDays: z.number().int().min(1).max(30).optional().nullable(),
});

export type CreateFileVersionInput = z.infer<typeof createFileVersionSchema>;
