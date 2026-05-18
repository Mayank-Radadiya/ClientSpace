import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type ProjectStatus } from "./ProjectCard.constants";

interface StatusBadgeProps {
  status: ProjectStatus;
  isOverdue?: boolean;
  className?: string;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: "NOT STARTED",
  in_progress: "IN PROGRESS",
  review: "IN REVIEW",
  completed: "COMPLETED",
  on_hold: "ON HOLD",
  archived: "ARCHIVED",
};

export function StatusBadge({
  status,
  isOverdue,
  className,
}: StatusBadgeProps) {
  // If overdue, override to show red "OVERDUE" badge
  const displayStatus = isOverdue ? "OVERDUE" : STATUS_LABELS[status];
  const config = isOverdue
    ? {
        text: "text-[#EF4444]",
        border: "border-[rgba(239,68,68,0.20)]",
        dot: "bg-[#EF4444]",
        lightBg: "bg-[rgba(239,68,68,0.06)]",
      }
    : STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "font-(--font-data) text-[10px] tracking-widest uppercase",
        "transition-colors duration-200",
        // Light: very faint tinted bg
        "lightBg" in config && config.lightBg,
        "dark:bg-transparent",
        config.text,
        config.border,
        className,
      )}
    >
      <span className={cn("h-[5px] w-[5px] shrink-0 rounded-full", config.dot)} />
      {displayStatus}
    </span>
  );
}
