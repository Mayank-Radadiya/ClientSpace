"use client";

import { useState } from "react";
import { AlertTriangle, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanLimitBannerProps {
  current: number;
  limit: number;
  feature: string;
  className?: string;
}

export function PlanLimitBanner({ current, limit, feature, className }: PlanLimitBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const percentage = (current / limit) * 100;

  if (dismissed || percentage < 80) return null;

  const isAtLimit = current >= limit;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
        isAtLimit
          ? "bg-red-50 border border-red-200/80 dark:bg-red-950/30 dark:border-red-800/40"
          : "bg-amber-50 border border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-800/40",
        className
      )}
    >
      <AlertTriangle
        className={cn("h-4 w-4 shrink-0", isAtLimit ? "text-red-500" : "text-amber-500")}
      />
      <span
        className={cn(
          "flex-1 font-medium",
          isAtLimit ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
        )}
      >
        {isAtLimit
          ? `${feature} limit reached. Upgrade to add more.`
          : `${current} of ${limit} ${feature} used. Upgrade soon.`}
      </span>
      <a
        href="/settings/billing"
        className={cn(
          "flex items-center gap-1 text-xs font-semibold hover:underline shrink-0",
          isAtLimit ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
        )}
      >
        <Sparkles className="h-3 w-3" />
        Upgrade
      </a>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
