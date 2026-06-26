import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";
import { StatsCards } from "@/features/analytics/components/StatsCards";
import { RevenueChart } from "@/features/analytics/components/RevenueChart";
import { RecentActivityFeed } from "@/features/analytics/components/RecentActivityFeed";
import {
  getDashboardStatsCached,
  getRevenueChartCached,
} from "@/features/analytics/server/queries";
import { getActivityLogsCached } from "@/features/activity/server/queries";
import { ProjectHealthSection } from "@/features/dashboard/components/ProjectHealthSection";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) {
    redirect("/onboarding");
  }

  const [stats, revenue, activity] = await Promise.all([
    getDashboardStatsCached(ctx.orgId, ctx.userId),
    getRevenueChartCached(ctx.orgId, ctx.userId),
    getActivityLogsCached(ctx.orgId, ctx.userId, null, 10),
  ]);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="animate-page-enter flex flex-col gap-6 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{dateStr}</p>
        </div>
        <QuickActions />
      </div>

      {/* AI Project Health — above the fold */}
      <ProjectHealthSection />

      {/* Metrics */}
      <Suspense fallback={<DashboardSkeleton />}>
        <StatsCards initialData={stats} />
      </Suspense>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<div className="h-64 rounded-xl bg-muted animate-pulse" />}>
          <RevenueChart initialData={revenue} />
        </Suspense>
        <Suspense fallback={<div className="h-64 rounded-xl bg-muted animate-pulse" />}>
          <RecentActivityFeed initialData={activity} />
        </Suspense>
      </div>
    </main>
  );
}
