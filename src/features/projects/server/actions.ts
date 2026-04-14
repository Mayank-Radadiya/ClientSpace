"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import { projects, clients } from "@/db/schema";
import { projectSchema, updateProjectSchema } from "../schemas";
import {
  revalidateMembersCache,
  revalidateMilestonesCache,
  revalidateProjectCache,
} from "./cache";

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in to create a project." };

  if (ctx.role === "client")
    return { error: "Clients cannot create projects." };

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
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { data } = parsed;

  let createdProjectId: string | null = null;

  const errorMsg = await withRLS(ctx, async (tx) => {
    const client = await tx.query.clients.findFirst({
      where: and(eq(clients.id, data.clientId), eq(clients.orgId, ctx.orgId)),
    });
    if (!client) return "Selected client does not belong to your organization.";

    try {
      const [created] = await tx
        .insert(projects)
        .values({
          orgId: ctx.orgId,
          clientId: data.clientId,
          name: data.name,
          description: data.description,
          status: data.status as any,
          priority: data.priority as any,
          startDate: data.startDate ? toDateString(data.startDate) : null,
          deadline: toDateString(data.deadline),
          budget: data.budget ?? null,
          tags: data.tags,
        })
        .returning({ id: projects.id });
      createdProjectId = created?.id ?? null;
      return null;
    } catch (err) {
      console.error("createProjectAction:", err);
      return "Something went wrong. Please try again.";
    }
  });

  if (errorMsg) return { error: errorMsg };

  revalidatePath("/dashboard/projects");
  if (createdProjectId) {
    revalidateProjectCache(ctx.orgId, createdProjectId);
    revalidateMilestonesCache(ctx.orgId, createdProjectId);
    revalidateMembersCache(ctx.orgId, createdProjectId);
  }
  return { success: true };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateProjectAction(
  projectId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in to update a project." };

  if (ctx.role === "client") return { error: "Clients cannot edit projects." };

  const newStatus = formData.get("status") as string | null;
  if (
    newStatus &&
    (newStatus === "completed" || newStatus === "archived") &&
    ctx.role === "member"
  ) {
    return { error: "Only Admins can mark projects as Completed or Archived." };
  }

  const raw: Record<string, unknown> = {};
  for (const field of [
    "name",
    "description",
    "clientId",
    "status",
    "priority",
  ] as const) {
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
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const errorMsg = await withRLS(ctx, async (tx) => {
    const existing = await tx.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)),
    });
    if (!existing) return "Project not found.";

    if (parsed.data.clientId) {
      const newClient = await tx.query.clients.findFirst({
        where: and(
          eq(clients.id, parsed.data.clientId),
          eq(clients.orgId, ctx.orgId),
        ),
      });
      if (!newClient)
        return "Selected client does not belong to your organization.";
    }

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    const d = parsed.data;
    if (d.name !== undefined) updateValues.name = d.name;
    if (d.description !== undefined) updateValues.description = d.description;
    if (d.clientId !== undefined) updateValues.clientId = d.clientId;
    if (d.status !== undefined) updateValues.status = d.status;
    if (d.priority !== undefined) updateValues.priority = d.priority;
    if (d.startDate !== undefined)
      updateValues.startDate = d.startDate ? toDateString(d.startDate) : null;
    if (d.deadline !== undefined)
      updateValues.deadline = toDateString(d.deadline!);
    if (d.budget !== undefined) updateValues.budget = d.budget;
    if (d.tags !== undefined) updateValues.tags = d.tags;

    try {
      await tx
        .update(projects)
        .set(updateValues)
        .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)));
      return null;
    } catch (err) {
      console.error("updateProjectAction:", err);
      return "Something went wrong. Please try again.";
    }
  });

  if (errorMsg) return { error: errorMsg };

  revalidatePath("/dashboard/projects");
  revalidateProjectCache(ctx.orgId, projectId);
  revalidateMilestonesCache(ctx.orgId, projectId);
  revalidateMembersCache(ctx.orgId, projectId);
  return { success: true };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in to delete a project." };

  if (ctx.role === "client" || ctx.role === "member") {
    return { error: "Only Admins and Owners can delete projects." };
  }

  const errorMsg = await withRLS(ctx, async (tx) => {
    const existing = await tx.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)),
    });
    if (!existing) return "Project not found.";

    try {
      await tx
        .delete(projects)
        .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)));
      return null;
    } catch (err) {
      console.error("deleteProjectAction:", err);
      return "Something went wrong. Please try again.";
    }
  });

  if (errorMsg) return { error: errorMsg };

  revalidatePath("/dashboard/projects");
  revalidateProjectCache(ctx.orgId, projectId);
  revalidateMilestonesCache(ctx.orgId, projectId);
  revalidateMembersCache(ctx.orgId, projectId);
  return { success: true };
}
