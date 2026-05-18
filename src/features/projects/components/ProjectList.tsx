"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
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
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ProjectCardSkeleton } from "./project-card/ProjectCardSkeleton";

// ─── Types ────────────────────────────────────────────────────────────

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
  clientEmail: string | null;
  isOverdue: boolean;
};

type ProjectListProps = {
  clients: Client[];
  userRole?: string;
};

// ─── Main Component ───────────────────────────────────────────────────

export function ProjectList({ clients, userRole }: ProjectListProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    priority: [],
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.project.getAll.useInfiniteQuery(
      {
        search: filters.search.trim().length >= 2 ? filters.search.trim() : "",
        status: filters.status,
        priority: filters.priority,
        limit: 50,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        placeholderData: (previousData) => previousData,
      },
    );

  const projects = (data?.pages.flatMap((page) => page.projects) ??
    []) as unknown as ProjectData[];

  const stats = useMemo(
    () => ({
      total: projects.length,
      inProgress: projects.filter((p) => p.status === "in_progress").length,
      completed: projects.filter((p) => p.status === "completed").length,
      overdue: projects.filter((p) => p.isOverdue).length,
    }),
    [projects],
  );

  const activeCount = useMemo(
    () =>
      projects.filter(
        (p) => p.status === "in_progress" || p.status === "review",
      ).length,
    [projects],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    }
    return counts;
  }, [projects]);

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
        activeCount={activeCount}
        overdueCount={stats.overdue}
        statusCounts={statusCounts}
        onCreateClick={() => setCreateOpen(true)}
      />

      {/* Create dialog */}
      <CreateProjectDialog
        clients={clients}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Stats */}
      {isLoading ? (
        <ProjectsStatsSkeleton />
      ) : (
        projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.15,
            }}
          >
            <ProjectsStats stats={stats} />
          </motion.div>
        )
      )}

      {/* Loading state */}
      {isLoading ? (
        <div
          className={cn(
            "grid w-full gap-4",
            viewMode === "grid"
              ? "grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
              : "grid-cols-1",
          )}
        >
          {Array.from({ length: 4 }).map((_: unknown, i: number) => (
            <ProjectCardSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <>
          <div
            className={cn(
              "grid w-full gap-4",
              viewMode === "grid"
                ? "grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
                : "grid-cols-1",
            )}
          >
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  delay: 0.25 + idx * 0.05,
                }}
              >
                <ProjectCard project={project} viewMode={viewMode} />
              </motion.div>
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className={cn(
                  "flex h-[40px] items-center gap-2 rounded-[10px] border px-5",
                  "font-(--font-data) text-[11px] tracking-widest uppercase",
                  "transition-all duration-200",
                  "border-[#EBEBF0] bg-white text-[#6B6B7E] shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
                  "hover:border-[rgba(0,144,255,0.3)] hover:text-[#0090FF]",
                  "dark:border-white/5 dark:bg-transparent dark:text-gray-400 dark:shadow-none",
                  "dark:hover:border-[#0090FF]/30 dark:hover:text-[#00C8FF]",
                  "disabled:opacity-50",
                )}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <EmptyProjects
          isFiltered={!!isFiltering}
          onCreateClick={!isFiltering ? () => setCreateOpen(true) : undefined}
          onClearFilters={
            isFiltering
              ? () => {
                  setFilters({ search: "", status: [], priority: [] });
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
