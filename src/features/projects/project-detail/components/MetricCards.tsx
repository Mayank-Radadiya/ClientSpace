"use client";

import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { Milestone, Project } from "../types";
import { ProjectPermissions } from "../hooks/useProjectPermissions";
import { formatCurrency } from "../../utils/formatters";

interface MetricCardsProps {
  project: Project;
  milestones: Milestone[];
  permissions: ProjectPermissions;
  invoicesTotal: number;
  onAddMilestone?: () => void;
}

export function MetricCards({
  project,
  milestones,
  permissions,
  invoicesTotal,
  onAddMilestone,
}: MetricCardsProps) {
  // 1. Progress
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const progressPercent =
    milestones.length > 0
      ? Math.round((completedMilestones / milestones.length) * 100)
      : 0;

  // 2. Timeline
  const timelineInfo = useMemo(() => {
    const end = new Date(project.deadline);
    const now = new Date();
    const isPastDeadline = end < now;
    const diff = Math.abs(differenceInDays(end, now));
    const start = project.start_date ? new Date(project.start_date) : now;
    const totalDays = Math.max(1, differenceInDays(end, start));
    const elapsedDays = Math.max(0, differenceInDays(now, start));
    const progress = Math.min(
      100,
      Math.max(0, (elapsedDays / totalDays) * 100),
    );
    const isUrgent = !isPastDeadline && diff < 3;

    return {
      daysRemaining: isPastDeadline ? 0 : diff,
      isUrgent,
      isOverdue: isPastDeadline,
      progress,
    };
  }, [project.deadline, project.start_date]);

  // 3. Budget
  const isOverBudget = project.budget != null && invoicesTotal > project.budget;
  const overBudgetAmount =
    isOverBudget && project.budget != null ? invoicesTotal - project.budget : 0;
  const budgetPercent = project.budget
    ? Math.min(100, Math.max(0, (invoicesTotal / project.budget) * 100))
    : 0;

  // 4. Next Milestone
  const nextMilestone = useMemo(() => {
    return milestones
      .filter((m) => !m.completed && m.due_date)
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
      )[0];
  }, [milestones]);

  const isTimelineRed = timelineInfo.isUrgent || timelineInfo.isOverdue;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Progress */}
      <div className="bg-card border-border flex flex-col rounded-xl border p-5 shadow-sm">
        <span className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
          Progress
        </span>
        <span className="text-card-foreground mb-4 text-[24px] font-semibold">
          {progressPercent}%
        </span>
        <div className="bg-muted mb-3 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-muted-foreground text-[13px]">
          {completedMilestones} of {milestones.length} complete
        </span>
      </div>

      {/* 2. Timeline */}
      <div
        className={`bg-card flex flex-col rounded-xl border p-5 shadow-sm ${
          isTimelineRed
            ? "border-l-4 border-red-500/50 border-l-red-500 bg-red-500/5"
            : "border-border"
        }`}
      >
        <span className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
          Timeline
        </span>
        <span
          className={`text-[24px] font-semibold ${isTimelineRed ? "text-red-500" : "text-card-foreground"} mb-4`}
        >
          {timelineInfo.isOverdue
            ? "Overdue"
            : `${timelineInfo.daysRemaining}d`}
        </span>
        <div className="bg-muted mb-3 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={`${isTimelineRed ? "bg-red-500" : "bg-foreground"} h-full rounded-full`}
            style={{ width: `${timelineInfo.progress}%` }}
          />
        </div>
        <span
          className={`text-[13px] ${isTimelineRed ? "text-red-500" : "text-muted-foreground"}`}
        >
          {timelineInfo.isOverdue
            ? `Late by ${Math.abs(differenceInDays(new Date(project.deadline), new Date()))} days`
            : `Due ${format(new Date(project.deadline), "MMM d")}`}
        </span>
      </div>

      {/* 3. Budget */}
      {permissions.canViewBudget ? (
        <div
          className={`bg-card flex flex-col rounded-xl border p-5 shadow-sm ${
            isOverBudget
              ? "border-l-4 border-red-500/50 border-l-red-500 bg-red-500/5"
              : "border-border"
          }`}
        >
          <span className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
            Budget
          </span>
          <span
            className={`text-[24px] font-semibold ${isOverBudget ? "text-red-500" : "text-card-foreground"} mb-4`}
          >
            {project.budget ? formatCurrency(project.budget) : "Unset"}
          </span>
          {project.budget != null ? (
            <>
              <div className="bg-muted mb-3 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={`${isOverBudget ? "bg-red-500" : "bg-emerald-500"} h-full rounded-full`}
                  style={{ width: `${isOverBudget ? 100 : budgetPercent}%` }}
                />
              </div>
              <span
                className={`text-[13px] ${isOverBudget ? "text-red-500" : "text-muted-foreground"}`}
              >
                {isOverBudget
                  ? `Over budget by ${formatCurrency(overBudgetAmount)}`
                  : `Invoiced: ${formatCurrency(invoicesTotal)}`}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground mt-auto flex h-[calc(0.375rem+19px)] items-center text-[13px]">
              Invoiced: {formatCurrency(invoicesTotal)}
            </span>
          )}
        </div>
      ) : (
        <div className="bg-muted/30 border-border flex flex-col items-center justify-center rounded-xl border p-5 opacity-60 shadow-sm">
          <span className="text-muted-foreground text-[13px] font-medium">
            Budget restricted
          </span>
        </div>
      )}

      {/* 4. Next Milestone */}
      <div className="bg-card border-border flex flex-col rounded-xl border p-5 shadow-sm">
        <span className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
          Next Milestone
        </span>
        {nextMilestone ? (
          <>
            <span
              className="text-card-foreground mb-4 overflow-hidden text-[20px] leading-tight font-semibold text-ellipsis whitespace-nowrap"
              title={nextMilestone.title}
              style={{ lineHeight: "32px", fontSize: "min(24px, 1.25rem)" }}
            >
              {nextMilestone.title}
            </span>
            <div className="bg-muted mb-3 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-muted-foreground/30 h-full w-full rounded-full" />
            </div>
            <span className="text-muted-foreground text-[13px]">
              Due{" "}
              {nextMilestone.due_date
                ? format(new Date(nextMilestone.due_date), "MMM d")
                : "Unknown"}
            </span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground/50 mb-4 text-[24px] font-semibold">
              None
            </span>
            <div className="bg-muted mb-3 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-muted-foreground/20 h-full w-full rounded-full" />
            </div>
            {onAddMilestone ? (
              <button
                onClick={onAddMilestone}
                className="text-left text-[13px] font-medium text-indigo-500 hover:text-indigo-400"
              >
                + Add first milestone
              </button>
            ) : (
              <span className="text-muted-foreground text-[13px]">
                No upcoming milestones
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
