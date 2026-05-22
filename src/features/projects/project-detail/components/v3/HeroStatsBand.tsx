"use client";

import { useMemo } from "react";
import { differenceInDays, format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import type { Project, Milestone } from "../../types";
import { useCountUp } from "../../hooks/useCountUp";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { formatCurrency } from "../../../utils/formatters";

/* ── Health score calculator ──────────────────────────────── */
function calcHealthScore(
  completionPct: number,
  daysRemaining: number | null,
  budgetRatio: number | null,
): { grade: string; label: string; color: string; segments: number } {
  let score = 0;
  score += completionPct * 0.4;
  if (daysRemaining === null) score += 20;
  else if (daysRemaining >= 7) score += 30;
  else if (daysRemaining >= 0) score += 15;
  else score += Math.max(0, 10 + daysRemaining);
  if (budgetRatio === null) score += 20;
  else if (budgetRatio <= 0.7) score += 30;
  else if (budgetRatio <= 1.0) score += 20;
  else score += Math.max(0, 15 - (budgetRatio - 1) * 20);

  if (score >= 80) return { grade: "A", label: "On track", color: "var(--pd-status-done)", segments: 5 };
  if (score >= 60) return { grade: "B+", label: "Minor issues", color: "var(--pd-status-done)", segments: 4 };
  if (score >= 40) return { grade: "C", label: "At risk", color: "var(--pd-status-warning)", segments: 3 };
  return { grade: "D", label: "Needs attention", color: "var(--pd-status-overdue)", segments: 1 };
}

/* ── 5-segment health bar ─────────────────────────────────── */
function HealthBar({ segments, color }: { segments: number; color: string }) {
  return (
    <div className="mt-2 flex gap-[3px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={i < segments ? "pd-animate-health-seg" : ""}
          style={{
            width: 18,
            height: 6,
            borderRadius: 2,
            background: i < segments ? color : "var(--pd-divider)",
            animationDelay: `${300 + i * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Vertical Divider ─────────────────────────────────────── */
function VDivider() {
  return (
    <div className="flex items-center" style={{ padding: "0 0" }}>
      <div style={{ width: 1, height: "60%", background: "var(--pd-divider)", minHeight: 60 }} />
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
interface HeroStatsBandProps {
  project: Project;
  milestones: Milestone[];
  invoicesTotal: number;
}

export function HeroStatsBand({
  project,
  milestones,
  invoicesTotal,
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
    return format(new Date(project.deadline), "MMM d");
  }, [project.deadline]);

  const timelineColor = useMemo(() => {
    if (daysRemaining === null) return "var(--pd-text-primary)";
    if (daysRemaining < 0) return "var(--pd-status-overdue)";
    if (daysRemaining < 7) return "var(--pd-status-warning)";
    return "var(--pd-text-primary)";
  }, [daysRemaining]);

  /* Budget */
  const budgetCents = project.budget ?? null;
  const isOverBudget = budgetCents !== null && invoicesTotal > budgetCents;
  const budgetRatio = budgetCents && budgetCents > 0 ? invoicesTotal / budgetCents : null;

  /* Health */
  const health = useMemo(
    () => calcHealthScore(percentage, daysRemaining, budgetRatio),
    [percentage, daysRemaining, budgetRatio],
  );

  const labelStyle = {
    fontFamily: "var(--font-data)",
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--pd-text-muted)",
    fontWeight: 400,
  };

  const valueStyle = {
    fontFamily: "var(--font-metrics)",
    fontSize: 40,
    fontWeight: 600,
    lineHeight: 1,
  };

  const subStyle = {
    fontFamily: "var(--font-data)",
    fontSize: 11,
    color: "var(--pd-text-muted)",
  };

  return (
    <div
      className="pd-animate-fade-up w-full px-8 pb-4"
      style={{ background: "var(--pd-body)", animationDelay: "140ms" }}
    >
      <div className="pd-card flex items-stretch">
        {/* ── Column 1: Completion ─────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center p-6">
          <span style={labelStyle}>COMPLETION</span>
          <span className="mt-2" style={{ ...valueStyle, color: "var(--pd-text-primary)" }}>
            {reduced ? percentage : animPct}%
          </span>
          <div className="pd-progress-track mt-3 w-full">
            <div className="pd-progress-fill" style={{ width: `${percentage}%` }} />
          </div>
          <span className="mt-2" style={subStyle}>
            {completed} of {total} milestones
          </span>
        </div>

        <VDivider />

        {/* ── Column 2: Deadline ───────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center p-6">
          <span style={labelStyle}>DEADLINE</span>
          <span className="mt-2" style={{ ...valueStyle, color: timelineColor }}>
            {deadlineLabel}
          </span>
          <span className="mt-2 flex items-center gap-1" style={{ ...subStyle, color: timelineColor }}>
            {daysRemaining !== null && daysRemaining < 0 && <AlertTriangle size={11} />}
            {daysRemaining === null
              ? "No deadline"
              : daysRemaining < 0
                ? `${Math.abs(daysRemaining)} days overdue`
                : daysRemaining === 0
                  ? "Due today"
                  : `${daysRemaining} days remaining`}
          </span>
        </div>

        <VDivider />

        {/* ── Column 3: Budget ─────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center p-6">
          <span style={labelStyle}>BUDGET</span>
          <span className="mt-2" style={{ ...valueStyle, color: "var(--pd-text-primary)" }}>
            {formatCurrency(budgetCents)}
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {/* Invoiced pill */}
            <span
              className="inline-flex items-center"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 11,
                color: "var(--pd-text-muted)",
                background: "var(--pd-elevated)",
                borderRadius: 4,
                padding: "3px 8px",
              }}
            >
              Invoiced {formatCurrency(invoicesTotal)}
            </span>
            {/* Over/Under pill */}
            {isOverBudget ? (
              <span
                className="inline-flex items-center"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--pd-status-overdue)",
                  background: "var(--pd-status-overdue-bg)",
                  borderRadius: 4,
                  padding: "3px 8px",
                }}
              >
                Over {formatCurrency(invoicesTotal - (budgetCents ?? 0))} ↑
              </span>
            ) : budgetCents && budgetCents > 0 ? (
              <span
                className="inline-flex items-center"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--pd-status-done)",
                  background: "var(--pd-status-done-bg)",
                  borderRadius: 4,
                  padding: "3px 8px",
                }}
              >
                {formatCurrency(budgetCents - invoicesTotal)} left
              </span>
            ) : null}
          </div>
        </div>

        <VDivider />

        {/* ── Column 4: Health Score ───────────────────────── */}
        <div className="flex flex-1 flex-col justify-center p-6">
          <span style={labelStyle}>HEALTH</span>
          <span className="mt-2" style={{ ...valueStyle, color: health.color }}>
            {health.grade}
          </span>
          <span className="mt-2 flex items-center gap-1.5" style={{ ...subStyle, color: health.color }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: health.color }}
            />
            {health.label}
          </span>
          <HealthBar segments={health.segments} color={health.color} />
        </div>
      </div>
    </div>
  );
}
