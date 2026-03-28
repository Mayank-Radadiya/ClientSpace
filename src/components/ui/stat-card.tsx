// src/components/ui/stat-card.tsx
// Reusable metric/stat card component for dashboard KPIs

"use client";

import { motion } from "framer-motion";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
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
  loading?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  title,
  value,
  description,
  change,
  trend = "neutral",
  icon: Icon,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className={cn("transition-transform", className)}
    >
      <Card className="bg-card/50 border-border/50 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="font-brand text-foreground text-2xl font-semibold tracking-tight">
                {value}
              </h3>
              {change && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    trend === "up" && "text-green-600 dark:text-green-400",
                    trend === "down" && "text-red-600 dark:text-red-400",
                    trend === "neutral" &&
                      "text-muted-foreground dark:text-muted-foreground",
                  )}
                >
                  {trend === "up" && <TrendingUp className="h-3 w-3" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3" />}
                  {change}
                </span>
              )}
            </div>
            {description && (
              <p className="text-muted-foreground mt-1 text-xs">
                {description}
              </p>
            )}
          </div>
          {Icon && (
            <div className="bg-primary/10 text-primary rounded-lg p-2.5">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </Card>
  );
}
