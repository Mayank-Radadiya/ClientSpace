"use client";

import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { Milestone, Project } from "../types";
import { ProjectPermissions } from "../hooks/useProjectPermissions";
import { formatCurrency } from "../../utils/formatters";

interface InsightWidgetsProps {
  project: Project;
  milestones: Milestone[];
  permissions: ProjectPermissions;
  invoicesTotal: number;
  onAddMilestone?: () => void;
}

// ── SVG Progress Ring ────────────────────────────────────────
function ProgressRing({ percent }: { percent: number }) {
  const r = 15.9155; // radius matching the arc path
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  const isComplete = percent >= 100;

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        {/* Background track ring */}
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3"
          className={isComplete ? "stroke-green-500" : "stroke-primary"}
          style={{ opacity: 0.15 }}
        />
        {/* Foreground progress ring */}
        {percent > 0 && (
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            className={isComplete ? "stroke-green-500" : "stroke-primary"}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 0.6s ease",
            }}
          />
        )}
      </svg>
    </div>
  );
}

export function InsightWidgets({
  project,
  milestones,
  permissions,
  invoicesTotal,
  onAddMilestone,
}: InsightWidgetsProps) {
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const progressPercent =
    milestones.length > 0
      ? Math.round((completedMilestones / milestones.length) * 100)
      : 0;

  const allComplete =
    milestones.length > 0 && completedMilestones === milestones.length;

  const nextMilestone = useMemo(() => {
    return milestones
      .filter((m) => !m.completed && m.due_date)
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
      )[0];
  }, [milestones]);

  // ── Timeline Tracker ───────────────────────────────────────
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

    if (project.status === "completed") {
      return {
        text: isPastDeadline ? `${diff} days late` : "Delivered on time",
        color: isPastDeadline ? "text-destructive" : "text-green-500",
        barColor: isPastDeadline ? "bg-destructive" : "bg-green-500",
        dueSub: "Completed",
        isCompleted: true,
        isUrgent: false,
        isOverdue: false,
        progress: 100,
        dueDate: format(end, "MMM d, yyyy"),
      };
    }

    const isUrgent = !isPastDeadline && diff <= 3;

    return {
      text: isPastDeadline ? `${diff} days overdue` : `${diff} days remaining`,
      color:
        isPastDeadline || isUrgent ? "text-destructive" : "text-foreground",
      barColor: isPastDeadline || isUrgent ? "bg-destructive" : "bg-primary",
      dueSub: isPastDeadline
        ? `⚠ Overdue — ${format(end, "MMM d, yyyy")}`
        : isUrgent
          ? `⚠ Due soon — ${format(end, "MMM d, yyyy")}`
          : `Due ${format(end, "MMM d, yyyy")}`,
      isCompleted: false,
      isUrgent,
      isOverdue: isPastDeadline,
      progress,
      dueDate: format(end, "MMM d, yyyy"),
    };
  }, [project.deadline, project.start_date, project.status]);

  // ── Budget Snapshot ────────────────────────────────────────
  const isOverBudget = project.budget != null && invoicesTotal > project.budget;
  const overBudgetAmount =
    isOverBudget && project.budget != null ? invoicesTotal - project.budget : 0;
  const budgetPercent = project.budget
    ? Math.min(100, Math.max(0, (invoicesTotal / project.budget) * 100))
    : 0;

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Widget 1: Progress */}
      <div className="bg-card flex items-center justify-between rounded-xl border p-5 shadow-sm">
        <div className="flex flex-col">
          <span className="text-muted-foreground mb-1 text-sm font-medium">
            Project Progress
          </span>
          <span className="text-2xl font-semibold">{progressPercent}%</span>
          <span className="text-muted-foreground mt-1 text-xs">
            {completedMilestones} of {milestones.length} milestones complete
          </span>
        </div>
        <ProgressRing percent={progressPercent} />
      </div>

      {/* Widget 2: Timeline Tracker */}
      <div
        className={`bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm ${
          timelineInfo.isOverdue ? "bg-destructive/5" : ""
        }`}
      >
        <div className="space-y-1">
          <span className="text-muted-foreground text-sm font-medium">
            Timeline Tracker
          </span>
          <div
            className={`flex items-center gap-2 text-2xl font-semibold ${timelineInfo.color}`}
          >
            {(timelineInfo.isUrgent || timelineInfo.isOverdue) && (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
            {timelineInfo.text}
          </div>
          <span
            className={`inline-block text-xs ${timelineInfo.isUrgent || timelineInfo.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
          >
            {timelineInfo.dueSub}
          </span>
        </div>
        <div className="bg-muted mt-4 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${timelineInfo.barColor}`}
            style={{ width: `${timelineInfo.progress}%` }}
          />
        </div>
      </div>

      {/* Widget 3: Budget Snapshot */}
      {permissions.canViewBudget ? (
        <div className="bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-sm font-medium">
              Budget Snapshot
            </span>
            <div className="text-2xl font-semibold">
              {project.budget ? formatCurrency(project.budget) : "Unset"}
            </div>
            <span
              className={`inline-block text-xs ${
                isOverBudget
                  ? "font-medium text-red-500"
                  : "text-muted-foreground"
              }`}
            >
              Invoiced: {formatCurrency(invoicesTotal)}
            </span>
          </div>
          {project.budget != null && (
            <>
              <div className="bg-muted mt-4 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget ? "bg-destructive" : "bg-indigo-500"
                  }`}
                  style={{ width: `${isOverBudget ? 100 : budgetPercent}%` }}
                />
              </div>
              {isOverBudget && (
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500">
                  ⚠ Over budget by {formatCurrency(overBudgetAmount)}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-card flex flex-col items-center justify-center rounded-xl border p-5 text-center opacity-50 shadow-sm">
          <span className="text-muted-foreground text-xs font-medium">
            Budget access restricted
          </span>
        </div>
      )}

      {/* Widget 4: Next Milestone */}
      <div className="bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm">
        <div className="space-y-1">
          <span className="text-muted-foreground text-sm font-medium">
            Next Milestone
          </span>
          {milestones.length === 0 ? (
            <div className="mt-2 space-y-1">
              <div className="text-muted-foreground text-sm">
                No milestones yet
              </div>
              {onAddMilestone && (
                <button
                  onClick={onAddMilestone}
                  className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                >
                  + Add your first milestone
                </button>
              )}
            </div>
          ) : allComplete ? (
            <div className="mt-2 text-sm font-medium text-green-500">
              ✓ All milestones complete
            </div>
          ) : nextMilestone ? (
            <>
              <div className="line-clamp-2 text-lg leading-tight font-semibold">
                {nextMilestone.title}
              </div>
              <span
                className={`mt-1 inline-block text-xs ${
                  nextMilestone.due_date &&
                  differenceInDays(
                    new Date(nextMilestone.due_date),
                    new Date(),
                  ) <= 3
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                }`}
              >
                Due{" "}
                {nextMilestone.due_date
                  ? format(new Date(nextMilestone.due_date), "MMM d")
                  : "Unknown"}
              </span>
            </>
          ) : (
            <div className="text-muted-foreground mt-2 text-sm">
              No upcoming milestones with dates
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
