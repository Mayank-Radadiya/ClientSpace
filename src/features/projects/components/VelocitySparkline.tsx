"use client";
// src/features/projects/components/VelocitySparkline.tsx
// Pure SVG step-line sparkline — no chart library (Fix D8).
// Data source: milestones.completedAt grouped by day, computed in RSC (Fix 11).

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const W = 120;
const H = 48;
const PAD_X = 4;
const PAD_Y = 4;

interface VelocitySparklineProps {
  /** Completions per day for the past 14 days. Index 0 = 14 days ago. */
  dailyCompletions: number[];
  /** Total milestones in the project (for planned-pace reference line). */
  totalMilestones: number;
  className?: string;
}

export function VelocitySparkline({
  dailyCompletions,
  totalMilestones,
  className,
}: VelocitySparklineProps) {
  const days = 14;
  const data = dailyCompletions.slice(0, days);

  const { actualPath, plannedPath, isOnTrack, cumulativeToday } = useMemo(() => {
    // Build cumulative actual series
    const cumulative: number[] = [];
    let running = 0;
    for (const v of data) {
      running += v;
      cumulative.push(running);
    }

    const maxVal = Math.max(totalMilestones, running, 1);
    const xStep = (W - PAD_X * 2) / (days - 1);

    const toX = (i: number) => PAD_X + i * xStep;
    const toY = (v: number) => H - PAD_Y - ((v / maxVal) * (H - PAD_Y * 2));

    // Step-line: for each segment go right then up
    let actualD = `M ${toX(0)} ${toY(cumulative[0] ?? 0)}`;
    for (let i = 1; i < cumulative.length; i++) {
      const x = toX(i);
      const y = toY(cumulative[i] ?? 0);
      const prevY = toY(cumulative[i - 1] ?? 0);
      actualD += ` H ${x} V ${y}`;
    }

    // Planned pace: straight line from (0,0) to (13, totalMilestones)
    const plannedD = `M ${toX(0)} ${toY(0)} L ${toX(days - 1)} ${toY(totalMilestones)}`;

    const plannedAtToday = totalMilestones; // full pace by end of 14d window
    const cumulativeToday = running;
    const isOnTrack = cumulativeToday >= Math.floor((plannedAtToday * (days / days)));

    return { actualPath: actualD, plannedPath: plannedD, isOnTrack, cumulativeToday: running };
  }, [data, totalMilestones]);

  const strokeColor = isOnTrack ? "#22c55e" : "#f59e0b"; // green-500 / amber-500
  const labelColor = isOnTrack ? "text-green-600" : "text-amber-600";

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[10px] font-medium text-muted-foreground">Velocity</span>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-label={`Milestone velocity over the past 14 days: ${cumulativeToday} completed`}
        role="img"
      >
        {/* Planned pace reference line (dashed) */}
        <path
          d={plannedPath}
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="3 3"
          fill="none"
          opacity={0.6}
        />
        {/* Actual step-line */}
        <path d={actualPath} stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </svg>
      <span className={cn("text-[10px] font-medium", labelColor)}>
        {isOnTrack ? "on track" : "behind"}
      </span>
    </div>
  );
}
