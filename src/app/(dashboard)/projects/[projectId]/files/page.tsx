import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getServerCaller } from "@/lib/trpc/server";

// Components
import { FilesSidebarSkeleton } from "@/features/files/components/FilesSidebarSkeleton";
import { FilesContentSkeleton } from "@/features/files/components/FilesContentSkeleton";
import { FilesPageClient } from "@/features/files/components/FilesPageClient";

// UI (shadcn/ui)
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type FilesPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function FilesPage({ params }: FilesPageProps) {
  const { projectId } = await params;

  // 1. Strict null check for caller if your setup allows it to be null
  const caller = await getServerCaller();
  if (!caller) notFound();

  const [project, initialFiles] = await Promise.all([
    caller.project.getById({ id: projectId }).catch(() => null),
    caller.file.getAssets({ projectId }).catch(() => []), // Fallback to empty array on error
  ]);
  // const project = await caller.project
  //   .getById({ id: projectId })
  //   .catch(() => null);
  if (!project) notFound();

  return (
    <NuqsAdapter>
      <div className="bg-background flex h-full w-full flex-col overflow-hidden">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <header className="border-border bg-background flex shrink-0 flex-col gap-4 border-b px-6 py-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/projects"
                  className="hover:text-foreground transition-colors"
                >
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/projects/${projectId}`}
                  className="hover:text-foreground max-w-[200px] truncate transition-colors hover:cursor-pointer"
                >
                  {project.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary">Files</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-brand text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                Files
              </h1>
              {project.clientCompanyName && (
                <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Building2 className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="font-sans">{project.clientCompanyName}</span>
                </div>
              )}
            </div>
            {/* Future-proofing: Empty slot for page-level actions (e.g., "Upload") */}
          </div>
        </header>

        {/* ── Split Layout: Sidebar + Content ─────────────────────────── */}
        <main className="bg-muted/10 flex min-h-0 flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex h-full w-full">
                <FilesSidebarSkeleton />
                <FilesContentSkeleton />
              </div>
            }
          >
            <FilesPageClient
              projectId={projectId}
              initialFiles={initialFiles}
            />
          </Suspense>
        </main>
      </div>
    </NuqsAdapter>
  );
}
