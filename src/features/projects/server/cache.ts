import { unstable_cache, revalidateTag } from "next/cache";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import {
  assets,
  comments,
  folders,
  invoices,
  milestones,
  projectMembers,
  projects,
  users,
  clients,
  activityLogs,
  orgMemberships,
} from "@/db/schema";
import type { ActivityEventMetadata } from "@/db/schema";

type SessionCtx = {
  userId: string;
  orgId: string;
};

type ProjectDetailProject = {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  description: string;
  status:
    | "not_started"
    | "in_progress"
    | "review"
    | "completed"
    | "on_hold"
    | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  start_date: string | null;
  deadline: string;
  budget: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  client?: {
    company_name: string | null;
    contact_name: string | null;
    email: string;
  };
};

type ProjectMilestone = {
  id: string;
  org_id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  order: number;
};

type ProjectMember = {
  user_id: string;
  project_id: string;
  assigned_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
};

type ProjectFolder = {
  id: string;
  org_id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
};

type ProjectAsset = {
  id: string;
  org_id: string;
  project_id: string;
  folder_id: string | null;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
};

type ProjectComment = {
  id: string;
  org_id: string;
  project_id: string;
  asset_id: string | null;
  author_id: string;
  body: string;
  parent_id: string | null;
  hidden: boolean;
  metadata: unknown;
  created_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

type ProjectInvoice = {
  id: string;
  org_id: string;
  client_id: string;
  project_id: string | null;
  number: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string | null;
  currency: string;
  amount_cents: number;
  pdf_url: string | null;
  created_at: string;
};

type ProjectActivity = {
  id: string;
  eventType: string;
  metadata: ActivityEventMetadata;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  actorRole: string | null;
  project: { id: string; name: string } | null;
};

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

function cacheTag(base: string, orgId: string, projectId: string): string {
  return `${base}-${orgId}-${projectId}`;
}

export async function getCachedProject(
  ctx: SessionCtx,
  projectId: string,
): Promise<ProjectDetailProject | null> {
  return unstable_cache(
    async () => {
      return withRLS(ctx, async (tx) => {
        const result = await tx
          .select({
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
            clientCompanyName: clients.companyName,
            clientContactName: clients.contactName,
            clientEmail: clients.email,
          })
          .from(projects)
          .leftJoin(clients, eq(projects.clientId, clients.id))
          .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)))
          .limit(1);

        const row = result[0];
        if (!row) return null;

        return {
          id: row.id,
          org_id: row.orgId,
          client_id: row.clientId,
          name: row.name,
          description: row.description,
          status: row.status,
          priority: row.priority,
          start_date: row.startDate,
          deadline: row.deadline,
          budget: row.budget,
          tags: row.tags ?? [],
          created_at: toIso(row.createdAt) ?? "",
          updated_at: toIso(row.updatedAt) ?? "",
          client: row.clientEmail
            ? {
                company_name: row.clientCompanyName,
                contact_name: row.clientContactName,
                email: row.clientEmail,
              }
            : undefined,
        };
      });
    },
    ["project-detail", ctx.orgId, projectId, ctx.userId],
    {
      revalidate: 60,
      tags: [cacheTag("project", ctx.orgId, projectId)],
    },
  )();
}

export async function getCachedMilestones(
  ctx: SessionCtx,
  projectId: string,
): Promise<ProjectMilestone[]> {
  return unstable_cache(
    async () => {
      return withRLS(ctx, async (tx) => {
        const rows = await tx
          .select({
            id: milestones.id,
            orgId: milestones.orgId,
            projectId: milestones.projectId,
            title: milestones.title,
            dueDate: milestones.dueDate,
            completed: milestones.completed,
            completedAt: milestones.completedAt,
            order: milestones.order,
          })
          .from(milestones)
          .where(
            and(
              eq(milestones.orgId, ctx.orgId),
              eq(milestones.projectId, projectId),
            ),
          )
          .orderBy(asc(milestones.order));

        return rows.map((row) => ({
          id: row.id,
          org_id: row.orgId,
          project_id: row.projectId,
          title: row.title,
          due_date: row.dueDate,
          completed: row.completed,
          completed_at: toIso(row.completedAt),
          order: row.order,
        }));
      });
    },
    ["project-milestones", ctx.orgId, projectId, ctx.userId],
    {
      revalidate: 30,
      tags: [cacheTag("milestones", ctx.orgId, projectId)],
    },
  )();
}

