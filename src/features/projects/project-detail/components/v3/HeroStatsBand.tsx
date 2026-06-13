"use client";

import { useMemo } from "react";
import { differenceInDays, format } from "date-fns";
import { AlertTriangle, TrendingUp, DollarSign, Target, Clock, Activity } from "lucide-react";
import type { Project, Milestone } from "../../types";
import { useCountUp } from "../../hooks/useCountUp";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { formatCurrency } from "../../../utils/formatters";
import { cn } from "@/lib/utils";

/* ── Main Component ───────────────────────────────────────── */
interface HeroStatsBandProps {
  project: Project;
  milestones: Milestone[];
  invoicesTotal: number;
  health?: number;
}

export function HeroStatsBand({
  project,
  milestones,
  invoicesTotal,
  health,
}: HeroStatsBandProps) {
  const reduced = useReducedMotion();

  /* Completion */
  const { completed, total, percentage } = useMemo(() => {
    const t = milestones.length;
    const c = milestones.filter((m) => m.completed).length;
    const pct = t > 0 ? Math.round((c / t) * 100) : 0;
    return { completed: c, total: t, percentage: pct };
  }, [milestones]);

  const animPct = useCountUp(percentage);

  /* Timeline */
  const daysRemaining = useMemo(() => {
    if (!project.deadline) return null;
    return differenceInDays(new Date(project.deadline), new Date());
  }, [project.deadline]);

  const deadlineLabel = useMemo(() => {
    if (!project.deadline) return "—";
    return format(new Date(project.deadline), "MMM d, yyyy");
  }, [project.deadline]);

  const timelineUrgency = useMemo(() => {
    if (daysRemaining === null) return "neutral";
    if (daysRemaining < 0) return "overdue";
    if (daysRemaining < 7) return "warning";
    return "neutral";
  }, [daysRemaining]);

  const urgencyColor = {
    overdue: "#FF4D6D",
    warning: "#F59E0B",
    neutral: "#F4F4FF",
  }[timelineUrgency];

  /* Budget */
  const budgetCents = project.budget ?? null;
  const isOverBudget = budgetCents !== null && invoicesTotal > budgetCents;
  const budgetUsedPct = budgetCents && budgetCents > 0
    ? Math.min(Math.round((invoicesTotal / budgetCents) * 100), 100)
    : 0;

  const stats = [
    {
      icon: Activity,
      label: "Health & Progress",
      value: health !== undefined ? `${health}/100` : `${percentage}%`,
      accent: health && health >= 80 ? "#34D399" : health && health >= 50 ? "#F59E0B" : "#FF4D6D",
      sub: `${completed} of ${total} milestones completed`,
      isOverdue: false,
    },
    {
      icon: Clock,
      label: "Timeline",
      value: deadlineLabel,
      accent: urgencyColor,
      sub: daysRemaining === null
        ? "No deadline set"
        : daysRemaining < 0
          ? `${Math.abs(daysRemaining)} days overdue`
          : daysRemaining === 0
            ? "Due today"
            : `${daysRemaining} days remaining`,
      isOverdue: daysRemaining !== null && daysRemaining < 0,
    },
    {
      icon: DollarSign,
      label: "Financials",
      value: formatCurrency(invoicesTotal),
      accent: isOverBudget ? "#FF4D6D" : "#6C63FF",
      sub: budgetCents
        ? isOverBudget
          ? `Over by ${formatCurrency(invoicesTotal - budgetCents)}`
          : `Budget: ${formatCurrency(budgetCents)}`
        : "No budget set",
      isOverdue: isOverBudget,
    },
  ];

  return (
    <div className="w-full">
      <div className="relative z-10 w-full overflow-hidden border-y border-black/5 bg-white shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
        <div className="mx-auto flex max-w-[1400px] flex-col divide-y divide-black/5 sm:flex-row sm:divide-y-0 sm:divide-x dark:divide-white/[0.08]">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative flex flex-1 flex-col justify-between p-5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                {/* Label row */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="text-[10px] tracking-[0.1em] uppercase text-gray-500 dark:text-[#F4F4FF]/40"
                    style={{
                      fontFamily: "var(--font-data, monospace)",
                    }}
                  >
                    {stat.label}
                  </span>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10"
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: stat.accent }}
                    />
                  </div>
                </div>

                {/* Value */}
                <div
                  className="text-2xl font-bold leading-none tracking-tight text-gray-900 dark:text-white"
                  style={{
                    fontFamily: "var(--font-metrics, 'Barlow Condensed', sans-serif)",
                  }}
                >
                  {stat.value}
                </div>



                {/* Sub text */}
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 text-[11px]",
                    stat.isOverdue ? "text-[#FF4D6D]" : "text-gray-500 dark:text-[#F4F4FF]/35"
                  )}
                  style={{
                    fontFamily: "var(--font-data, monospace)",
                  }}
                >
                  {stat.isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
                  {stat.sub}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
