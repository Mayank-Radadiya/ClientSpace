import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients } from "@/db/schema";
import { ProjectList } from "../../../features/projects/components/ProjectList";
import { createTRPCContext } from "@/lib/trpc/init";
import { getProjectList } from "@/features/projects/server/queries";
import { PageLayout } from "../_components/PageLayout";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  const [orgClients, rawProjects] = await Promise.all([
    withRLS(ctx, async (tx) =>
      tx
        .select({
          id: clients.id,
          companyName: clients.companyName,
          email: clients.email,
        })
        .from(clients)
        .where(eq(clients.orgId, ctx.orgId)),
    ),
    getProjectList(ctx.orgId, ctx.userId),
  ]);

  const hasMore = rawProjects.length > 50;
  const resultItems = hasMore ? rawProjects.slice(0, 50) : rawProjects;
  const nextCursor = hasMore && resultItems.length > 0
    ? resultItems[resultItems.length - 1]!.id
    : undefined;

  const initialProjects = {
    pages: [{ projects: resultItems, nextCursor }],
    pageParams: [undefined],
  };

  return (
    <PageLayout bleed>
      <ProjectList
        clients={orgClients}
        userRole={ctx.role as "admin" | "owner" | "member" | "client"}
        initialProjects={initialProjects}
      />
    </PageLayout>
  );
}
