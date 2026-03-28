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
