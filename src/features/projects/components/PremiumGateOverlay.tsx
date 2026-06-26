"use client";

import { motion } from "motion/react";
import { Lock, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumGateOverlayProps {
  feature: string;
  limit?: number;
  current?: number;
  className?: string;
}

export function PremiumGateOverlay({ feature, limit, current, className }: PremiumGateOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl",
        "bg-gradient-to-br from-violet-50/90 to-indigo-50/90 dark:from-violet-950/40 dark:to-indigo-950/40",
        "border border-violet-200/60 dark:border-violet-700/30 backdrop-blur-sm",
        "p-10 text-center",
        className
      )}
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100/30 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
      </div>

      <div className="relative z-10 space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/30">
          <Lock className="h-7 w-7 text-white" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {current !== undefined && limit !== undefined
              ? `${feature} limit reached (${current}/${limit})`
              : `Unlock ${feature}`}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
            Upgrade to Pro to unlock unlimited {feature.toLowerCase()} and advanced features.
          </p>
        </div>

        <a
          href="/settings/billing"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white",
            "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
            "shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30",
            "hover:-translate-y-0.5 active:translate-y-0"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Upgrade to Pro
        </a>
      </div>
    </motion.div>
  );
}