export async function getCachedMembers(
  ctx: SessionCtx,
  projectId: string,
): Promise<ProjectMember[]> {
  return unstable_cache(
    async () => {
      return withRLS(ctx, async (tx) => {
        const rows = await tx
          .select({
            projectId: projectMembers.projectId,
            userId: projectMembers.userId,
            assignedAt: projectMembers.assignedAt,
            userName: users.name,
            userEmail: users.email,
            avatarUrl: users.avatarUrl,
          })
          .from(projectMembers)
          .innerJoin(projects, eq(projectMembers.projectId, projects.id))
          .innerJoin(users, eq(projectMembers.userId, users.id))
          .where(
            and(
              eq(projectMembers.projectId, projectId),
              eq(projects.orgId, ctx.orgId),
            ),
          );

        return rows.map((row) => ({
          user_id: row.userId,
          project_id: row.projectId,
          assigned_at: toIso(row.assignedAt) ?? "",
          user: {
            id: row.userId,
            name: row.userName,
            email: row.userEmail,
            avatar_url: row.avatarUrl,
          },
        }));
      });
    },
    ["project-members", ctx.orgId, projectId, ctx.userId],
    {
      revalidate: 120,
      tags: [cacheTag("members", ctx.orgId, projectId)],
    },
  )();
}

export async function getProjectFolders(
  ctx: SessionCtx,
  projectId: string,
): Promise<ProjectFolder[]> {
  return withRLS(ctx, async (tx) => {
    const rows = await tx
      .select({
        id: folders.id,
        orgId: folders.orgId,
        projectId: folders.projectId,
        parentId: folders.parentId,
        name: folders.name,
        createdAt: folders.createdAt,
      })
      .from(folders)
      .where(
        and(eq(folders.orgId, ctx.orgId), eq(folders.projectId, projectId)),
      )
      .orderBy(asc(folders.createdAt));

    return rows.map((row) => ({
      id: row.id,
      org_id: row.orgId,
      project_id: row.projectId,
      parent_id: row.parentId,
      name: row.name,
      created_at: toIso(row.createdAt) ?? "",
    }));
  });
}

