import { notFound, redirect } from "next/navigation";
import { ProjectDetailPage } from "@/features/projects/project-detail/ProjectDetailPage";
import { createTRPCContext } from "@/lib/trpc/init";
import {
  getCachedMembers,
  getCachedMilestones,
  getCachedProject,
  getProjectActivity,
  getProjectAssets,
  getProjectComments,
  getProjectFolders,
  getProjectInvoices,
} from "@/features/projects/server/cache";
interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

type NextControlError = Error & { digest?: string };

function isNextControlError(error: unknown): error is NextControlError {
  return (
    error instanceof Error &&
    typeof (error as NextControlError).digest === "string" &&
    (error as NextControlError).digest!.startsWith("NEXT_")
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  const ctx = await createTRPCContext();
  if (!ctx) redirect("/login");

  const orgId = ctx.orgId;
  const role = ctx.role as "owner" | "admin" | "member" | "client";

  try {
    const [
      project,
      milestones,
      members,
      folders,
      assets,
      comments,
      invoices,
      activity,
    ] = await Promise.all([
      getCachedProject(ctx, projectId),
      getCachedMilestones(ctx, projectId),
      getCachedMembers(ctx, projectId),
      getProjectFolders(ctx, projectId),
      getProjectAssets(ctx, projectId),
      getProjectComments(ctx, projectId),
      role !== "client"
        ? getProjectInvoices(ctx, projectId)
        : Promise.resolve([]),
      getProjectActivity(ctx, projectId, 50),
    ]);

    if (!project) return notFound();

    return (
      <ProjectDetailPage
        orgId={orgId}
        projectId={projectId}
        role={role}
        initialProject={project}
        initialMilestones={milestones}
        initialMembers={members}
        initialFolders={folders}
        initialAssets={assets}
        initialComments={comments}
        initialInvoices={invoices}
        initialActivity={activity}
      />
    );
  } catch (error: unknown) {
    if (isNextControlError(error)) throw error;

    console.error("[ProjectDetailPage] fetch failed", {
      projectId,
      orgId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
