import { z } from "zod";
import { and, desc, eq, lt } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { projects, clients } from "@/db/schema";
import { PROJECT_STATUSES } from "../schemas";

const projectColumns = {
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
};

function computeOverdue(row: {
  deadline: string | null;
  status: string;
}): boolean {
  if (!row.deadline) return false;
  if (row.status === "completed" || row.status === "archived") return false;
  return new Date(row.deadline) < new Date();
}

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(PROJECT_STATUSES).optional(),
          limit: z.number().int().min(1).max(100).default(50),
          cursor: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const limit = input?.limit ?? 50;
        const conditions = [eq(projects.orgId, ctx.orgId)];

        if (input?.status)
          conditions.push(eq(projects.status, input.status as any));

        if (input?.cursor) {
          const cursorRow = await tx
            .select({ createdAt: projects.createdAt })
            .from(projects)
            .where(eq(projects.id, input.cursor))
            .limit(1);
          if (cursorRow[0])
            conditions.push(lt(projects.createdAt, cursorRow[0].createdAt));
        }

        const results = await tx
          .select(projectColumns)
          .from(projects)
          .leftJoin(clients, eq(projects.clientId, clients.id))
          .where(and(...conditions))
          .orderBy(desc(projects.createdAt))
          .limit(limit + 1);

        const hasMore = results.length > limit;
        const items = hasMore ? results.slice(0, limit) : results;

        return {
          projects: items.map((p) => ({
            ...p,
            isOverdue: computeOverdue(p as any),
          })),
          nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
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
});
