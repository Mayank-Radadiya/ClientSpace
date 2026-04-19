import { z } from "zod";

export const createCommentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment cannot be empty.")
    .max(4000, "Comment exceeds the 4,000-character limit."),
  assetId: z.string().uuid(),
  parentId: z.string().uuid().nullable().default(null),
});

export const editCommentSchema = z.object({
  commentId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type EditCommentInput = z.infer<typeof editCommentSchema>;
