"use client";

// src/features/dashboard/components/ProjectHealthSection.tsx
// Collapsible section on the dashboard that displays AI-generated health banners.
// Calls trpc.projects.getHealthSummaries and renders DashboardRiskBanner cards.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import {
  DashboardRiskBanner,
  type DashboardRiskBannerProps,
} from "./DashboardRiskBanner";

export function ProjectHealthSection() {
  const [collapsed, setCollapsed] = useState(false);
  const [refreshingProjects, setRefreshingProjects] = useState<Set<string>>(
    new Set(),
  );

  const {
    data: healthSummaries,
    isLoading,
    error,
  } = trpc.projects.getHealthSummaries.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 min
  });

  const triggerMutation = trpc.projects.triggerHealthAnalysis.useMutation({
    onMutate: ({ projectId }) => {
      setRefreshingProjects((prev) => new Set([...prev, projectId]));
    },
    onSettled: (_, __, { projectId }) => {
      // Remove from refreshing set after a delay (Inngest processes async)
      setTimeout(() => {
        setRefreshingProjects((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      }, 15_000); // 15s visual feedback
    },
  });

  const handleRefresh = useCallback(
    (projectId: string) => {
      triggerMutation.mutate({ projectId });
    },
    [triggerMutation],
  );

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700/50 dark:bg-zinc-900/30 dark:text-zinc-400">
        <Loader2 size={14} className="animate-spin" />
        Loading project health…
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return null; // Silent fail — don't break the dashboard
  }

  const summaries = healthSummaries ?? [];

  // ── All clear ──────────────────────────────────────────────
  if (summaries.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-400">
        <ShieldCheck size={16} />
        All projects on track — no health warnings detected.
      </div>
    );
  }

  // ── Render banners ─────────────────────────────────────────
  const criticalCount = summaries.filter(
    (s) => s.riskScore === "critical",
  ).length;
  const highCount = summaries.filter((s) => s.riskScore === "high").length;

  const sectionLabel = [
    criticalCount > 0 ? `${criticalCount} critical` : "",
    highCount > 0 ? `${highCount} high risk` : "",
    summaries.length > criticalCount + highCount
      ? `${summaries.length - criticalCount - highCount} medium`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-2">
      {/* ── Section header ──────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="group flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
        aria-expanded={!collapsed}
        aria-controls="health-banners"
      >
        <Shield size={14} className="text-amber-500" />
        <span>
          Project Health{" "}
          <span className="text-muted-foreground font-normal">
            — {sectionLabel}
          </span>
        </span>
        {collapsed ? (
          <ChevronDown size={14} className="ml-auto opacity-50" />
        ) : (
          <ChevronUp size={14} className="ml-auto opacity-50" />
        )}
      </button>

      {/* ── Banner cards ────────────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            id="health-banners"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="space-y-3 overflow-hidden"
          >
            {summaries.map((s) => (
              <DashboardRiskBanner
                key={s.id}
                id={s.id}
                projectId={s.projectId}
                riskScore={s.riskScore}
                summary={s.summary}
                projectName={s.projectName}
                clientName={s.clientName}
                overdueCount={s.overdueCount}
                unresolvedAnnotations={s.unresolvedAnnotations}
                openChangeRequests={s.openChangeRequests}
                generatedAt={new Date(s.generatedAt)}
                onRefresh={handleRefresh}
                isRefreshing={refreshingProjects.has(s.projectId)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
