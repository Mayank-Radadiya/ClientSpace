"use client";
// src/features/projects/components/RiskBanner.tsx
// Conditional risk banner above the tab bar.
// Dismissed state persists in sessionStorage per projectId.
// Fix 12: Tailwind semantic classes only.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, X } from "lucide-react";
import type { RiskLevel } from "./types";

interface RiskBannerProps {
  riskLevel: RiskLevel;
  milestonesAtRisk: number;
  deadline: string;
  projectId: string;
}

export function RiskBanner({ riskLevel, milestonesAtRisk, deadline, projectId }: RiskBannerProps) {
  const storageKey = `dismissed_risk_${projectId}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check dismissal after mount (SSR-safe)
    setDismissed(sessionStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  if (riskLevel === "low" || dismissed) return null;

  const isHigh = riskLevel === "high";
  const deadlineLabel = new Date(deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const message = isHigh
    ? `At current pace, ${milestonesAtRisk} milestone${milestonesAtRisk !== 1 ? "s" : ""} will miss the ${deadlineLabel} deadline.`
    : `This project is behind schedule. ${milestonesAtRisk} milestone${milestonesAtRisk !== 1 ? "s" : ""} are at risk.`;

  const handleDismiss = () => {
    sessionStorage.setItem(storageKey, "1");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="risk-banner"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={[
          "flex items-center justify-between gap-3 border px-6 py-2.5",
          isHigh
            ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300"
            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300",
        ].join(" ")}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {isHigh ? <AlertTriangle size={15} /> : <AlertCircle size={15} />}
          {message}
        </div>
        <button
          onClick={handleDismiss}
          className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Dismiss risk warning"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
