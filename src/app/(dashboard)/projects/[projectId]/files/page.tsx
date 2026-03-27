import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getServerCaller } from "@/lib/trpc/server";
import { ProjectFilesClient } from "@/features/files/components/ProjectFilesClient";

type FilesPageProps = { params: Promise<{ projectId: string }> };

export default async function FilesPage({ params }: FilesPageProps) {
  const { projectId } = await params;

  // Fetch project name for the breadcrumb — zero HTTP overhead (direct DB)
  const caller = await getServerCaller();
  const project = caller
    ? await caller.project.getById({ id: projectId }).catch(() => null)
    : null;

  if (!project) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="border-b px-6 py-4">
        <nav className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs">
          <Link
            href="/projects"
            className="hover:text-foreground transition-colors"
          >
            Projects
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link
            href={`/projects/${projectId}`}
            className="hover:text-foreground max-w-[180px] truncate transition-colors"
          >
            {project.name}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground font-medium">Files</span>
        </nav>
        <h1 className="font-brand text-2xl font-semibold tracking-tight">
          Files
        </h1>
        {project.clientCompanyName && (
          <p className="text-muted-foreground mt-0.5 font-sans text-sm">
            {project.clientCompanyName}
          </p>
        )}
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <ProjectFilesClient projectId={projectId} />
      </div>
    </div>
  );
}
