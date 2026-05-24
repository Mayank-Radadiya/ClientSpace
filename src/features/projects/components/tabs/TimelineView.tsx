"use client";
// src/features/projects/components/tabs/TimelineView.tsx
// Horizontal Gantt-style timeline using pure SVG.
// No third-party chart library — no bundle weight.

import { useMemo } from "react";
import { useMilestones } from "../hooks/useMilestones";
import type { MilestoneStatus } from "../types";
import { Loader2 } from "lucide-react";

const STATUS_COLOR: Record<MilestoneStatus, string> = {
  todo: "#94a3b8",        // slate-400
  in_progress: "#3b82f6", // blue-500
  done: "#22c55e",        // green-500
};

const BAR_HEIGHT = 28;
const LABEL_W = 160;
const ROW_GAP = 8;

interface TimelineViewProps {
  projectId: string;
  projectStartDate: string | null;
  projectDeadline: string;
}

export function TimelineView({ projectId, projectStartDate, projectDeadline }: TimelineViewProps) {
  const { milestones, isLoading } = useMilestones(projectId);

  const { rows, totalDays, svgWidth, svgHeight, today } = useMemo(() => {
    const start = projectStartDate
      ? new Date(projectStartDate).getTime()
      : Math.min(...milestones.map((m) => m.dueDate ? new Date(m.dueDate).getTime() : Date.now())) || Date.now();

    const end = new Date(projectDeadline).getTime();
    const totalDays = Math.max(1, Math.ceil((end - start) / 86400000));

    const availableW = 600; // SVG track width
    const toX = (ts: number) =>
      LABEL_W + Math.max(0, Math.min(availableW, ((ts - start) / (end - start)) * availableW));

    const rows = milestones.map((m) => {
      const dueTs = m.dueDate ? new Date(m.dueDate).getTime() : end;
      const startTs = m.startDate
        ? new Date(m.startDate).getTime()
        : dueTs - 86400000 * 3; // 3-day bar if no start

      return {
        id: m.id,
        title: m.title,
        status: m.status,
        x1: toX(startTs),
        x2: Math.max(toX(startTs) + 6, toX(dueTs)), // min 6px bar
        isOverdue: !m.completed && dueTs < Date.now(),
      };
    });

    const svgWidth = LABEL_W + availableW + 20;
    const svgHeight = milestones.length * (BAR_HEIGHT + ROW_GAP) + ROW_GAP + 32; // + header
    const today = toX(Date.now());

    return { rows, totalDays, svgWidth, svgHeight, today };
  }, [milestones, projectStartDate, projectDeadline]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No milestones with dates to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-label="Project milestone timeline"
        role="img"
      >
        {/* Grid lines */}
        {rows.map((_, i) => (
          <line
            key={i}
            x1={LABEL_W}
            x2={svgWidth - 20}
            y1={32 + i * (BAR_HEIGHT + ROW_GAP) + BAR_HEIGHT / 2}
            y2={32 + i * (BAR_HEIGHT + ROW_GAP) + BAR_HEIGHT / 2}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Today line */}
        <line
          x1={today}
          x2={today}
          y1={24}
          y2={svgHeight - 4}
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity={0.7}
        />
        <text x={today + 4} y={20} fill="#ef4444" fontSize="9" fontFamily="system-ui">
          Today
        </text>

        {rows.map((row, i) => {
          const y = 32 + i * (BAR_HEIGHT + ROW_GAP);
          const color = row.isOverdue ? "#ef4444" : STATUS_COLOR[row.status];

          return (
            <g key={row.id} role="listitem" aria-label={row.title}>
              {/* Label */}
              <text
                x={0}
                y={y + BAR_HEIGHT / 2 + 4}
                fontSize="11"
                fontFamily="system-ui"
                fill="currentColor"
                className="fill-foreground"
              >
                {row.title.length > 18 ? row.title.slice(0, 16) + "…" : row.title}
              </text>

              {/* Track background */}
              <rect
                x={LABEL_W}
                y={y + 4}
                width={600}
                height={BAR_HEIGHT - 8}
                rx="3"
                fill="#f1f5f9"
              />

              {/* Bar */}
              <rect
                x={row.x1}
                y={y + 4}
                width={Math.max(6, row.x2 - row.x1)}
                height={BAR_HEIGHT - 8}
                rx="3"
                fill={color}
                opacity={row.status === "done" ? 0.75 : 1}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
