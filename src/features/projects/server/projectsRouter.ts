import { z } from "zod";
import { createTRPCRouter, protectedProcedure, rateLimitedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { getProjectList, getProjectDetail } from "./queries";
import { createProject, updateProject, deleteProject, addProjectMember } from "./mutations";
import { projectSchema, updateProjectSchema } from "../schemas";
import { withRLS } from "@/db/createDrizzleClient";
import { projectHealth, projects, clients } from "@/db/schema";
import { eq, and, desc, inArray, gte, sql } from "drizzle-orm";
import { inngest } from "@/inngest/client";

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

  /** Archive a project — sets status to "archived" and hides it from active listings. */
  archive: protectedProcedure
    .input(z.object({ projectId: z.string().uuid("Invalid project ID") }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client" || ctx.role === "member") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can archive projects.",
        });
      }
      try {
        const archived = await updateProject(ctx.orgId, input.projectId, {
          status: "archived",
        });
        return archived;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to archive project.",
        });
      }
    }),

  /** Add an existing org member to this project by email address. */
  inviteMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid("Invalid project ID"),
        email: z.string().email("Please enter a valid email address"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client" || ctx.role === "member") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can add members to projects.",
        });
      }
      try {
        return await addProjectMember(ctx.orgId, input.projectId, input.email);
      } catch (error) {
        // Surface descriptive messages from addProjectMember verbatim
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to add member to project.",
        });
      }
    }),

  // ─── AI Health Summaries ──────────────────────────────────────────────────

  /**
   * Latest health snapshot per active project with medium+ risk.
   * Uses a DISTINCT ON (project_id) subquery to get the latest per project.
   */
  getHealthSummaries: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      // Fetch latest health row per project, ordered by severity then recency
      const rows = await tx
        .select({
          id: projectHealth.id,
          projectId: projectHealth.projectId,
          orgId: projectHealth.orgId,
          riskScore: projectHealth.riskScore,
          summary: projectHealth.summary,
          velocityTrend: projectHealth.velocityTrend,
          overdueCount: projectHealth.overdueCount,
          unresolvedAnnotations: projectHealth.unresolvedAnnotations,
          openChangeRequests: projectHealth.openChangeRequests,
          milestoneCompletionRate: projectHealth.milestoneCompletionRate,
          generatedAt: projectHealth.generatedAt,
          projectName: projects.name,
          projectStatus: projects.status,
          clientName: clients.companyName,
          clientContactName: clients.contactName,
        })
        .from(projectHealth)
        .innerJoin(projects, eq(projectHealth.projectId, projects.id))
        .innerJoin(clients, eq(projects.clientId, clients.id))
        .where(
          and(
            eq(projectHealth.orgId, ctx.orgId),
            inArray(projectHealth.riskScore, ["medium", "high", "critical"]),
            inArray(projects.status, ["not_started", "in_progress", "review"]),
          ),
        )
        .orderBy(
          sql`CASE ${projectHealth.riskScore}
            WHEN 'critical' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            ELSE 3
          END`,
          desc(projectHealth.generatedAt),
        );

      // Deduplicate: keep only the latest per project
      const seen = new Set<string>();
      const deduplicated = rows.filter((row) => {
        if (seen.has(row.projectId)) return false;
        seen.add(row.projectId);
        return true;
      });

      return deduplicated.map((row) => ({
        id: row.id,
        projectId: row.projectId,
        riskScore: row.riskScore as "medium" | "high" | "critical",
        summary: row.summary,
        velocityTrend: row.velocityTrend as "improving" | "stable" | "declining",
        overdueCount: row.overdueCount,
        unresolvedAnnotations: row.unresolvedAnnotations,
        openChangeRequests: row.openChangeRequests,
        milestoneCompletionRate: row.milestoneCompletionRate,
        generatedAt: row.generatedAt,
        projectName: row.projectName,
        clientName: row.clientName ?? row.clientContactName ?? "Unknown",
      }));
    });
  }),

  /**
   * On-demand health analysis — dispatches Inngest event.
   * Rate limited: max once per 30 minutes per project.
   */
  triggerHealthAnalysis: rateLimitedProcedure
    .input(z.object({ projectId: z.string().uuid("Invalid project ID") }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Clients cannot trigger health analysis.",
        });
      }

      // Check rate limit: was there an analysis in the last 30 min?
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recent = await withRLS(ctx, async (tx) => {
        return tx
          .select({ id: projectHealth.id })
          .from(projectHealth)
          .where(
            and(
              eq(projectHealth.projectId, input.projectId),
              eq(projectHealth.orgId, ctx.orgId),
              gte(projectHealth.generatedAt, thirtyMinAgo),
            ),
          )
          .limit(1);
      });

      if (recent.length > 0) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "Health analysis was run recently. Please wait 30 minutes between analyses.",
        });
      }

      // Dispatch Inngest event
      await inngest.send({
        name: "project/health.requested",
        data: {
          projectId: input.projectId,
          orgId: ctx.orgId,
        },
      });

      return { dispatched: true };
    }),
});
