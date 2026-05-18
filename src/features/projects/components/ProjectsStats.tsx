"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

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
  /** Top-border accent color (only for overdue card) */
  topBorderColor?: string;
  sub: SubLabelDef;
};

const STAT_CARDS: StatCardDef[] = [
  {
    key: "total",
    label: "TOTAL PROJECTS",
    sub: { getText: (s) => `${s.total} added this month` },
  },
  {
    key: "inProgress",
    label: "IN PROGRESS",
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
    sub: { getText: (s) => `${s.completed} this month` },
  },
  {
    key: "overdue",
    label: "OVERDUE",
    topBorderColor: "#EF4444",
    sub: {
      getText: (s) => `${s.overdue} need attention`,
      dotColor: "#EF4444",
      textColor: "#EF4444",
    },
  },
  {
    key: "completion",
    label: "COMPLETION",
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
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: 0.05 * index,
      }}
      className={cn(
        "group relative overflow-hidden rounded-xl border",
        "px-[22px] py-[20px]",
        "transition-all duration-300 ease-out",
        // Light
        "bg-white border-[#EBEBF0] shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
        "hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        // Dark
        "dark:bg-white/[0.02] dark:backdrop-blur-md dark:border-white/5 dark:shadow-none",
        "dark:hover:border-white/10",
        isCompletion && "col-span-2 lg:col-span-1",
      )}
    >
      {/* Muted top-border line for overdue card */}
      {card.topBorderColor && (
        <div
          className="absolute top-0 left-0 h-[1px] w-full"
          style={{ backgroundColor: card.topBorderColor, opacity: 0.6 }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col">
        {/* Label — DM Mono */}
        <p className="font-(--font-data) mb-3 text-[11px] tracking-widest text-[#6B6B7E] dark:text-gray-400 uppercase">
          {card.label}
        </p>

        {/* Value — Barlow Condensed, huge */}
        <span
          className="font-(--font-metrics) text-[48px] leading-[1] tracking-tight text-[#0D0D14] dark:text-gray-50"
        >
          {isCompletion ? `${animatedValue}%` : animatedValue}
        </span>

        {/* Sub-label / Progress */}
        {isCompletion ? (
          <div className="mt-4 space-y-2">
            {/* Monospace progress string */}
            <p className="font-(--font-data) text-[11px] tracking-widest text-[#9B9BA8] dark:text-gray-500">
              [{generateProgressBar(completionRate)}] {stats.completed} done / {stats.total - stats.completed} left
            </p>
          </div>
        ) : (
          /* Sub-label with optional colored dot */
          <div className="mt-3 flex items-center gap-1.5">
            {card.sub.dotColor && (
              <span
                className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
                style={{ backgroundColor: card.sub.dotColor }}
              />
            )}
            <span
              className="font-(--font-data) text-[11px] tracking-widest uppercase"
              style={{ color: card.sub.textColor || "#6B7280" }}
            >
              {card.sub.getText(stats)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Progress Bar String Generator ─────────────────────────────────── */

function generateProgressBar(percent: number): string {
  const totalBlocks = 10;
  const filled = Math.round((percent / 100) * totalBlocks);
  const empty = totalBlocks - filled;
  return "█".repeat(filled) + "·".repeat(empty);
}

/* ─── Skeleton ──────────────────────────────────────────────────────── */

export function ProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-xl border px-[22px] py-[20px]",
            "bg-white border-[#EBEBF0] shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
            "dark:bg-white/[0.02] dark:backdrop-blur-md dark:border-white/5 dark:shadow-none",
            i === 4 && "col-span-2 lg:col-span-1",
          )}
        >
          <div className="space-y-3">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
            <div className="h-11 w-1/3 animate-pulse rounded-lg bg-[#EBEBF0] dark:bg-white/5" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#EBEBF0] dark:bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
