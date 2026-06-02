"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { TrendingUp, Clock, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";

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
      const duration = 900;

      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
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

/* ─── Mini Sparkline ────────────────────────────────────────────────── */

function MiniSparkline({ color, value, max }: { color: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const points = [20, 35, 15, 50, 30, 65, 40, pct].map((v, i) => `${i * 14},${80 - v}`).join(" ");

  return (
    <svg width="98" height="28" viewBox="0 0 98 80" fill="none" className="opacity-60">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="98" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={`url(#sg-${color})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Stat Card Definitions ─────────────────────────────────────────── */

type StatCardDef = {
  key: "total" | "inProgress" | "completed" | "overdue" | "completion";
  label: string;
  icon: typeof TrendingUp;
  accentColor: string;
  glowColor: string;
  subText: (stats: ProjectStats) => string;
  isCompletion?: boolean;
};

const STAT_CARDS: StatCardDef[] = [
  {
    key: "total",
    label: "Total Projects",
    icon: BarChart3,
    accentColor: "#6C63FF",
    glowColor: "rgba(108,99,255,0.25)",
    subText: (s) => `${s.total} in portfolio`,
  },
  {
    key: "inProgress",
    label: "In Progress",
    icon: TrendingUp,
    accentColor: "#00F5D4",
    glowColor: "rgba(0,245,212,0.2)",
    subText: (s) => `${s.inProgress} active now`,
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    accentColor: "#34D399",
    glowColor: "rgba(52,211,153,0.2)",
    subText: (s) => `${s.completed} delivered`,
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: AlertCircle,
    accentColor: "#FF4D6D",
    glowColor: "rgba(255,77,109,0.25)",
    subText: (s) => `${s.overdue} need attention`,
  },
  {
    key: "completion",
    label: "Completion Rate",
    icon: Clock,
    accentColor: "#F59E0B",
    glowColor: "rgba(245,158,11,0.2)",
    subText: () => "",
    isCompletion: true,
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {STAT_CARDS.map((card, idx) => (
        <StatCard
          key={card.key}
          card={card}
          rawValue={getValue(card.key)}
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
  stats,
  completionRate,
  index,
}: {
  card: StatCardDef;
  rawValue: number;
  stats: ProjectStats;
  completionRate: number;
  index: number;
}) {
  const animatedValue = useCountUp(rawValue, index * 80);
  const [barWidth, setBarWidth] = useState(0);
  const [hovered, setHovered] = useState(false);
  const Icon = card.icon;

  useEffect(() => {
    if (card.isCompletion) {
      const timeout = setTimeout(() => setBarWidth(completionRate), 500);
      return () => clearTimeout(timeout);
    }
  }, [card.isCompletion, completionRate]);

  const displayValue = card.isCompletion ? `${animatedValue}%` : animatedValue.toString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
        delay: 0.06 * index,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border cursor-default",
        "transition-all duration-300 ease-out",
        "bg-white border-black/5 shadow-sm dark:bg-white/[0.03] dark:border-white/[0.07] dark:shadow-none",
        hovered && "dark:bg-white/[0.055] bg-black/[0.02]",
        card.isCompletion && "col-span-2 lg:col-span-1",
      )}
      style={{
        borderColor: hovered ? card.accentColor + "40" : undefined,
        boxShadow: hovered
          ? `0 0 0 1px ${card.accentColor}20, 0 8px 32px ${card.glowColor}, 0 2px 8px rgba(0,0,0,0.4)`
          : undefined,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px] transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${card.accentColor}, transparent)`,
          opacity: hovered ? 1 : 0.5,
        }}
      />

      {/* Glow orb background */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-3xl transition-opacity duration-500"
        style={{
          background: card.accentColor,
          opacity: hovered ? 0.12 : 0.05,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-5">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <p
            className="text-[10px] tracking-[0.1em] uppercase text-gray-500 dark:text-[#F4F4FF]/45"
            style={{ fontFamily: "var(--font-data, monospace)" }}
          >
            {card.label}
          </p>
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-300",
              hovered ? "" : "bg-black/5 dark:bg-white/5"
            )}
            style={{
              background: hovered ? card.accentColor + "20" : undefined,
            }}
          >
            <Icon
              className={cn("h-3.5 w-3.5 transition-colors duration-300", !hovered && "text-gray-400 dark:text-[#F4F4FF]/35")}
              style={{ color: hovered ? card.accentColor : undefined }}
            />
          </div>
        </div>

        {/* Value */}
        <span
          className={cn(
            "block font-bold leading-none tabular-nums transition-colors duration-300",
            !hovered && "text-gray-900 dark:text-[#F4F4FF]"
          )}
          style={{
            fontSize: 44,
            letterSpacing: "-0.03em",
            color: hovered ? card.accentColor : undefined,
            fontFamily: "var(--font-metrics, 'Barlow Condensed', sans-serif)",
          }}
        >
          {displayValue}
        </span>

        {/* Sub text */}
        <p
          className="mt-1.5 text-[11px] text-gray-500 dark:text-[#F4F4FF]/35"
          style={{
            fontFamily: "var(--font-data, monospace)",
          }}
        >
          {card.isCompletion
            ? `${stats.completed} done / ${stats.total - stats.completed} left`
            : card.subText(stats)}
        </p>

        {/* Completion progress bar */}
        {card.isCompletion && (
          <div className="mt-4">
            <div
              className="h-[3px] w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/[0.06]"
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${barWidth}%`,
                  background: `linear-gradient(90deg, ${card.accentColor}80, ${card.accentColor})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Sparkline for non-completion cards */}
        {!card.isCompletion && (
          <div className="mt-3 -mx-1">
            <MiniSparkline color={card.accentColor} value={rawValue} max={stats.total || 1} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────── */

export function ProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-2xl border p-5",
            "bg-white border-black/5 dark:bg-white/[0.03] dark:border-white/[0.07]",
            i === 4 && "col-span-2 lg:col-span-1",
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-20 animate-pulse rounded-full bg-black/5 dark:bg-white/[0.08]" />
              <div className="h-7 w-7 animate-pulse rounded-lg bg-black/5 dark:bg-white/[0.06]" />
            </div>
            <div className="h-11 w-16 animate-pulse rounded-lg bg-black/10 dark:bg-white/[0.08]" />
            <div className="h-2 w-24 animate-pulse rounded-full bg-black/5 dark:bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}
