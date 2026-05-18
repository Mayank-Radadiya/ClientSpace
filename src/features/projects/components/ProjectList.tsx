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
import { OBSIDIAN } from "./project-card/ProjectCard.constants";

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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.12,
              ease: OBSIDIAN.cubic,
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
              ? "grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
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
                ? "grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
                : "grid-cols-1",
            )}
          >
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.3 + idx * 0.04,
                  ease: OBSIDIAN.cubic,
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
                  "font-(--font-data) text-[12px] tracking-[0.04em] uppercase",
                  "border-[#E2E2EA] bg-white text-[#6B6B7E] shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
                  "transition-all duration-180",
                  "hover:border-[rgba(79,127,255,0.3)] hover:text-[#4F7FFF]",
                  "dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111118]",
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
