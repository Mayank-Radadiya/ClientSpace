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
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100).trim(),
  description: z.string().min(1, "Description is required").max(5000),
  clientId: z.string().uuid("Please select a valid client"),
  status: z.enum(PROJECT_STATUSES).default("not_started"),
  priority: z.enum(PROJECT_PRIORITIES).default("medium"),
  startDate: z.date().optional().nullable(),
  deadline: z.date(),
  budget: z.number().int().min(0).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10, "Maximum 10 tags").default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// Partial version for updates — all fields optional
export const updateProjectSchema = projectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
