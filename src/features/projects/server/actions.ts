"use server";

import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import { projects, clients } from "@/db/schema";
import { projectSchema, updateProjectSchema } from "../schemas";
import { createProject, updateProject, deleteProject } from "./mutations";

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || value === "") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function parseTags(value: FormDataEntryValue | null): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Server Action for creating a project via form submission.
 */
export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in to create a project." };
  if (ctx.role === "client") return { error: "Clients cannot create projects." };

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    clientId: formData.get("clientId"),
    status: formData.get("status") || "not_started",
    priority: formData.get("priority") || "medium",
    startDate: parseDate(formData.get("startDate")),
    deadline: parseDate(formData.get("deadline")) ?? undefined,
    budget: formData.get("budget") ? Number(formData.get("budget")) : null,
    tags: parseTags(formData.get("tags")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const newProject = await createProject(ctx.orgId, parsed.data);
    revalidateTag(`org-${ctx.orgId}-projects`, "max");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create project." };
  }
}

/**
 * Server Action for updating a project via form submission.
 */
export async function updateProjectAction(
  projectId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in to update a project." };
  if (ctx.role === "client") return { error: "Clients cannot edit projects." };

  const newStatus = formData.get("status") as string | null;
  if (newStatus && (newStatus === "completed" || newStatus === "archived") && ctx.role === "member") {
    return { error: "Only Admins can mark projects as Completed or Archived." };
  }

  const raw: Record<string, any> = {};
  for (const field of ["name", "description", "clientId", "status", "priority"] as const) {
    const val = formData.get(field);
    if (val !== null) raw[field] = val;
  }
  const startDate = parseDate(formData.get("startDate"));
  if (startDate !== null) raw.startDate = startDate;

  const deadline = parseDate(formData.get("deadline"));
  if (deadline !== null) raw.deadline = deadline;

  const budget = formData.get("budget");
  if (budget) raw.budget = Number(budget);

  const tags = formData.get("tags");
  if (tags) raw.tags = parseTags(tags);

  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateProject(ctx.orgId, projectId, parsed.data);
    revalidateTag(`org-${ctx.orgId}-projects`, "max");
    revalidateTag(`org-${ctx.orgId}-project-${projectId}`, "max");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update project." };
  }
}

/**
 * Server Action for deleting a project.
 */
export async function deleteProjectAction(projectId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in to delete a project." };
  if (ctx.role === "client" || ctx.role === "member") {
    return { error: "Only Admins and Owners can delete projects." };
  }

  try {
    await deleteProject(ctx.orgId, projectId);
    revalidateTag(`org-${ctx.orgId}-projects`, "max");
    revalidateTag(`org-${ctx.orgId}-project-${projectId}`, "max");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete project." };
  }
}

// ── v4 revalidation wrappers ──────────────────────────────────────────────────
// Called client-side after tRPC mutations resolve (Fix 7).
// tRPC procedures cannot call revalidateTag() directly.

/** Invalidate the milestone list cache for a project. */
export async function revalidateMilestones(projectId: string): Promise<void> {
  revalidateTag(`milestones-${projectId}`, "max");
}

/** Invalidate the file/asset cache for a project. */
export async function revalidateFiles(projectId: string): Promise<void> {
  revalidateTag(`files-${projectId}`, "max");
}

/** Invalidate the project notes cache. */
export async function revalidateProjectNotes(projectId: string): Promise<void> {
  revalidateTag(`notes-${projectId}`, "max");
}

/** Invalidate the asset approval status cache. */
export async function revalidateAssetApproval(assetId: string, projectId: string): Promise<void> {
  revalidateTag(`asset-${assetId}`, "max");
  revalidateTag(`files-${projectId}`, "max");
}

