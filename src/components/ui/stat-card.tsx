// src/components/ui/stat-card.tsx
// Reusable metric/stat card component for dashboard KPIs

"use client";

import { motion } from "motion/react";
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: string;
  trend?: TrendDirection;
  icon?: LucideIcon;
  iconColor?: string;
  loading?: boolean;
  className?: string;
  index?: number;
}

// ─── Gradient Map ──────────────────────────────────────────────────────────────

const GRADIENT_MAP: Record<string, string> = {
  violet: "from-violet-500 to-indigo-600",
  teal: "from-teal-400 to-emerald-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-pink-600",
  blue: "from-blue-500 to-cyan-500",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  title,
  value,
  description,
  change,
  trend = "neutral",
  icon: Icon,
  iconColor = "violet",
  loading = false,
  className,
  index = 0,
}: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton className={className} />;
  }

  const gradient = GRADIENT_MAP[iconColor] ?? GRADIENT_MAP.violet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.07,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn("group", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-6",
          "bg-white dark:bg-neutral-900",
          "border-neutral-100 dark:border-neutral-800",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_4px_16px_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),_0_4px_16px_rgba(0,0,0,0.2)]",
          "transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
        )}
      >
        {/* Subtle top gradient line */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-60",
            gradient,
          )}
        />

        {/* Background glow on hover */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--primary) 8%, transparent) 0%, transparent 60%)`,
          }}
        />

        <div className="relative flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
              {title}
            </p>
            <div className="mt-3 flex items-baseline gap-2.5">
              <h3 className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums dark:text-neutral-50">
                {value}
              </h3>
              {change && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                    trend === "up" &&
                      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
                    trend === "down" &&
                      "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
                    trend === "neutral" &&
                      "bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
                  )}
                >
                  {trend === "up" && <TrendingUp className="h-2.5 w-2.5" />}
                  {trend === "down" && <TrendingDown className="h-2.5 w-2.5" />}
                  {trend === "neutral" && <Minus className="h-2.5 w-2.5" />}
                  {change}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                {description}
              </p>
            )}
          </div>

          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                "bg-gradient-to-br shadow-md",
                gradient,
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6",
        "border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-2.5 w-36 rounded-full" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}
