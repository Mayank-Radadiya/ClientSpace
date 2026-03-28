import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type ProjectStatus } from "./ProjectCard.constants";

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  review: "In Review",
  completed: "Completed",
  on_hold: "On Hold",
  archived: "Archived",
};

export function StatusBadge({
  status,
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5",
        "font-medium transition-colors",
        size === "sm" ? "text-xs" : "text-xs",
        config.bg,
        config.text,
        config.border,
        "border",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}
