import { type ProjectCardData } from "./ProjectCard.constants";
import { getProjectCardViewModel } from "./ProjectCard.logic";
import { ProjectCardUI } from "./ProjectCard.ui";

type ProjectCardProps = {
  project: ProjectCardData;
  viewMode?: "grid" | "list";
};

export function ProjectCard({ project, viewMode = "grid" }: ProjectCardProps) {
  const projectCardViewModel = getProjectCardViewModel(project);

  return <ProjectCardUI vm={projectCardViewModel} viewMode={viewMode} />;
}
