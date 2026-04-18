// src/features/dashboard/components/DashboardPageClient.tsx
// Main client wrapper for dashboard page with data fetching and layout

"use client";

import { trpc } from "@/lib/trpc/client";
import { MetricsSection } from "./MetricsSection";
import { RecentProjectsCard } from "./RecentProjectsCard";
import { ActivityTimeline } from "@/features/activity/components/ActivityTimeline";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardPageClientProps {
  userName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardPageClient({ userName }: DashboardPageClientProps) {
  // Fetch dashboard data
  const { data: metrics, isLoading: metricsLoading } =
    trpc.dashboard.getMetrics.useQuery();

  const { data: recentProjects, isLoading: projectsLoading } =
    trpc.dashboard.getRecentProjects.useQuery();

  const { data: dashboardActivity, isLoading: activityLoading } =
    trpc.activity.dashboard.useQuery({ limit: 20 });

  // Default data for loading state
  const defaultMetrics = {
    revenue: { total: 0, formatted: "$0.00", period: "current_month" },
    projects: { total: 0, active: 0 },
    invoices: {
      pendingCount: 0,
      pendingAmount: 0,
      pendingAmountFormatted: "$0.00",
    },
    files: { total: 0, thisMonth: 0 },
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div>
        <h1 className="font-brand text-foreground text-3xl font-semibold tracking-tight">
          Welcome back, {userName.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s what&apos;s happening with your projects today
        </p>
      </div>

      {/* ── Metrics Grid ──────────────────────────────────────── */}
      <MetricsSection
        metrics={metrics ?? defaultMetrics}
        loading={metricsLoading}
      />

      {/* ── Two Column Layout ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentProjectsCard
          projects={recentProjects ?? []}
          loading={projectsLoading}
        />

        <section
          aria-labelledby="recent-activity-heading"
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 id="recent-activity-heading" className="text-lg font-semibold">
              Recent Activity
            </h2>
            <span className="text-muted-foreground text-xs">
              Last 20 events across all projects
            </span>
          </div>
          <ActivityTimeline
            items={activityLoading ? [] : (dashboardActivity ?? [])}
            showProject
            maxHeight="360px"
          />
        </section>
      </div>
    </div>
  );
}
