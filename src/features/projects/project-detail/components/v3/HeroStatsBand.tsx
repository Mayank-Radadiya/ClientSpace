"use client";

import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import type { Project, Milestone } from "../../types";
import { useCountUp } from "../../hooks/useCountUp";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { formatCurrency } from "../../../utils/formatters";

/* ── Health score calculator ──────────────────────────────── */
function calcHealthScore(
  completionPct: number,
  daysRemaining: number | null,
  budgetRatio: number | null,
): { grade: string; label: string; color: string } {
  let score = 0;

  // Completion factor (0-40)
  score += completionPct * 0.4;

  // Timeline factor (0-30)
  if (daysRemaining === null) {
    score += 20; // no deadline = neutral
  } else if (daysRemaining >= 7) {
    score += 30;
  } else if (daysRemaining >= 0) {
    score += 15;
  } else {
    score += Math.max(0, 10 + daysRemaining); // decreases as more overdue
  }

  // Budget factor (0-30)
  if (budgetRatio === null) {
    score += 20;
  } else if (budgetRatio <= 0.7) {
    score += 30;
  } else if (budgetRatio <= 1.0) {
    score += 20;
  } else {
    score += Math.max(0, 15 - (budgetRatio - 1) * 20);
  }

  if (score >= 80) return { grade: "A", label: "On track", color: "var(--pd-status-done)" };
  if (score >= 60) return { grade: "B+", label: "Minor issues", color: "var(--pd-status-done)" };
  if (score >= 40) return { grade: "C", label: "At risk", color: "var(--pd-status-warning)" };
  return { grade: "D", label: "Needs attention", color: "var(--pd-status-overdue)" };
}

/* ── Stat Card ────────────────────────────────────────────── */
function StatCard({
  children,
  topLineColor,
  delay,
}: {
  children: React.ReactNode;
  topLineColor?: string;
  delay: number;
}) {
  return (
    <div
      className="pd-card pd-animate-fade-up relative flex min-h-[140px] flex-1 flex-col overflow-hidden px-5 pt-6 pb-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top colored line */}
      <div
        className="pd-top-line"
        style={{ background: topLineColor || "var(--pd-accent)" }}
      />
      {children}
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
    const total = milestones.length;
    const completed = milestones.filter((m) => m.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage: pct };
  }, [milestones]);

  const animPct = useCountUp(percentage);
  const animCompleted = useCountUp(completed);

  /* Timeline */
  const daysRemaining = useMemo(() => {
    if (!project.deadline) return null;
    return differenceInDays(new Date(project.deadline), new Date());
  }, [project.deadline]);

  const timelineTopLine = useMemo(() => {
    if (daysRemaining === null) return "var(--pd-accent)";
    if (daysRemaining < 0) return "var(--pd-status-overdue)";
    if (daysRemaining < 7) return "var(--pd-status-warning)";
    return "var(--pd-accent)";
  }, [daysRemaining]);

  const timelineValueColor = useMemo(() => {
    if (daysRemaining === null) return "var(--pd-text-primary)";
    if (daysRemaining < 0) return "var(--pd-status-overdue)";
    if (daysRemaining < 7) return "var(--pd-status-warning)";
    return "var(--pd-text-primary)";
  }, [daysRemaining]);

  const timelineSubColor = useMemo(() => {
    if (daysRemaining === null) return "var(--pd-text-muted)";
    if (daysRemaining < 0) return "var(--pd-status-overdue)";
    if (daysRemaining < 7) return "var(--pd-status-warning)";
    return "var(--pd-text-muted)";
  }, [daysRemaining]);

  /* Budget */
  const budgetCents = project.budget ?? null;
  const isOverBudget = budgetCents !== null && invoicesTotal > budgetCents;
  const budgetTopLine = isOverBudget ? "var(--pd-status-overdue)" : "var(--pd-accent)";
  const budgetRatio = budgetCents && budgetCents > 0 ? invoicesTotal / budgetCents : null;

  /* Health */
  const health = useMemo(
    () => calcHealthScore(percentage, daysRemaining, budgetRatio),
    [percentage, daysRemaining, budgetRatio],
  );

  return (
    <div
      className="flex w-full gap-4 px-6 pb-2"
      style={{ background: "var(--pd-body)" }}
    >
      {/* Card 1: Completion */}
      <StatCard delay={140}>
        <span
          style={{
            fontFamily: "var(--font-metrics)",
            fontSize: 48,
            fontWeight: 600,
            color: "var(--pd-text-primary)",
            lineHeight: 1,
          }}
        >
          {reduced ? percentage : animPct}%
        </span>
        <div
          className="my-2"
          style={{ height: 1, background: "var(--pd-divider)" }}
        />
        {/* Progress bar */}
        <div className="pd-progress-track mb-2">
          <div
            className="pd-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 12,
            color: "var(--pd-text-muted)",
          }}
        >
          {reduced ? completed : animCompleted} of {total} milestones
        </span>
      </StatCard>

      {/* Card 2: Timeline */}
      <StatCard topLineColor={timelineTopLine} delay={190}>
        <span
          style={{
            fontFamily: "var(--font-metrics)",
            fontSize: 48,
            fontWeight: 600,
            color: timelineValueColor,
            lineHeight: 1,
          }}
        >
          {daysRemaining !== null ? `${Math.abs(daysRemaining)}d` : "—"}
        </span>
        <div
          className="my-2"
          style={{ height: 1, background: "var(--pd-divider)" }}
        />
        <span
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 12,
            color: timelineSubColor,
          }}
        >
          {daysRemaining === null
            ? "No deadline"
            : daysRemaining < 0
              ? "overdue"
              : daysRemaining === 0
                ? "due today"
                : `${daysRemaining} days remaining`}
        </span>
      </StatCard>

      {/* Card 3: Budget */}
      <StatCard topLineColor={budgetTopLine} delay={240}>
        <span
          style={{
            fontFamily: "var(--font-metrics)",
            fontSize: 48,
            fontWeight: 600,
            color: "var(--pd-text-primary)",
            lineHeight: 1,
          }}
        >
          {formatCurrency(budgetCents)}
        </span>
        <div
          className="my-2"
          style={{ height: 1, background: "var(--pd-divider)" }}
        />
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 12,
              color: "var(--pd-text-muted)",
            }}
          >
            Invoiced {formatCurrency(invoicesTotal)}
          </span>
          {isOverBudget ? (
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 11,
                color: "var(--pd-status-overdue)",
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--pd-status-overdue)" }}
              />
              ↑ Over by {formatCurrency(invoicesTotal - (budgetCents ?? 0))}
            </span>
          ) : budgetCents && budgetCents > 0 ? (
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 11,
                color: "var(--pd-status-done)",
              }}
            >
              ↓ {formatCurrency(budgetCents - invoicesTotal)} remaining
            </span>
          ) : null}
        </div>
      </StatCard>

      {/* Card 4: Health Score */}
      <StatCard delay={290}>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-metrics)",
              fontSize: 48,
              fontWeight: 600,
              color: health.color,
              lineHeight: 1,
            }}
          >
            {health.grade}
          </span>
        </div>
        <div
          className="my-2"
          style={{ height: 1, background: "var(--pd-divider)" }}
        />
        <span
          className="flex items-center gap-1.5"
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 12,
            color: "var(--pd-text-muted)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: health.color }}
          />
          {health.label}
        </span>
      </StatCard>
    </div>
  );
}
