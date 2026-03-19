import { z } from "zod";
import { and, desc, eq, lt, ilike, inArray, or } from "drizzle-orm";
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

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(getAllInput)
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const { search, status, priority, limit, cursor } = input;

        const conditions = [];

        if (search) {
          conditions.push(
            or(
              ilike(projects.name, `%${search}%`),
              ilike(projects.description, `%${search}%`),
            ),
          );
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

        const results = await tx.query.projects.findMany({
          where: and(...conditions),
          orderBy: [desc(projects.createdAt)],
          limit: limit + 1,
          with: {
            client: true,
          },
        });

        const hasMore = results.length > limit;
        const items = hasMore ? results.slice(0, limit) : results;

        return {
          projects: items.map((p) => ({
            ...p,
            isOverdue: computeOverdue(p),
            clientCompanyName: p.client?.companyName ?? null,
            clientEmail: p.client?.email ?? null,
          })),
          nextCursor:
            hasMore && items.length > 0
              ? items[items.length - 1]!.createdAt.toISOString()
              : undefined,
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
        const existing = await tx.query.projects.findFirst({
          where: and(eq(projects.id, input.id), eq(projects.orgId, ctx.orgId)),
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found.",
          });
        }

        await tx
          .delete(projects)
          .where(and(eq(projects.id, input.id), eq(projects.orgId, ctx.orgId)));

        return { success: true };
      });
    }),
});
