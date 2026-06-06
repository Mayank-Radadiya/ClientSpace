import { createDrizzleClient } from "@/db/createDrizzleClient";
import { and, eq } from "drizzle-orm";
import { projects, projectMembers, orgMemberships, users } from "@/db/schema";

/**
 * Inserts a new project into the database with explicit column mapping.
 */
export async function createProject(orgId: string, input: {
  clientId: string;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "review" | "completed" | "on_hold" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  startDate?: Date | null;
  deadline: Date;
  budget?: number | null;
  tags?: string[];
}) {
  try {
    const db = await createDrizzleClient();

    const toDateString = (date: Date): string => {
      return date.toISOString().split("T")[0]!;
    };

    const [newProject] = await db
      .insert(projects)
      .values({
        orgId,
        clientId: input.clientId,
        name: input.name,
        description: input.description,
        status: input.status,
        priority: input.priority,
        startDate: input.startDate ? toDateString(input.startDate) : null,
        deadline: toDateString(input.deadline),
        budget: input.budget ?? null,
        tags: input.tags ?? [],
      })
      .returning({
        id: projects.id,
        orgId: projects.orgId,
        clientId: projects.clientId,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        priority: projects.priority,
        startDate: projects.startDate,
        deadline: projects.deadline,
        budget: projects.budget,
        tags: projects.tags,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      });

    if (!newProject) {
      throw new Error("Failed to insert new project.");
    }
    return newProject;
  } catch (error) {
    console.error("[createProject] Database insert failed:", error);
    throw error;
  }
}

/**
 * Updates an existing project in the database and returns the modified record.
 */
export async function updateProject(orgId: string, projectId: string, input: {
  name?: string;
  description?: string;
  clientId?: string;
  status?: "not_started" | "in_progress" | "review" | "completed" | "on_hold" | "archived";
  priority?: "low" | "medium" | "high" | "urgent";
  startDate?: Date | null;
  deadline?: Date;
  budget?: number | null;
  tags?: string[];
}) {
  try {
    const db = await createDrizzleClient();

    const toDateString = (date: Date): string => {
      return date.toISOString().split("T")[0]!;
    };

    const updateValues: Record<string, any> = { updatedAt: new Date() };
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.clientId !== undefined) updateValues.clientId = input.clientId;
    if (input.status !== undefined) updateValues.status = input.status;
    if (input.priority !== undefined) updateValues.priority = input.priority;
    if (input.startDate !== undefined) {
      updateValues.startDate = input.startDate ? toDateString(input.startDate) : null;
    }
    if (input.deadline !== undefined) {
      updateValues.deadline = toDateString(input.deadline);
    }
    if (input.budget !== undefined) updateValues.budget = input.budget;
    if (input.tags !== undefined) updateValues.tags = input.tags;

    const [updated] = await db
      .update(projects)
      .set(updateValues)
      .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
      .returning({
        id: projects.id,
        orgId: projects.orgId,
        clientId: projects.clientId,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        priority: projects.priority,
        startDate: projects.startDate,
        deadline: projects.deadline,
        budget: projects.budget,
        tags: projects.tags,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      });

    if (!updated) {
      throw new Error("Project not found or update failed.");
    }
    return updated;
  } catch (error) {
    console.error("[updateProject] Database update failed:", error);
    throw error;
  }
}

/**
 * Deletes a project from the database.
 */
export async function deleteProject(orgId: string, projectId: string) {
  try {
    const db = await createDrizzleClient();
    const [deleted] = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
      .returning({ id: projects.id });

    if (!deleted) {
      throw new Error("Project not found or delete failed.");
    }
    return deleted;
  } catch (error) {
    console.error("[deleteProject] Database delete failed:", error);
    throw error;
  }
}

/**
 * Adds an existing org member to a project by their email address.
 * Throws descriptive errors for: user not found, not in org, already a member.
 */
export async function addProjectMember(
  orgId: string,
  projectId: string,
  email: string,
) {
  const db = await createDrizzleClient();

  // 1. Resolve email → user
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    throw new Error("No account found with that email address.");
  }

  // 2. Must already belong to this org
  const [membership] = await db
    .select({ role: orgMemberships.role })
    .from(orgMemberships)
    .where(
      and(eq(orgMemberships.userId, user.id), eq(orgMemberships.orgId, orgId)),
    )
    .limit(1);

  if (!membership) {
    throw new Error("That user is not a member of your organisation.");
  }

  // 3. Guard duplicate
  const [existing] = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, user.id),
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error("That person is already a member of this project.");
  }

  // 4. Insert
  await db.insert(projectMembers).values({ projectId, userId: user.id });

  return { userId: user.id, email: user.email };
}
