"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { HealthScoreResult } from "../../lib/healthScore";

const OUTER_R = 34;
const INNER_R = 26;
const STROKE = 6;
const C_OUTER = 2 * Math.PI * OUTER_R;
const C_INNER = 2 * Math.PI * INNER_R;

function scoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}

function scoreGradientId(score: number): string {
  if (score >= 70) return "health-green";
  if (score >= 40) return "health-amber";
  return "health-red";
}

const GRADIENT_STOPS: Record<string, [string, string]> = {
  "health-green": ["#34D399", "#059669"],
  "health-amber": ["#F59E0B", "#D97706"],
  "health-red": ["#FF4D6D", "#C0392B"],
};

interface HealthScoreRingProps {
  health: HealthScoreResult;
  size?: number;
}

export function HealthScoreRing({ health, size = 80 }: HealthScoreRingProps) {
  const [hovered, setHovered] = useState(false);
  const outerOffset = C_OUTER * (1 - health.score / 100);
  const innerOffset = C_INNER * (1 - (health.score * 0.7) / 100);
  const gradId = scoreGradientId(health.score);
  const [startColor, endColor] = GRADIENT_STOPS[gradId]!;

  return (
    <div
      className="relative flex flex-col items-center gap-1.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="img"
      aria-label={`Project health: ${health.score}/100 — ${scoreLabel(health.score)}`}
      tabIndex={0}
    >
      {/* Glow halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 pointer-events-none"
        style={{
          background: health.color,
          opacity: hovered ? 0.2 : 0.08,
          transform: "scale(1.4)",
        }}
      />

      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          className="-rotate-90"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor={startColor} stopOpacity="0.7" />
              <stop offset="1" stopColor={endColor} />
            </linearGradient>
          </defs>

          {/* Outer track */}
          <circle
            cx="40" cy="40" r={OUTER_R}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
            fill="none"
          />

          {/* Outer arc */}
          <motion.circle
            cx="40" cy="40" r={OUTER_R}
            stroke={`url(#${gradId})`}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C_OUTER}
            initial={{ strokeDashoffset: C_OUTER }}
            animate={{ strokeDashoffset: outerOffset }}
            transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
          />

          {/* Inner track */}
          <circle
            cx="40" cy="40" r={INNER_R}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={3}
            fill="none"
          />

          {/* Inner arc (secondary ring, 70% fill) */}
          <motion.circle
            cx="40" cy="40" r={INNER_R}
            stroke={health.color}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C_INNER}
            initial={{ strokeDashoffset: C_INNER }}
            animate={{ strokeDashoffset: innerOffset }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
            opacity={0.4}
          />
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="leading-none tabular-nums"
            style={{
              color: health.color,
              fontFamily: "var(--font-metrics, 'Barlow Condensed', sans-serif)",
              fontSize: 21,
              fontWeight: 700,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {health.score}
          </motion.span>
          <span
            style={{
              fontFamily: "var(--font-data, monospace)",
              fontSize: 7,
              color: "rgba(244,244,255,0.3)",
              letterSpacing: "0.05em",
            }}
          >
            /100
          </span>
        </div>
      </div>

      {/* Label */}
      <span
        className="text-[10px] font-semibold tracking-[0.07em] uppercase"
        style={{
          color: health.color,
          fontFamily: "var(--font-data, monospace)",
        }}
      >
        {scoreLabel(health.score)}
      </span>

      {/* Tooltip breakdown */}
      <div
        className="pointer-events-none absolute -bottom-[130px] left-1/2 z-50 -translate-x-1/2 transition-all duration-200"
        style={{ opacity: hovered ? 1 : 0, transform: `translateX(-50%) translateY(${hovered ? 0 : 4}px)` }}
      >
        <div
          className="flex flex-col gap-2 rounded-xl px-3.5 py-3 bg-white dark:bg-[#0E0F16] border border-black/10 dark:border-white/[0.08] shadow-xl"
          style={{
            backdropFilter: "blur(16px)",
            minWidth: 168,
          }}
        >
          <span
            style={{ color: "rgba(244,244,255,0.35)", fontFamily: "var(--font-data, monospace)" }}
          >
            Score Breakdown
          </span>
          <BreakdownRow label="Schedule" value={health.scheduleContribution} />
          <BreakdownRow label="Budget" value={health.budgetContribution} />
          <BreakdownRow label="Velocity" value={health.velocityContribution} />
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "#34D399" : value >= 40 ? "#F59E0B" : "#FF4D6D";

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-14 text-[11px]"
        style={{ color: "rgba(244,244,255,0.5)", fontFamily: "var(--font-data, monospace)" }}
      >
        {label}
      </span>
      <div
        className="flex-1 overflow-hidden rounded-full"
        style={{ height: 3, background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}60, ${color})`,
          }}
        />
      </div>
      <span
        className="w-5 text-right tabular-nums text-[10px]"
        style={{ color: "rgba(244,244,255,0.35)", fontFamily: "var(--font-data, monospace)" }}
      >
        {value}
      </span>
    </div>
  );
}
