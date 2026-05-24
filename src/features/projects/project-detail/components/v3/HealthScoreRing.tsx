"use client";

// src/features/projects/project-detail/components/v3/HealthScoreRing.tsx
// Animated SVG ring showing composite project health score 0–100.
// Includes a hover tooltip with 3-row breakdown.

import { motion } from "framer-motion";
import type { HealthScoreResult } from "../../lib/healthScore";

const RADIUS = 36;
const STROKE_WIDTH = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}

interface HealthScoreRingProps {
  health: HealthScoreResult;
  size?: number;
}

export function HealthScoreRing({
  health,
  size = 80,
}: HealthScoreRingProps) {
  const strokeDashoffset =
    CIRCUMFERENCE * (1 - health.score / 100);

  return (
    <div
      className="group relative flex flex-col items-center gap-0.5"
      aria-label={`Project health score: ${health.score} out of 100. Status: ${health.status}`}
      role="img"
      tabIndex={0}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            stroke="var(--pd-divider)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            opacity={0.5}
          />
          {/* Animated score arc */}
          <motion.circle
            cx="40"
            cy="40"
            r={RADIUS}
            stroke={health.color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 0.8,
              ease: [0.65, 0, 0.35, 1],
            }}
          />
        </svg>

        {/* Score number — centered over ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="tabular-nums leading-none"
            style={{
              color: health.color,
              fontFamily: "var(--font-metrics)",
              fontSize: 22,
              fontWeight: 700,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {health.score}
          </motion.span>
          <span
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 8,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--pd-text-muted)",
            }}
          >
            /100
          </span>
        </div>
      </div>

      {/* Status label */}
      <span
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 10,
          fontWeight: 500,
          color: health.color,
        }}
      >
        {scoreLabel(health.score)}
      </span>

      {/* Hover tooltip — breakdown */}
      <div
        className="pointer-events-none absolute -bottom-[120px] left-1/2 z-50 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        role="tooltip"
      >
        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{
            background: "var(--pd-surface)",
            border: "1px solid var(--pd-border)",
            boxShadow: "var(--pd-shadow-elevated)",
            minWidth: 160,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--pd-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Score Breakdown
          </span>
          <BreakdownRow
            label="Schedule"
            value={health.scheduleContribution}
          />
          <BreakdownRow
            label="Budget"
            value={health.budgetContribution}
          />
          <BreakdownRow
            label="Velocity"
            value={health.velocityContribution}
          />
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const barColor =
    value >= 70
      ? "hsl(152, 68%, 45%)"
      : value >= 40
        ? "hsl(38, 92%, 50%)"
        : "hsl(0, 72%, 58%)";

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-14"
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 11,
          color: "var(--pd-text-secondary)",
        }}
      >
        {label}
      </span>
      <div
        className="flex-1 overflow-hidden rounded-full"
        style={{ height: 4, background: "var(--pd-divider)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: barColor }}
        />
      </div>
      <span
        className="w-6 text-right tabular-nums"
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 10,
          color: "var(--pd-text-muted)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
