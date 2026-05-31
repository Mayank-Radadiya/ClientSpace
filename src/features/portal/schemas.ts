/**
 * src/features/portal/schemas.ts
 * ────────────────────────────────
 * Canonical Zod schemas for the Client Portal feature.
 * Used by Server Actions and tRPC procedures alike.
 *
 * Rules:
 *  - Always use .safeParse() in Server Actions — never .parse()
 *  - Never import from another feature's schemas.ts
 */

import { z } from "zod";

// ─── Asset Status Update ───────────────────────────────────────────────────────

/**
 * Input for updateAssetStatusAction — called by clients when approving or
 * requesting changes on a file in their portal.
 */
export const updateAssetStatusSchema = z.object({
  assetId: z
    .string()
    .uuid()
    .describe("UUID of the file asset being reviewed"),
  projectId: z
    .string()
    .uuid()
    .describe("UUID of the project that owns the asset"),
  status: z
    .enum(["approved", "changes_requested"])
    .describe("Client's decision on the asset"),
  /**
   * When true, the caller is an authenticated org member previewing the
   * portal as a guest. The `clients` table check is bypassed and identity
   * is resolved from the org_memberships table instead.
   */
  previewMode: z.boolean().optional().default(false),
});

export type UpdateAssetStatusInput = z.infer<typeof updateAssetStatusSchema>;
