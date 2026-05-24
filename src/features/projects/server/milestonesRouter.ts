// src/features/projects/server/milestonesRouter.ts
// tRPC router for all milestone CRUD operations used by the v4 project detail page.

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { withRLS } from "@/db/createDrizzleClient";
import { milestones } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const subTaskSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(500),
  completed: z.boolean(),
});

const milestoneStatusSchema = z.enum(["todo", "in_progress", "done"]);
const milestonePrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

// ── Router ────────────────────────────────────────────────────────────────────

export const milestonesRouter = createTRPCRouter({
  /** List all milestones for a project, ordered by `order` asc. */
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
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
    .input(
      z.object({
        projectId: z.string().uuid(),
        title: z.string().min(1).max(300),
        status: milestoneStatusSchema.default("todo"),
        priority: milestonePrioritySchema.default("medium"),
        dueDate: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        order: z.number().int().nonnegative(),
      }),
    )
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
    .input(
      z.object({
        id: z.string().uuid(),
        status: milestoneStatusSchema,
      }),
    )
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
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(300).optional(),
        description: z.string().max(10000).nullable().optional(),
        priority: milestonePrioritySchema.optional(),
        dueDate: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        assigneeId: z.string().uuid().nullable().optional(),
      }),
    )
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
    .input(
      z.object({
        id: z.string().uuid(),
        subTasks: z.array(subTaskSchema).max(50),
      }),
    )
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
    .input(
      z.object({
        projectId: z.string().uuid(),
        items: z.array(
          z.object({
            id: z.string().uuid(),
            order: z.number().int().nonnegative(),
            status: milestoneStatusSchema,
          }),
        ),
      }),
    )
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
    .input(z.object({ id: z.string().uuid() }))
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
