"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { ProjectsHeader } from "@/features/projects/components/ProjectsHeader";
import { ProjectsStats } from "@/features/projects/components/ProjectsStats";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";
import { EmptyProjects } from "@/features/projects/components/EmptyProjects";

type Client = { id: string; companyName: string | null; email: string };

type ProjectData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  startDate: string | null;
  budget: number | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  clientCompanyName: string | null;
  clientEmail: string | null;
  isOverdue: boolean;
};

type FilterState = {
  search: string;
  status: string[];
  priority: string[];
};

type ProjectListProps = {
  clients: Client[];
  initialData: { projects: ProjectData[]; nextCursor?: string };
};

export function ProjectList({ clients, initialData }: ProjectListProps) {
  const { data } = trpc.project.getAll.useQuery(undefined, {
    initialData: initialData as any,
  });
  const projectList = (data?.projects ?? initialData.projects) as ProjectData[];

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    priority: [],
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProjects = useMemo(() => {
    let filtered = [...projectList];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.clientCompanyName?.toLowerCase().includes(searchLower) ||
          p.clientEmail?.toLowerCase().includes(searchLower) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchLower)),
      );
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter((p) => filters.status.includes(p.status));
    }

    if (filters.priority.length > 0) {
      filtered = filtered.filter((p) => filters.priority.includes(p.priority));
    }

    return filtered;
  }, [projectList, filters]);

  const stats = useMemo(() => {
    return {
      total: projectList.length,
      inProgress: projectList.filter((p) => p.status === "in_progress").length,
      completed: projectList.filter((p) => p.status === "completed").length,
      overdue: projectList.filter((p) => p.isOverdue).length,
    };
  }, [projectList]);

  return (
    <div className="space-y-6">
      <ProjectsHeader
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={projectList.length}
        filteredCount={filteredProjects.length}
      >
        <CreateProjectDialog clients={clients} />
      </ProjectsHeader>

      {projectList.length > 0 && <ProjectsStats stats={stats} />}

      {filteredProjects.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} viewMode="list" />
            ))}
          </div>
        )
      ) : (
        <EmptyProjects />
      )}
    </div>
  );
}
