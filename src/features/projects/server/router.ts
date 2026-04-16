import { z } from "zod";
import { and, desc, eq, lt, ilike, inArray, or, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { TRPCError } from "@trpc/server";
import {
  clients,
  projects,
  projectStatusEnum,
  projectPriorityEnum,
} from "@/db/schema";
import { projectColumns } from "../types";
import { projectSchema } from "../schemas";
import {
  revalidateMembersCache,
  revalidateMilestonesCache,
  revalidateProjectCache,
} from "./cache";

function computeOverdue(row: {
  deadline: string | null;
  status: string;
}): boolean {
  if (!row.deadline) return false;
  if (row.status === "completed" || row.status === "archived") return false;
  return new Date(row.deadline) < new Date();
}

// Cursor uses ISO timestamp string — avoids an extra DB lookup
const getAllInput = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(projectStatusEnum.enumValues)).optional(),
  priority: z.array(z.enum(projectPriorityEnum.enumValues)).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(), // ISO timestamp
});

function buildProjectWhere(input: z.infer<typeof getAllInput>, orgId: string) {
  const { search, status, priority, cursor } = input;
  const conditions = [eq(projects.orgId, orgId)];

  if (search) {
    const searchCondition = or(
      ilike(projects.name, `%${search}%`),
      ilike(projects.description, `%${search}%`),
      ilike(sql`coalesce(${clients.companyName}, '')`, `%${search}%`),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (status && status.length > 0) {
    conditions.push(inArray(projects.status, status));
  }

  if (priority && priority.length > 0) {
    conditions.push(inArray(projects.priority, priority));
  }

  if (cursor) {
    conditions.push(lt(projects.createdAt, new Date(cursor)));
  }

  return and(...conditions);
}

async function fetchProjectPage(
  tx: any,
  input: z.infer<typeof getAllInput>,
  orgId: string,
) {
  const { limit } = input;
  const results = await tx
    .select({
      id: projects.id,
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
      clientId: projects.clientId,
      clientCompanyName: clients.companyName,
      clientEmail: clients.email,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(buildProjectWhere(input, orgId))
    .orderBy(desc(projects.createdAt))
    .limit(limit + 1);

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;

  return {
    projects: items.map((p: any) => ({
      ...p,
      isOverdue: computeOverdue(p),
    })),
    nextCursor:
      hasMore && items.length > 0
        ? items[items.length - 1]!.createdAt.toISOString()
        : undefined,
  };
}

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      // Clients cannot create projects
      if (ctx.role === "client") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Clients cannot create projects.",
        });
      }

      return withRLS(ctx, async (tx) => {
        // Verify client belongs to user's organization
        const client = await tx.query.clients.findFirst({
          where: and(
            eq(clients.id, input.clientId),
            eq(clients.orgId, ctx.orgId),
          ),
        });

        if (!client) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected client does not belong to your organization.",
          });
        }

        // Helper to convert Date to date string (YYYY-MM-DD)
        const toDateString = (date: Date): string => {
          return date.toISOString().split("T")[0]!;
        };

        // Insert project
        const [newProject] = await tx
          .insert(projects)
          .values({
            orgId: ctx.orgId,
            clientId: input.clientId,
            name: input.name,
            description: input.description,
            status: input.status as any,
            priority: input.priority as any,
            startDate: input.startDate ? toDateString(input.startDate) : null,
            deadline: toDateString(input.deadline),
            budget: input.budget ?? null,
            tags: input.tags,
          })
          .returning();

        if (!newProject) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create project.",
          });
        }

        revalidateProjectCache(ctx.orgId, newProject.id);
        revalidateMilestonesCache(ctx.orgId, newProject.id);
        revalidateMembersCache(ctx.orgId, newProject.id);

        return newProject;
      });
    }),

  getAll: protectedProcedure
    .input(getAllInput)
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        return fetchProjectPage(tx, input, ctx.orgId);
      });
    }),

  getBootstrap: protectedProcedure
    .input(getAllInput)
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const [orgClients, firstPage] = await Promise.all([
          tx
            .select({
              id: clients.id,
              companyName: clients.companyName,
              email: clients.email,
            })
            .from(clients)
            .where(eq(clients.orgId, ctx.orgId)),
          fetchProjectPage(tx, input, ctx.orgId),
        ]);

        return {
          clients: orgClients,
          firstPage,
        };
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const [result] = await tx
          .select(projectColumns)
          .from(projects)
          .leftJoin(clients, eq(projects.clientId, clients.id))
          .where(and(eq(projects.id, input.id), eq(projects.orgId, ctx.orgId)))
          .limit(1);

        if (!result) return null;

        return { ...result, isOverdue: computeOverdue(result as any) };
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Only admins and owners can delete projects
      if (ctx.role === "client" || ctx.role === "member") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can delete projects.",
        });
      }

      return withRLS(ctx, async (tx) => {
        const deleted = await tx
          .delete(projects)
          .where(and(eq(projects.id, input.id), eq(projects.orgId, ctx.orgId)))
          .returning({ id: projects.id });

        if (deleted.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found.",
          });
        }

        revalidateProjectCache(ctx.orgId, input.id);
        revalidateMilestonesCache(ctx.orgId, input.id);
        revalidateMembersCache(ctx.orgId, input.id);

        return { success: true };
      });
    }),
});
