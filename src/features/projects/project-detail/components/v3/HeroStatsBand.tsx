"use client";

import { useMemo } from "react";
import { differenceInDays, format } from "date-fns";
import { AlertTriangle, DollarSign, Clock, Activity } from "lucide-react";
import type { Project, Milestone } from "../../types";
import { useCountUp } from "../../hooks/useCountUp";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { formatCurrency } from "../../../utils/formatters";
import { cn } from "@/lib/utils";

/* ── Progress Ring ────────────────────────────────────────── */
function ProgressRing({ value, accent }: { value: number; accent: string }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 56 56">
        <circle
          className="text-gray-100 dark:text-white/5"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
        />
        <circle
          className="transition-all duration-1000 ease-out"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={accent}
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
        />
      </svg>
      <div 
        className="absolute flex items-center justify-center text-[13px] font-bold text-gray-900 dark:text-white"
        style={{ fontFamily: "var(--font-data, monospace)" }}
      >
        {Math.round(value)}
      </div>
    </div>
  );
}

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

  const healthScore = health !== undefined ? Number(health) : percentage;

  const stats = [
    {
      icon: Activity,
      label: "Health & Progress",
      value: healthScore,
      isProgress: true,
      accent: healthScore >= 80 ? "#34D399" : healthScore >= 50 ? "#F59E0B" : "#FF4D6D",
      sub: `${completed} of ${total} milestones`,
      isOverdue: false,
    },
    {
      icon: Clock,
      label: "Timeline",
      value: deadlineLabel,
      isProgress: false,
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
      isProgress: false,
      accent: isOverBudget ? "#FF4D6D" : "#6C63FF",
      sub: budgetCents
        ? isOverBudget
          ? `Over by ${formatCurrency(invoicesTotal - budgetCents)}`
          : `Budget: ${formatCurrency(budgetCents)}`
        : "No budget set",
      isOverdue: isOverBudget,
      progressFraction: budgetCents && budgetCents > 0 ? invoicesTotal / budgetCents : 0,
    },
  ];

  return (
    <div className="w-full px-8 py-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 sm:flex-row">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative flex flex-1 flex-col justify-between p-5 rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#0C0D14]"
            >
              {/* Top row: Label + Icon */}
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-500 dark:text-gray-400"
                  style={{ fontFamily: "var(--font-data, monospace)" }}
                >
                  {stat.label}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                  <Icon className="h-4 w-4" style={{ color: stat.accent }} />
                </div>
              </div>

              {/* Middle row: Value or Progress Ring */}
              <div className="flex items-center gap-4 mb-4">
                {stat.isProgress ? (
                  <ProgressRing value={stat.value as number} accent={stat.accent} />
                ) : (
                  <div
                    className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
                    style={{ fontFamily: "var(--font-data, monospace)" }}
                  >
                    {stat.value}
                  </div>
                )}
              </div>

              {/* Financial Progress Bar */}
              {!stat.isProgress && stat.label === "Financials" && stat.progressFraction !== undefined && (
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.max(0, stat.progressFraction * 100))}%`,
                      background: stat.accent,
                    }}
                  />
                </div>
              )}

              {/* Sub text */}
              <p
                className={cn(
                  "flex items-center gap-1.5 text-[12px] font-medium",
                  stat.isOverdue ? "text-[#FF4D6D]" : "text-gray-500 dark:text-gray-400"
                )}
              >
                {stat.isOverdue && <AlertTriangle className="h-3 w-3" />}
                {stat.sub}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