export async function getProjectAssets(
  ctx: SessionCtx,
  projectId: string,
): Promise<ProjectAsset[]> {
  return withRLS(ctx, async (tx) => {
    const rows = await tx
      .select({
        id: assets.id,
        orgId: assets.orgId,
        projectId: assets.projectId,
        folderId: assets.folderId,
        name: assets.name,
        type: assets.type,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .where(
        and(
          eq(assets.orgId, ctx.orgId),
          eq(assets.projectId, projectId),
          isNull(assets.deletedAt),
        ),
      )
      .orderBy(desc(assets.createdAt));

    return rows.map((row) => ({
      id: row.id,
      org_id: row.orgId,
      project_id: row.projectId,
      folder_id: row.folderId,
      name: row.name,
      type: row.type,
      created_at: toIso(row.createdAt) ?? "",
      updated_at: toIso(row.updatedAt) ?? "",
    }));
  });
}

export async function getProjectComments(
  ctx: SessionCtx,
  projectId: string,
): Promise<ProjectComment[]> {
  return withRLS(ctx, async (tx) => {
    const rows = await tx
      .select({
        id: comments.id,
        orgId: comments.orgId,
        projectId: comments.projectId,
        assetId: comments.assetId,
        authorId: comments.authorId,
        body: comments.body,
        parentId: comments.parentId,
        hidden: comments.hidden,
        metadata: comments.metadata,
        createdAt: comments.createdAt,
        userId: users.id,
        userName: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(
        and(eq(comments.orgId, ctx.orgId), eq(comments.projectId, projectId)),
      )
      .orderBy(asc(comments.createdAt));

    return rows.map((row) => ({
      id: row.id,
      org_id: row.orgId,
      project_id: row.projectId,
      asset_id: row.assetId,
      author_id: row.authorId,
      body: row.body,
      parent_id: row.parentId,
      hidden: row.hidden,
      metadata: row.metadata,
      created_at: toIso(row.createdAt) ?? "",
      author: row.userId
        ? {
            id: row.userId,
            name: row.userName ?? "",
            avatar_url: row.avatarUrl,
          }
        : undefined,
    }));
  });
}

export async function getProjectInvoices(
  ctx: SessionCtx,
  projectId: string,
): Promise<ProjectInvoice[]> {
  return withRLS(ctx, async (tx) => {
    const rows = await tx
      .select({
        id: invoices.id,
        orgId: invoices.orgId,
        clientId: invoices.clientId,
        projectId: invoices.projectId,
        number: invoices.number,
        status: invoices.status,
        dueDate: invoices.dueDate,
        currency: invoices.currency,
        amountCents: invoices.amountCents,
        pdfUrl: invoices.pdfUrl,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(
        and(eq(invoices.orgId, ctx.orgId), eq(invoices.projectId, projectId)),
      )
      .orderBy(desc(invoices.createdAt));

    return rows.map((row) => ({
      id: row.id,
      org_id: row.orgId,
      client_id: row.clientId,
      project_id: row.projectId,
      number: row.number,
      status: row.status,
      due_date: row.dueDate,
      currency: row.currency,
      amount_cents: row.amountCents,
      pdf_url: row.pdfUrl,
      created_at: toIso(row.createdAt) ?? "",
    }));
  });
}

export async function getProjectActivity(
  ctx: SessionCtx,
  projectId: string,
  limit = 50,
): Promise<ProjectActivity[]> {
  return withRLS(ctx, async (tx) => {
    const rows = await tx
      .select({
        id: activityLogs.id,
        eventType: activityLogs.eventType,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        actorId: users.id,
        actorName: users.name,
        actorEmail: users.email,
        actorAvatarUrl: users.avatarUrl,
        actorRole: orgMemberships.role,
        projectId: projects.id,
        projectName: projects.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.actorId, users.id))
      .leftJoin(
        orgMemberships,
        and(
          eq(orgMemberships.userId, activityLogs.actorId),
          eq(orgMemberships.orgId, activityLogs.orgId),
        ),
      )
      .leftJoin(projects, eq(activityLogs.projectId, projects.id))
      .where(
        and(
          eq(activityLogs.orgId, ctx.orgId),
          eq(activityLogs.projectId, projectId),
        ),
      )
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      metadata: row.metadata as ActivityEventMetadata,
      createdAt: toIso(row.createdAt) ?? "",
      actor: row.actorId
        ? {
            id: row.actorId,
            name: row.actorName ?? "Unknown",
            email: row.actorEmail ?? "",
            avatarUrl: row.actorAvatarUrl,
          }
        : null,
      actorRole: row.actorRole ?? null,
      project:
        row.projectId && row.projectName
          ? { id: row.projectId, name: row.projectName }
          : null,
    }));
  });
}

export function revalidateProjectCache(orgId: string, projectId: string): void {
  revalidateTag(cacheTag("project", orgId, projectId), "max");
}

export function revalidateMilestonesCache(
  orgId: string,
  projectId: string,
): void {
  revalidateTag(cacheTag("milestones", orgId, projectId), "max");
}

export function revalidateMembersCache(orgId: string, projectId: string): void {
  revalidateTag(cacheTag("members", orgId, projectId), "max");
}
