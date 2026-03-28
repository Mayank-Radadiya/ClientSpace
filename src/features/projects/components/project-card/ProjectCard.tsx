import { memo } from "react";
import { type ProjectCardData } from "./ProjectCard.constants";
import { getProjectCardViewModel } from "./ProjectCard.logic";
import { ProjectCardUI } from "./ProjectCard.ui";

type ProjectCardProps = {
  project: ProjectCardData;
  viewMode?: "grid" | "list";
};

function ProjectCardComponent({
  project,
  viewMode = "grid",
}: ProjectCardProps) {
  const projectCardViewModel = getProjectCardViewModel(project);

  return <ProjectCardUI vm={projectCardViewModel} viewMode={viewMode} />;
}

// Memoize with custom comparison function for optimal performance
// Only re-render when these critical fields change
export const ProjectCard = memo(
  ProjectCardComponent,
  (prevProps, nextProps) => {
    const prev = prevProps.project;
    const next = nextProps.project;

    // Return true if props are equal (skip re-render)
    // Return false if props changed (trigger re-render)
    return (
      prev.id === next.id &&
      prev.name === next.name &&
      prev.status === next.status &&
      prev.priority === next.priority &&
      prev.isOverdue === next.isOverdue &&
      prev.deadline === next.deadline &&
      prevProps.viewMode === nextProps.viewMode
    );
  },
);
