"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { OBSIDIAN } from "./project-card/ProjectCard.constants";

type ProjectStats = {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
};

type ProjectsStatsProps = {
  stats: ProjectStats;
};

/* ─── Animated Counter Hook ─────────────────────────────────────────── */

function useCountUp(target: number, delay: number = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const duration = 700;

      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, delay]);

  return value;
}

/* ─── Stat Card Definitions ─────────────────────────────────────────── */

type SubLabelDef = {
  getText: (stats: ProjectStats) => string;
  dotColor?: string;
  textColor?: string;
};

type StatCardDef = {
  key: "total" | "inProgress" | "completed" | "overdue" | "completion";
  label: string;
  lineColor: string;
  sub: SubLabelDef;
};

const STAT_CARDS: StatCardDef[] = [
  {
    key: "total",
    label: "TOTAL PROJECTS",
    lineColor: "#4F7FFF",
    sub: { getText: (s) => `${s.total} added this month` },
  },
  {
    key: "inProgress",
    label: "IN PROGRESS",
    lineColor: "#4F7FFF",
    sub: {
      getText: (s) =>
        `${Math.min(s.inProgress, 2)} approaching deadline`,
      dotColor: "#F59E0B",
      textColor: "#F59E0B",
    },
  },
  {
    key: "completed",
    label: "COMPLETED",
    lineColor: "#22C55E",
    sub: { getText: (s) => `${s.completed} this month` },
  },
  {
    key: "overdue",
    label: "OVERDUE",
    lineColor: "#EF4444",
    sub: {
      getText: (s) => `${s.overdue} need attention`,
      dotColor: "#EF4444",
      textColor: "#EF4444",
    },
  },
  {
    key: "completion",
    label: "COMPLETION",
    lineColor: "#4F7FFF",
    sub: { getText: () => "" },
  },
];

/* ─── Component ─────────────────────────────────────────────────────── */

export function ProjectsStats({ stats }: ProjectsStatsProps) {
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const getValue = (key: StatCardDef["key"]) => {
    if (key === "completion") return completionRate;
    if (key === "total") return stats.total;
    if (key === "inProgress") return stats.inProgress;
    if (key === "completed") return stats.completed;
    return stats.overdue;
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {STAT_CARDS.map((card, idx) => (
        <StatCard
          key={card.key}
          card={card}
          rawValue={getValue(card.key)}
          isCompletion={card.key === "completion"}
          stats={stats}
          completionRate={completionRate}
          index={idx}
        />
      ))}
    </div>
  );
}

/* ─── Individual Stat Card ──────────────────────────────────────────── */

function StatCard({
  card,
  rawValue,
  isCompletion,
  stats,
  completionRate,
  index,
}: {
  card: StatCardDef;
  rawValue: number;
  isCompletion: boolean;
  stats: ProjectStats;
  completionRate: number;
  index: number;
}) {
  const animatedValue = useCountUp(rawValue, index * 80);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (isCompletion) {
      const timeout = setTimeout(() => setBarWidth(completionRate), 400);
      return () => clearTimeout(timeout);
    }
  }, [isCompletion, completionRate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.12 + index * 0.06,
        ease: OBSIDIAN.cubic,
      }}
      className={cn(
        "group relative overflow-hidden rounded-[12px] border",
        "px-[22px] py-[20px]",
        "transition-all duration-180 ease-out",
        "border-[#EBEBF0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        "dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111118] dark:shadow-none",
        "hover:-translate-y-[2px]",
        isCompletion && "col-span-2 lg:col-span-1",
      )}
    >
      {/* 2px colored top-edge line */}
      <div
        className="absolute top-0 left-0 h-[2px] w-full transition-opacity duration-180 group-hover:opacity-100"
        style={{ backgroundColor: card.lineColor, opacity: 0.8 }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col">
        {/* Label */}
        <p className="font-(--font-data) mb-3 text-[11px] tracking-[0.08em] text-[#6B6B7E] uppercase">
          {card.label}
        </p>

        {/* Value — Barlow Condensed 48px, tight line-height */}
        <span
          className="font-(--font-metrics) text-[48px] leading-[1] text-[#0D0D14] dark:text-[#F2F2F5]"
        >
          {isCompletion ? `${animatedValue}%` : animatedValue}
        </span>

        {/* Divider between value and sub-label */}
        <div className="my-3 h-px w-full bg-[#EBEBF0] dark:bg-[rgba(255,255,255,0.06)]" />

        {/* Sub-label / Progress */}
        {isCompletion ? (
          <div className="space-y-2.5">
            {/* 6px progress track */}
            <div className="h-1.5 w-full overflow-hidden rounded-[3px] bg-[#EBEBF0] dark:bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-[3px] transition-[width] duration-800 ease-out"
                style={{
                  width: `${barWidth}%`,
                  background: "linear-gradient(90deg, #4F7FFF, #6B95FF)",
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="font-(--font-data) text-[11px] text-[#6B6B7E]">
                {stats.completed} done
              </span>
              <span className="font-(--font-data) text-[11px] text-[#6B6B7E]">
                {stats.total - stats.completed} left
              </span>
            </div>
          </div>
        ) : (
          /* Sub-label with optional colored dot */
          <div className="flex items-center gap-1.5">
            {card.sub.dotColor && (
              <span
                className="inline-block h-[5px] w-[5px] shrink-0 rounded-full"
                style={{ backgroundColor: card.sub.dotColor }}
              />
            )}
            <span
              className="font-(--font-data) text-[12px]"
              style={{ color: card.sub.textColor || "#6B6B7E" }}
            >
              {card.sub.getText(stats)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────── */

export function ProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-[12px] border px-[22px] py-[20px]",
            "border-[#EBEBF0] bg-white dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111118]",
            i === 4 && "col-span-2 lg:col-span-1",
          )}
        >
          <div className="absolute top-0 left-0 h-[2px] w-full bg-[rgba(79,127,255,0.3)]" />
          <div className="space-y-3">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#6B6B7E]/10" />
            <div className="h-11 w-1/3 animate-pulse rounded-lg bg-[#6B6B7E]/10" />
            <div className="h-px w-full bg-[#EBEBF0] dark:bg-[rgba(255,255,255,0.06)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#6B6B7E]/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
