import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships, clients, projects } from "@/db/schema";
import { ProjectList } from "./ProjectList";

export const metadata = { title: "Projects — ClientSpace" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, user.id),
      });
    },
  );
  if (!membership) redirect("/onboarding");

  const orgClients = await withRLS(
    { userId: user.id, orgId: membership.orgId },
    async (tx) => {
      return tx
        .select({
          id: clients.id,
          companyName: clients.companyName,
          email: clients.email,
        })
        .from(clients)
        .where(eq(clients.orgId, membership.orgId));
    },
  );

  const rawProjects = await withRLS(
    { userId: user.id, orgId: membership.orgId },
    async (tx) => {
      return tx
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
        .where(eq(projects.orgId, membership.orgId))
        .orderBy(desc(projects.createdAt))
        .limit(50);
    },
  );

  const projectsWithOverdue = rawProjects.map((p) => ({
    ...p,
    isOverdue:
      !!p.deadline &&
      p.status !== "completed" &&
      p.status !== "archived" &&
      new Date(p.deadline) < new Date(),
  }));

  return (
    <div className="space-y-6">
      <ProjectList
        clients={orgClients}
        initialData={{
          projects: projectsWithOverdue as any,
          nextCursor:
            rawProjects.length === 50
              ? rawProjects[rawProjects.length - 1]?.id
              : undefined,
        }}
      />
    </div>
  );
}
