// src/features/projects/server/milestonesRouter.ts
// tRPC router for all milestone CRUD operations used by the v4 project detail page.

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { withRLS } from "@/db/createDrizzleClient";
import { milestones } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  listMilestonesSchema,
  createMilestoneSchema,
  updateMilestoneStatusSchema,
  updateMilestoneSchema,
  updateSubTasksSchema,
  reorderMilestonesSchema,
  milestoneIdSchema,
} from "../schemas";

// ── Router ────────────────────────────────────────────────────────────────────

export const milestonesRouter = createTRPCRouter({
  /** List all milestones for a project, ordered by `order` asc. */
  list: protectedProcedure
    .input(listMilestonesSchema)
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) =>
        tx
          .select()
          .from(milestones)
          .where(
            and(
              eq(milestones.orgId, ctx.orgId),
              eq(milestones.projectId, input.projectId),
            ),
          )
          .orderBy(asc(milestones.order)),
      );
    }),

  /** Create a new milestone. */
  create: protectedProcedure
    .input(createMilestoneSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Clients cannot create milestones." });
      }
      return withRLS(ctx, async (tx) => {
        const [created] = await tx
          .insert(milestones)
          .values({
            orgId: ctx.orgId,
            projectId: input.projectId,
            title: input.title,
            status: input.status,
            priority: input.priority,
            dueDate: input.dueDate ?? null,
            startDate: input.startDate ?? null,
            completed: false,
            subTasks: [],
            order: input.order,
          })
          .returning();
        return created;
      });
    }),

  /** Update a milestone's status (and derived completed/completedAt). */
  updateStatus: protectedProcedure
    .input(updateMilestoneStatusSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const isDone = input.status === "done";
      return withRLS(ctx, async (tx) => {
        const [updated] = await tx
          .update(milestones)
          .set({
            status: input.status,
            completed: isDone,
            completedAt: isDone ? new Date() : null,
          })
          .where(and(eq(milestones.id, input.id), eq(milestones.orgId, ctx.orgId)))
          .returning();
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        return updated;
      });
    }),

  /** Update milestone fields (title, description, priority, dates, assignee). */
  update: protectedProcedure
    .input(updateMilestoneSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...fields } = input;
      return withRLS(ctx, async (tx) => {
        const [updated] = await tx
          .update(milestones)
          .set(fields)
          .where(and(eq(milestones.id, id), eq(milestones.orgId, ctx.orgId)))
          .returning();
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        return updated;
      });
    }),

  /** Replace the sub-tasks array on a milestone. */
  updateSubTasks: protectedProcedure
    .input(updateSubTasksSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return withRLS(ctx, async (tx) => {
        const [updated] = await tx
          .update(milestones)
          .set({ subTasks: input.subTasks })
          .where(and(eq(milestones.id, input.id), eq(milestones.orgId, ctx.orgId)))
          .returning();
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        return updated;
      });
    }),

  /** Bulk reorder milestones (updates order + status for each). */
  reorder: protectedProcedure
    .input(reorderMilestonesSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return withRLS(ctx, async (tx) => {
        await Promise.all(
          input.items.map((item) =>
            tx
              .update(milestones)
              .set({ order: item.order, status: item.status })
              .where(
                and(
                  eq(milestones.id, item.id),
                  eq(milestones.orgId, ctx.orgId),
                  eq(milestones.projectId, input.projectId),
                ),
              ),
          ),
        );
      });
    }),

  /** Delete a milestone. */
  delete: protectedProcedure
    .input(milestoneIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return withRLS(ctx, async (tx) => {
        await tx
          .delete(milestones)
          .where(and(eq(milestones.id, input.id), eq(milestones.orgId, ctx.orgId)));
      });
    }),
});
