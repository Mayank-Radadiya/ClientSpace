import { z } from "zod";
import { createTRPCRouter, protectedProcedure, rateLimitedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { getProjectList, getProjectDetail } from "./queries";
import { createProject, updateProject, deleteProject } from "./mutations";
import { projectSchema, updateProjectSchema } from "../schemas";

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.coerce.number().int().positive().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const items = await getProjectList(ctx.orgId, ctx.userId, input.cursor);
        
        const hasMore = items.length > input.limit;
        const resultItems = hasMore ? items.slice(0, input.limit) : items;
        const nextCursor = hasMore && resultItems.length > 0
          ? resultItems[resultItems.length - 1]!.id
          : undefined;

        return {
          items: resultItems,
          nextCursor,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list projects.",
        });
      }
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid("Invalid project ID") }))
    .query(async ({ ctx, input }) => {
      try {
        const project = await getProjectDetail(ctx.orgId, ctx.userId, input.id);
        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found.",
          });
        }
        return project;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project detail.",
        });
      }
    }),

  create: rateLimitedProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Clients cannot create projects.",
        });
      }
      try {
        return await createProject(ctx.orgId, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project.",
        });
      }
    }),

  update: rateLimitedProcedure
    .input(
      z.object({
        id: z.string().uuid("Invalid project ID"),
        data: updateProjectSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Clients cannot update projects.",
        });
      }
      try {
        return await updateProject(ctx.orgId, input.id, input.data);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project.",
        });
      }
    }),

  delete: rateLimitedProcedure
    .input(z.object({ id: z.string().uuid("Invalid project ID") }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client" || ctx.role === "member") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can delete projects.",
        });
      }
      try {
        return await deleteProject(ctx.orgId, input.id);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete project.",
        });
      }
    }),
});
