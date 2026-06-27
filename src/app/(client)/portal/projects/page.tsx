import { redirect } from "next/navigation";
import { getServerCaller } from "@/lib/trpc/server";
import { ProjectsPageClient } from "./ProjectsPageClient";

export const metadata = { title: "Projects" };

export default async function PortalProjectsPage() {
  const caller = await getServerCaller();
  if (!caller) redirect("/login");

  const projects = await caller.portal.activeProjects();

  return <ProjectsPageClient projects={projects} />;
}
