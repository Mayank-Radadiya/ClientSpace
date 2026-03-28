import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, type ProjectPriority } from "./ProjectCard.constants";

interface PriorityBadgeProps {
  priority: ProjectPriority;
  size?: "sm" | "md";
  className?: string;
}

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function PriorityBadge({
  priority,
  size = "md",
  className,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5",
        "border font-medium",
        size === "sm" ? "text-xs" : "text-xs",
        config.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
