"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { ProjectCard } from "@/features/projects/components/project-card/ProjectCard";
import {
  ProjectsHeader,
  type FilterState,
} from "@/features/projects/components/ProjectsHeader";
import {
  ProjectsStats,
  ProjectsStatsSkeleton,
} from "@/features/projects/components/ProjectsStats";
import { CreateProjectDialog } from "@/features/projects/components/createProject/CreateProjectDialog";
import { EmptyProjects } from "@/features/projects/components/EmptyProjects";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ProjectCardSkeleton } from "./project-card/ProjectCardSkeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = { id: string; companyName: string | null; email: string };

type ProjectData = {
  id: string;
  orgId: string;
  name: string;
  description: string;
  status:
    | "not_started"
    | "in_progress"
    | "review"
    | "completed"
    | "on_hold"
    | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  deadline: string;
  startDate: string | null;
  budget: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  clientId: string;
  clientCompanyName: string | null;
  clientEmail: string;
  isOverdue: boolean;
  client: any;
};

type ProjectListProps = {
  clients: Client[];
  userRole?: string;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectList({ clients, userRole }: ProjectListProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    priority: [],
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);

  const canDelete = userRole === "owner" || userRole === "admin";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.project.getAll.useInfiniteQuery(
      {
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        limit: 50,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const projects = (data?.pages.flatMap((page) => page.projects) ??
    []) as ProjectData[];

  const stats = useMemo(
    () => ({
      total: projects.length,
      inProgress: projects.filter((p) => p.status === "in_progress").length,
      completed: projects.filter((p) => p.status === "completed").length,
      overdue: projects.filter((p) => p.isOverdue).length,
    }),
    [projects],
  );

  const isFiltering =
    filters.search || filters.status.length > 0 || filters.priority.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProjectsHeader
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={projects.length}
        filteredCount={projects.length}
      >
        <CreateProjectDialog
          clients={clients}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
        {/* Standalone trigger button — styled properly */}
        <Button
          onClick={() => setCreateOpen(true)}
          className="group from-primary shadow-primary/25 hover:shadow-primary/40 relative overflow-hidden rounded-xl bg-linear-to-br to-indigo-600 px-6 font-bold tracking-wide shadow-lg transition-[transform,shadow] duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative mr-1.5 text-lg leading-none">+</span>
          <span className="relative">New Project</span>
        </Button>
      </ProjectsHeader>

      {/* Stats — show skeleton while loading, then show stats if projects exist */}
      {isLoading ? (
        <ProjectsStatsSkeleton />
      ) : (
        projects.length > 0 && <ProjectsStats stats={stats} />
      )}

      {/* Loading state */}
      {isLoading ? (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-2",
          )}
        >
          {Array.from({ length: 3 }).map((_: any, i: number) => (
            <ProjectCardSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-2"
            }
          >
            {projects.map((project) => (
              <div key={project.id} className="group/card relative">
                <ProjectCard project={project} viewMode={viewMode} />

                {/* Delete button — admin/owner only, appears on hover */}
                {canDelete && (
                  <div
                    className={
                      viewMode === "grid"
                        ? "absolute top-6 right-3 z-10 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100"
                        : "absolute top-1/2 right-3 z-10 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100"
                    }
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-w-32"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <EmptyProjects
          onCreateClick={!isFiltering ? () => setCreateOpen(true) : undefined}
        />
      )}
    </div>
  );
}
