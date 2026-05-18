import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, type ProjectPriority } from "./ProjectCard.constants";

interface PriorityBadgeProps {
  priority: ProjectPriority;
  className?: string;
}

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "LOW",
  medium: "MED",
  high: "HIGH",
  urgent: "CRIT",
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "font-(--font-data) text-[11px] tracking-widest text-gray-400 uppercase",
        className,
      )}
    >
      <span
        className={cn(
          "h-[6px] w-[6px] shrink-0 rounded-full",
          config.dot,
          priority === "urgent" && "animate-pulse",
        )}
      />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
