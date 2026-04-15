"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { differenceInDays } from "date-fns";
import { Clock, DollarSign, CheckCircle2 } from "lucide-react";
import { Project, Milestone } from "../../types";
import { ProjectPermissions } from "../../hooks/useProjectPermissions";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useCountUp } from "../../hooks/useCountUp";
import { formatCurrency } from "../../../utils/formatters";

interface MetricBandProps {
  project: Project;
  milestones: Milestone[];
  permissions: ProjectPermissions;
  invoicesTotal: number;
  onAddMilestone?: () => void;
}

/* ── SVG radial ring ─────────────────────────────────────────── */
function ProgressRing({
  percentage,
  size = 56,
  strokeWidth = 5,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-[1200ms] ease-in-out"
      />
    </svg>
  );
}

/* ── Individual metric card ──────────────────────────────────── */
function MetricCard({
  children,
  index,
  leftBorderColor,
  reduced,
}: {
  children: React.ReactNode;
  index: number;
  leftBorderColor?: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.4, delay: index * 0.08 }
      }
      className="bg-card border-border flex h-24 flex-1 items-center gap-4 rounded-xl border px-5"
      style={{
        borderLeft: leftBorderColor
          ? `3px solid ${leftBorderColor}`
          : undefined,
      }}
    >
      {children}
    </motion.div>
  );
}

export function MetricBand({
  project,
  milestones,
  permissions,
  invoicesTotal,
  onAddMilestone,
}: MetricBandProps) {
  const reduced = useReducedMotion();

  const { completed, total, percentage } = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [milestones]);

  const animatedPercentage = useCountUp(percentage);
  const animatedCompleted = useCountUp(completed);

  /* Timeline calc */
  const daysRemaining = useMemo(() => {
    if (!project.deadline) return null;
    return differenceInDays(new Date(project.deadline), new Date());
  }, [project.deadline]);

  const timelineColor = useMemo(() => {
    if (daysRemaining === null) return undefined;
    if (daysRemaining < 0) return "var(--color-destructive)";
    if (daysRemaining <= 3) return "#f59e0b";
    return undefined;
  }, [daysRemaining]);

  /* Budget calc */
  const budgetCents = project.budget ? project.budget : null;
  const isOverBudget = budgetCents !== null && invoicesTotal > budgetCents;
  const budgetProgress =
    budgetCents && budgetCents > 0
      ? Math.min((invoicesTotal / budgetCents) * 100, 100)
      : 0;

  /* Next milestone */
  const nextMilestone = useMemo(() => {
    const upcoming = milestones
      .filter((m) => !m.completed && m.due_date)
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
      );
    return upcoming[0] || null;
  }, [milestones]);

  const allComplete = milestones.length > 0 && completed === total;

  return (
    <div className="flex w-full gap-3">
      {/* Card 1 — Progress */}
      <MetricCard index={0} reduced={reduced}>
        <ProgressRing percentage={percentage} />
        <div>
          <span className="text-foreground text-2xl font-bold">
            {reduced ? percentage : animatedPercentage}%
          </span>
          <p className="text-foreground/45 text-xs">
            {reduced ? completed : animatedCompleted} of {total} milestones
          </p>
        </div>
      </MetricCard>

      {/* Card 2 — Timeline */}
      <MetricCard
        index={1}
        reduced={reduced}
        leftBorderColor={
          daysRemaining !== null && daysRemaining < 0
            ? "var(--color-destructive)"
            : undefined
        }
      >
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
          <Clock className="text-foreground/70 h-5 w-5" />
        </div>
        <div>
          {daysRemaining !== null ? (
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-2xl font-bold"
                  style={{
                    color:
                      daysRemaining < 0
                        ? "var(--color-destructive)"
                        : daysRemaining <= 3
                          ? "#f59e0b"
                          : "var(--color-foreground)",
                  }}
                >
                  {Math.abs(daysRemaining)}d
                </span>
                {daysRemaining <= 3 && daysRemaining >= 0 && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                )}
              </div>
              <p className="text-foreground/45 text-xs">
                {daysRemaining < 0
                  ? `${Math.abs(daysRemaining)}d overdue`
                  : daysRemaining === 0
                    ? "Due today"
                    : `Due ${new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              </p>
            </>
          ) : (
            <span className="text-foreground/45 text-sm">No deadline</span>
          )}
        </div>
      </MetricCard>

      {/* Card 3 — Budget */}
      {permissions.canViewBudget && (
        <MetricCard
          index={2}
          reduced={reduced}
          leftBorderColor={
            isOverBudget ? "var(--color-destructive)" : undefined
          }
        >
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
            <DollarSign className="text-foreground/70 h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-foreground text-2xl font-bold">
              {formatCurrency(budgetCents)}
            </span>
            <p className="text-foreground/45 text-xs">
              Invoiced: {formatCurrency(invoicesTotal)}
            </p>
            {isOverBudget ? (
              <p className="text-destructive mt-0.5 text-[10px] font-medium">
                ⚠ Over by {formatCurrency(invoicesTotal - (budgetCents ?? 0))}
              </p>
            ) : (
              budgetCents &&
              budgetCents > 0 && (
                <div className="bg-muted mt-1.5 h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${budgetProgress}%` }}
                  />
                </div>
              )
            )}
          </div>
        </MetricCard>
      )}

      {/* Card 4 — Next milestone */}
      <MetricCard index={3} reduced={reduced}>
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
          <CheckCircle2 className="text-foreground/70 h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          {allComplete ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                All done
              </span>
            </div>
          ) : nextMilestone ? (
            <>
              <p className="text-foreground truncate text-sm font-medium">
                {nextMilestone.title}
              </p>
              {nextMilestone.due_date && (
                <span className="bg-muted text-foreground/70 mt-0.5 inline-flex rounded-md px-1.5 py-0.5 text-[10px]">
                  {new Date(nextMilestone.due_date).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    },
                  )}
                </span>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-xs">
              No milestones ·{" "}
              <button
                onClick={onAddMilestone}
                className="text-primary hover:underline"
              >
                + Add one
              </button>
            </p>
          )}
        </div>
      </MetricCard>
    </div>
  );
}
