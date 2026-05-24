import { createDrizzleClient } from "@/db/createDrizzleClient";
import { unstable_cache } from "next/cache";
import { and, eq, gt, desc } from "drizzle-orm";
import { projects, projectMembers } from "@/db/schema";

/**
 * Queries a list of projects for an organization.
 * 
 * Cache Tag: `org-{orgId}-projects`
 * Invalidation: Invalidated by `createProject`, `updateProject`, `deleteProject` Server Actions.
 */
export const getProjectList = (orgId: string, userId: string, cursor?: string) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });
        return await db.query.projects.findMany({
          where: and(
            eq(projects.orgId, orgId),
            cursor ? gt(projects.id, cursor) : undefined
          ),
          columns: {
            id: true,
            orgId: true,
            clientId: true,
            name: true,
            description: true,
            status: true,
            priority: true,
            startDate: true,
            deadline: true,
            budget: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            client: {
              columns: {
                id: true,
                companyName: true,
                email: true,
                contactName: true,
              },
            },
          },
          orderBy: [desc(projects.createdAt)],
          limit: 50,
        });
      } catch (error) {
        console.error("[getProjectList] Database read failed:", error);
        throw new Error("Failed to fetch projects list.");
      }
    },
    ["projects-list", orgId, cursor ?? ""],
    { tags: [`org-${orgId}-projects`], revalidate: false }
  )();

/**
 * Queries a single project by ID.
 * 
 * Cache Tag: `org-{orgId}-project-{projectId}`
 * Invalidation: Invalidated by `updateProject`, `deleteProject` Server Actions.
 */
export const getProjectDetail = (orgId: string, userId: string, projectId: string) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });
        const project = await db.query.projects.findFirst({
          where: and(
            eq(projects.id, projectId),
            eq(projects.orgId, orgId)
          ),
          columns: {
            id: true,
            orgId: true,
            clientId: true,
            name: true,
            description: true,
            status: true,
            priority: true,
            startDate: true,
            deadline: true,
            budget: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            client: {
              columns: {
                id: true,
                companyName: true,
                email: true,
                contactName: true,
              },
            },
          },
        });
        return project ?? null;
      } catch (error) {
        console.error("[getProjectDetail] Database read failed:", error);
        throw new Error("Failed to fetch project details.");
      }
    },
    ["project-detail", orgId, projectId],
    { tags: [`org-${orgId}-project-${projectId}`], revalidate: false }
  )();

/**
 * Queries the list of project members assigned to a project.
 * 
 * Cache Tag: `org-{orgId}-project-{projectId}-members`
 * Invalidation: Invalidated by member updates on `revalidateMembersCache`.
 */
export const getProjectMembers = (orgId: string, userId: string, projectId: string) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });
        return await db.query.projectMembers.findMany({
          where: eq(projectMembers.projectId, projectId),
          columns: {
            projectId: true,
            userId: true,
            assignedAt: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        });
      } catch (error) {
        console.error("[getProjectMembers] Database read failed:", error);
        throw new Error("Failed to fetch project members.");
      }
    },
    ["project-members", orgId, projectId],
    { tags: [`org-${orgId}-project-${projectId}-members`], revalidate: false }
  )();
