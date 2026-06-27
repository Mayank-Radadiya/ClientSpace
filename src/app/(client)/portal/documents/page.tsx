import { redirect } from "next/navigation";
import { DocumentsPageClient } from "./DocumentsPageClient";
import { getServerCaller } from "@/lib/trpc/server";

export const metadata = { title: "Documents" };

export default async function PortalDocumentsPage() {
  const caller = await getServerCaller();
  if (!caller) redirect("/login");

  const projects = await caller.portal.activeProjects();

  return <DocumentsPageClient projects={projects} />;
}
