"use client";
// src/features/projects/components/HealthScoreRing.tsx
// Animated SVG ring showing composite project health score 0-100.
// Fix 12: Tailwind semantic classes only — no --pd-* tokens.

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green-500
  if (score >= 40) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}

interface HealthScoreRingProps {
  score: number; // 0–100
  size?: number;
  className?: string;
}

export function HealthScoreRing({ score, size = 96, className }: HealthScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const color = scoreColor(clampedScore);
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedScore / 100);

  return (
    <div
      className={cn("flex flex-col items-center gap-1", className)}
      aria-label={`Project health score: ${clampedScore} out of 100`}
      role="img"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 96 96"
          fill="none"
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx="48"
            cy="48"
            r={RADIUS}
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
            fill="none"
          />
          {/* Animated score arc */}
          <motion.circle
            cx="48"
            cy="48"
            r={RADIUS}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>

        {/* Score number — centered over ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-xl font-bold tabular-nums leading-none"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {clampedScore}
          </motion.span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
            /100
          </span>
        </div>
      </div>

      <span className="text-[11px] font-medium" style={{ color }}>
        {scoreLabel(clampedScore)}
      </span>
    </div>
  );
}
