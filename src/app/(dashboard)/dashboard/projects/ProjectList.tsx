"use client";

import { trpc } from "@/lib/trpc/client";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";
import { EmptyProjects } from "@/features/projects/components/EmptyProjects";

type Client = { id: string; companyName: string | null; email: string };
type ProjectData = {
  id: string;
  name: string;
  status: string;
  priority: string;
  deadline: string | null;
  isOverdue: boolean;
  clientCompanyName: string | null;
  clientEmail: string | null;
  tags: string[] | null;
  [key: string]: unknown;
};

type ProjectListProps = {
  clients: Client[];
  initialData: { projects: ProjectData[]; nextCursor?: string };
};

export function ProjectList({ clients, initialData }: ProjectListProps) {
  // initialData prevents any client-side loading state on first render
  const { data } = trpc.project.getAll.useQuery(undefined, { initialData });
  const projectList = data?.projects ?? initialData.projects;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Manage your active projects and track progress.
          </p>
        </div>
        <CreateProjectDialog clients={clients} />
      </div>

      {projectList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <ProjectCard key={project.id} project={project as any} />
          ))}
        </div>
      ) : (
        <EmptyProjects />
      )}
    </>
  );
}
