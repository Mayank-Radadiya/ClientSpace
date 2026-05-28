import { z } from "zod";
import { projectStatusEnum, projectPriorityEnum } from "@/db/schema";

// Derived directly from Drizzle enums — single source of truth, no drift
export const PROJECT_STATUSES = projectStatusEnum.enumValues;
export const PROJECT_PRIORITIES = projectPriorityEnum.enumValues;

export const STATUS_LABELS: Record<(typeof PROJECT_STATUSES)[number], string> =
  {
    not_started: "Not Started",
    in_progress: "In Progress",
    review: "Review",
    completed: "Completed",
    on_hold: "On Hold",
    archived: "Archived",
  };

export const PRIORITY_LABELS: Record<
  (typeof PROJECT_PRIORITIES)[number],
  string
> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

// org_id is intentionally excluded — always injected server-side from session
export const baseProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or less")
    .trim(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .trim(),
  clientId: z.string().uuid("Please select a valid client"),
  status: z.enum(PROJECT_STATUSES).default("not_started"),
  priority: z.enum(PROJECT_PRIORITIES).default("medium"),
  startDate: z.coerce.date().nullable(),
  deadline: z.coerce.date(),
  budget: z.coerce
    .number()
    .int("Budget must be a whole number")
    .min(0, "Budget cannot be negative")
    .max(1000000000, "Budget cannot exceed $1 billion")
    .optional()
    .nullable(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(50, "Tag must be 50 characters or less"),
    )
    .max(10, "Maximum 10 tags allowed")
    .default([]),
});

export const projectSchema = baseProjectSchema
  .refine(
    (data) => {
      // Deadline must be after start date if start date is provided
      if (data.startDate && data.deadline) {
        return data.deadline >= data.startDate;
      }
      return true;
    },
    {
      message: "Deadline must be on or after the start date",
      path: ["deadline"],
    },
  )
  .refine(
    (data) => {
      // Deadline should be in the future (allow up to 1 day in the past for flexibility)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return data.deadline >= oneDayAgo;
    },
    {
      message: "Deadline should be in the future",
      path: ["deadline"],
    },
  );

export type ProjectInput = z.infer<typeof projectSchema>;

// Partial version for updates — all fields optional
export const updateProjectSchema = baseProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ─── Milestone Schemas ────────────────────────────────────────────────────────

/** A single sub-task item within a milestone. */
export const subTaskSchema = z.object({
  id: z
    .string()
    .describe("Client-generated ID for the sub-task"),
  label: z
    .string()
    .min(1, "Sub-task label cannot be empty")
    .max(500, "Sub-task label must be 500 characters or less")
    .describe("Short description of the sub-task"),
  completed: z
    .boolean()
    .describe("Whether the sub-task has been checked off"),
});

export type SubTask = z.infer<typeof subTaskSchema>;

/** Valid statuses for a milestone. */
export const milestoneStatusSchema = z
  .enum(["todo", "in_progress", "done"])
  .describe("Current status of the milestone");

export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;

/** Valid priorities for a milestone. */
export const milestonePrioritySchema = z
  .enum(["low", "medium", "high", "urgent"])
  .describe("Priority level of the milestone");

export type MilestonePriority = z.infer<typeof milestonePrioritySchema>;

/** Create a new milestone inside a project. */
export const createMilestoneSchema = z.object({
  projectId: z
    .string()
    .uuid()
    .describe("UUID of the project this milestone belongs to"),
  title: z
    .string()
    .min(1, "Milestone title is required")
    .max(300, "Milestone title must be 300 characters or less")
    .describe("Short title of the milestone"),
  status: milestoneStatusSchema.default("todo"),
  priority: milestonePrioritySchema.default("medium"),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .describe("ISO date string for the due date"),
  startDate: z
    .string()
    .nullable()
    .optional()
    .describe("ISO date string for the start date"),
  order: z
    .number()
    .int()
    .nonnegative()
    .describe("0-based display order within the project"),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

/** Update a milestone's status (and derived completed / completedAt). */
export const updateMilestoneStatusSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("UUID of the milestone"),
  status: milestoneStatusSchema,
});

export type UpdateMilestoneStatusInput = z.infer<
  typeof updateMilestoneStatusSchema
>;

/** Update milestone fields (title, description, priority, dates, assignee). */
export const updateMilestoneSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("UUID of the milestone to update"),
  title: z
    .string()
    .min(1, "Milestone title is required")
    .max(300, "Milestone title must be 300 characters or less")
    .optional()
    .describe("Updated milestone title"),
  description: z
    .string()
    .max(10_000, "Description must be 10,000 characters or less")
    .nullable()
    .optional()
    .describe("Extended description / acceptance criteria"),
  priority: milestonePrioritySchema.optional(),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .describe("Updated due date (ISO string)"),
  startDate: z
    .string()
    .nullable()
    .optional()
    .describe("Updated start date (ISO string)"),
  assigneeId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe("UUID of the team member assigned to this milestone"),
});

export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

/** Replace the sub-tasks array on a milestone. */
export const updateSubTasksSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("UUID of the milestone"),
  subTasks: z
    .array(subTaskSchema)
    .max(50, "Maximum 50 sub-tasks per milestone")
    .describe("Full replacement array of sub-tasks"),
});

export type UpdateSubTasksInput = z.infer<typeof updateSubTasksSchema>;

/** One item in a bulk reorder request. */
export const reorderMilestoneItemSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("UUID of the milestone"),
  order: z
    .number()
    .int()
    .nonnegative()
    .describe("New 0-based display order"),
  status: milestoneStatusSchema,
});

/** Bulk reorder milestones within a project (drag-and-drop). */
export const reorderMilestonesSchema = z.object({
  projectId: z
    .string()
    .uuid()
    .describe("UUID of the project"),
  items: z
    .array(reorderMilestoneItemSchema)
    .min(1, "At least one item is required")
    .describe("New order and status for each milestone"),
});

export type ReorderMilestonesInput = z.infer<typeof reorderMilestonesSchema>;

/** List milestones for a project. */
export const listMilestonesSchema = z.object({
  projectId: z
    .string()
    .uuid()
    .describe("UUID of the project whose milestones to fetch"),
});

/** Delete a milestone by ID. */
export const milestoneIdSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("UUID of the milestone to delete"),
});

// ─── Project Notes Schemas ────────────────────────────────────────────────────

/** Get internal team notes for a project. */
export const projectIdSchema = z.object({
  projectId: z
    .string()
    .uuid()
    .describe("UUID of the project"),
});

/** Upsert (auto-save) internal team notes for a project. */
export const upsertProjectNotesSchema = z.object({
  projectId: z
    .string()
    .uuid()
    .describe("UUID of the project"),
  content: z
    .string()
    .max(50_000, "Notes must be 50,000 characters or less")
    .describe("Full notes content (Markdown supported)"),
});

export type UpsertProjectNotesInput = z.infer<typeof upsertProjectNotesSchema>;
