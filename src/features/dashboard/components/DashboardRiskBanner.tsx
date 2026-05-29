"use client";

// src/features/dashboard/components/DashboardRiskBanner.tsx
// Individual risk card for a single project's AI health assessment.
// Displayed inside ProjectHealthSection on the agency dashboard.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  X,
  Clock,
  MessageSquare,
  RotateCcw,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardRiskBannerProps {
  id: string;
  projectId: string;
  riskScore: "medium" | "high" | "critical";
  summary: string;
  projectName: string;
  clientName: string;
  overdueCount: number;
  unresolvedAnnotations: number;
  openChangeRequests: number;
  generatedAt: Date;
  onRefresh?: (projectId: string) => void;
  isRefreshing?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const DISMISS_EXPIRY_HOURS = 24;

function getDismissKey(id: string) {
  return `dismissed_health_${id}`;
}

function isDismissed(id: string): boolean {
  try {
    const raw = localStorage.getItem(getDismissKey(id));
    if (!raw) return false;
    const expiry = Number(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(getDismissKey(id));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function dismiss(id: string) {
  try {
    const expiry = Date.now() + DISMISS_EXPIRY_HOURS * 60 * 60 * 1000;
    localStorage.setItem(getDismissKey(id), String(expiry));
  } catch {
    // localStorage may not be available
  }
}

// ─── Styling config ──────────────────────────────────────────────────────────

const riskConfig = {
  critical: {
    icon: AlertOctagon,
    label: "Critical",
    border: "border-red-300 dark:border-red-700/50",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-900 dark:text-red-200",
    badge: "bg-red-600 text-white",
    accent: "text-red-600 dark:text-red-400",
  },
  high: {
    icon: AlertTriangle,
    label: "High Risk",
    border: "border-orange-300 dark:border-orange-700/50",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-900 dark:text-orange-200",
    badge: "bg-orange-500 text-white",
    accent: "text-orange-600 dark:text-orange-400",
  },
  medium: {
    icon: AlertCircle,
    label: "Medium Risk",
    border: "border-amber-300 dark:border-amber-700/50",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-900 dark:text-amber-200",
    badge: "bg-amber-500 text-white",
    accent: "text-amber-600 dark:text-amber-400",
  },
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardRiskBanner({
  id,
  projectId,
  riskScore,
  summary,
  projectName,
  clientName,
  overdueCount,
  unresolvedAnnotations,
  openChangeRequests,
  generatedAt,
  onRefresh,
  isRefreshing,
}: DashboardRiskBannerProps) {
  const [dismissed, setDismissedState] = useState(true); // Start hidden (SSR-safe)

  useEffect(() => {
    setDismissedState(isDismissed(id));
  }, [id]);

  if (dismissed) return null;

  const config = riskConfig[riskScore];
  const Icon = config.icon;

  const handleDismiss = () => {
    dismiss(id);
    setDismissedState(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={id}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={[
          "relative rounded-lg border p-4",
          config.border,
          config.bg,
          config.text,
        ].join(" ")}
        role="alert"
        aria-live="polite"
        id={`health-banner-${projectId}`}
      >
        {/* ── Top row: Badge + Project link + Dismiss ──────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Risk badge */}
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                config.badge,
              ].join(" ")}
            >
              <Icon size={12} />
              {config.label}
            </span>

            {/* Project link */}
            <Link
              href={`/projects/${projectId}`}
              className="group flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {projectName}
              <ExternalLink
                size={12}
                className="opacity-0 transition-opacity group-hover:opacity-70"
              />
            </Link>

            <span className="text-xs opacity-60">· {clientName}</span>
          </div>

          <button
            onClick={handleDismiss}
            className="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            aria-label="Dismiss health warning for 24 hours"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── AI Summary ──────────────────────────────────────────── */}
        <p className="mt-2 text-sm leading-relaxed opacity-90">{summary}</p>

        {/* ── Micro stats + Last updated ──────────────────────────── */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          {overdueCount > 0 && (
            <span className={`flex items-center gap-1 ${config.accent}`}>
              <Clock size={12} />
              {overdueCount} overdue
            </span>
          )}
          {unresolvedAnnotations > 0 && (
            <span className="flex items-center gap-1 opacity-70">
              <MessageSquare size={12} />
              {unresolvedAnnotations} unresolved
            </span>
          )}
          {openChangeRequests > 0 && (
            <span className="flex items-center gap-1 opacity-70">
              <RotateCcw size={12} />
              {openChangeRequests} changes requested
            </span>
          )}

          <span className="ml-auto flex items-center gap-1 opacity-50">
            Updated {relativeTime(generatedAt)}
          </span>

          {onRefresh && (
            <button
              onClick={() => onRefresh(projectId)}
              disabled={isRefreshing}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 opacity-60 transition-opacity hover:opacity-100 disabled:opacity-30"
              aria-label={`Refresh health analysis for ${projectName}`}
            >
              <RefreshCw
                size={12}
                className={isRefreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
