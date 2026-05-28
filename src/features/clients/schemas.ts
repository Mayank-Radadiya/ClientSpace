import { z } from "zod";

// ─── Invite & Accept-Invite Schemas ───────────────────────────────────────────

export const inviteClientSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "A valid email is required." })
    .describe("Email address of the client to invite"),
  companyName: z
    .string()
    .trim()
    .min(1, { message: "Company name is required." })
    .max(120, { message: "Company name must be 120 characters or less." })
    .describe("Client's company or business name"),
  contactName: z
    .string()
    .trim()
    .min(1, { message: "Contact name is required." })
    .max(120, { message: "Contact name must be 120 characters or less." })
    .describe("Full name of the primary contact"),
});

export type InviteClientInput = z.infer<typeof inviteClientSchema>;

/** Accept Invite — Sign Up (new user creating an account via invite link). */
export const acceptInviteSignUpSchema = z
  .object({
    token: z
      .string()
      .min(1, "Invalid invitation token.")
      .describe("Raw hex invite token from the URL"),
    email: z.string().email().describe("Pre-filled email from invitation"),
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(100, { message: "Name must be 100 characters or less." })
      .describe("Display name for the new account"),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(72, { message: "Password must be 72 characters or less." })
      .describe("Account password (8–72 chars)"),
    confirmPassword: z.string().describe("Must match password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type AcceptInviteSignUpInput = z.infer<typeof acceptInviteSignUpSchema>;

/** Accept Invite — Sign In (existing user accepting a second-org invite). */
export const acceptInviteSignInSchema = z.object({
  token: z
    .string()
    .min(1, "Invalid invitation token.")
    .describe("Raw hex invite token from the URL"),
  email: z.string().email().describe("Pre-filled email from invitation"),
  password: z
    .string()
    .min(1, { message: "Password is required." })
    .describe("Existing account password"),
});

export type AcceptInviteSignInInput = z.infer<typeof acceptInviteSignInSchema>;

// ─── Client Lifecycle Status ───────────────────────────────────────────────────

/** Valid lifecycle statuses for a client record. */
export const lifecycleStatusSchema = z
  .enum(["prospect", "active", "on_hold", "churned", "archived"])
  .describe("Current lifecycle status of the client relationship");

export type ClientLifecycleStatus = z.infer<typeof lifecycleStatusSchema>;

// ─── Shared clientId-only input ────────────────────────────────────────────────

/**
 * Used by archive / unarchive / delete / getById / getClientProjects /
 * getClientInvoices / getClientActivity procedures — all require only clientId.
 */
export const clientIdSchema = z.object({
  clientId: z
    .string()
    .uuid()
    .describe("UUID of the target client record"),
});

export type ClientIdInput = z.infer<typeof clientIdSchema>;

// ─── Update Client Profile ─────────────────────────────────────────────────────

export const updateClientSchema = z.object({
  clientId: z
    .string()
    .uuid()
    .describe("UUID of the client record to update"),
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(120, "Company name must be 120 characters or less")
    .describe("Updated company / business name"),
  contactName: z
    .string()
    .trim()
    .min(1, "Contact name is required")
    .max(120, "Contact name must be 120 characters or less")
    .describe("Updated primary contact name"),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ─── Update Lifecycle Status ───────────────────────────────────────────────────

export const updateLifecycleSchema = z.object({
  clientId: z
    .string()
    .uuid()
    .describe("UUID of the client record"),
  lifecycleStatus: lifecycleStatusSchema,
});

export type UpdateLifecycleInput = z.infer<typeof updateLifecycleSchema>;

// ─── Client Notes Schemas ──────────────────────────────────────────────────────

/** Cursor-paginated list of notes for a client. */
export const listClientNotesSchema = z.object({
  clientId: z
    .string()
    .uuid()
    .describe("UUID of the client whose notes to fetch"),
  cursor: z
    .string()
    .uuid()
    .optional()
    .describe("UUID of the last note seen — omit for first page"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe("Page size (1–50, default 20)"),
});

export type ListClientNotesInput = z.infer<typeof listClientNotesSchema>;

/** Create a new internal note on a client. */
export const createClientNoteSchema = z.object({
  clientId: z
    .string()
    .uuid()
    .describe("UUID of the client to attach the note to"),
  content: z
    .string()
    .trim()
    .min(1, "Note content cannot be empty")
    .max(10_000, "Note must be 10,000 characters or less")
    .describe("Markdown-safe note body"),
});

export type CreateClientNoteInput = z.infer<typeof createClientNoteSchema>;

/** Update the body of an existing client note. */
export const updateClientNoteSchema = z.object({
  noteId: z
    .string()
    .uuid()
    .describe("UUID of the note to update"),
  content: z
    .string()
    .trim()
    .min(1, "Note content cannot be empty")
    .max(10_000, "Note must be 10,000 characters or less")
    .describe("New note body"),
});

export type UpdateClientNoteInput = z.infer<typeof updateClientNoteSchema>;

/** Target a specific note by its ID (for delete / toggle-pin). */
export const noteIdSchema = z.object({
  noteId: z
    .string()
    .uuid()
    .describe("UUID of the note"),
});

export type NoteIdInput = z.infer<typeof noteIdSchema>;
