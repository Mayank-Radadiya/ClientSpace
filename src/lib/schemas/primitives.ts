/**
 * src/lib/schemas/primitives.ts
 * ─────────────────────────────
 * Shared Zod primitives used across 3+ feature modules.
 *
 * Rules:
 *  - Only extract here if genuinely reused in 3+ places.
 *  - Features may import from src/lib/ per eslint-plugin-boundaries config.
 *  - Never import feature-specific types from this file.
 */

import { z } from "zod";

// ─── UUID helpers ──────────────────────────────────────────────────────────────

/** A Zod string validated as a UUID v4. */
export const uuidSchema = z
  .string()
  .uuid()
  .describe("UUID v4 identifier");

// ─── Cursor-based pagination ───────────────────────────────────────────────────

/**
 * Standard cursor-pagination input used by list endpoints.
 * cursor — opaque UUID of the last item seen (optional for first page).
 * limit  — page size, 1–100, default 20.
 */
export const cursorPaginationSchema = z
  .object({
    cursor: z
      .string()
      .uuid()
      .optional()
      .describe("UUID of the last item seen — omit for first page"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Number of items to return (1–100)"),
  });

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;
