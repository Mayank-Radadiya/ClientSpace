// src/features/dashboard/components/DashboardPageClient.tsx
// Main client wrapper for dashboard page with data fetching and layout

"use client";

import { trpc } from "@/lib/trpc/client";
import { MetricsSection } from "./MetricsSection";
import { RecentProjectsCard } from "./RecentProjectsCard";
import { ActivityFeedCard } from "./ActivityFeedCard";

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

  const { data: recentActivity, isLoading: activityLoading } =
    trpc.dashboard.getRecentActivity.useQuery({ limit: 8 });

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

        <ActivityFeedCard
          activities={recentActivity ?? []}
          loading={activityLoading}
        />
      </div>
    </div>
  );
}
