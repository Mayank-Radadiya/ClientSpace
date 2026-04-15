"use client";

import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import { GripVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Milestone } from "../../types";

interface MilestoneKanbanCardProps {
  milestone: Milestone;
  isDragging?: boolean;
  onClick: () => void;
  dragListeners?: Record<string, unknown>;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-zinc-400",
};

export function MilestoneKanbanCard({
  milestone,
  isDragging,
  onClick,
  dragListeners,
}: MilestoneKanbanCardProps) {
  const daysUntilDue = useMemo(() => {
    if (!milestone.due_date) return null;
    return differenceInDays(new Date(milestone.due_date), new Date());
  }, [milestone.due_date]);

  const isOverdue =
    daysUntilDue !== null && daysUntilDue < 0 && !milestone.completed;
  const isDueSoon =
    daysUntilDue !== null &&
    daysUntilDue >= 0 &&
    daysUntilDue <= 3 &&
    !milestone.completed;

  const leftBorder = isOverdue
    ? "border-l-[3px] border-l-red-500"
    : isDueSoon
      ? "border-l-[3px] border-l-amber-500"
      : "";

  const draggingStyles = isDragging
    ? "scale-[1.02] rotate-[1.5deg] shadow-2xl shadow-black/50 ring-2 ring-primary/30"
    : "";

  return (
    <div
      onClick={onClick}
      className={`group border-border hover:border-border cursor-pointer rounded-[10px] border p-3 transition-all duration-150 hover:-translate-y-0.5 ${leftBorder} ${draggingStyles}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Top row: title + priority */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-foreground text-[14px] leading-tight font-medium">
          {milestone.title}
        </span>
        {milestone.priority && (
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[milestone.priority] || "bg-zinc-400"}`}
          />
        )}
      </div>

      {/* Description */}
      {milestone.description && (
        <p className="text-muted-foreground mt-1.5 line-clamp-2 text-[12px] leading-relaxed">
          {milestone.description}
        </p>
      )}

      {/* Bottom row: assignee + due date + drag handle */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {milestone.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={milestone.assignee.avatar_url || ""} />
              <AvatarFallback className="text-[8px]">
                {milestone.assignee.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          {milestone.due_date && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                isOverdue
                  ? "bg-red-500/15 text-red-400"
                  : isDueSoon
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {new Date(milestone.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Drag handle */}
        <button
          {...dragListeners}
          className="text-muted-foreground cursor-grab rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
