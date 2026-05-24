import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";
import { StatsCards } from "@/features/analytics/components/StatsCards";
import { RevenueChart } from "@/features/analytics/components/RevenueChart";
import { RecentActivityFeed } from "@/features/analytics/components/RecentActivityFeed";
import { getDashboardStatsCached, getRevenueChartCached } from "@/features/analytics/server/queries";
import { getActivityLogsCached } from "@/features/activity/server/queries";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) {
    redirect("/onboarding");
  }

  // Parallel prefetch on server from cached data layer
  const [stats, revenue, activity] = await Promise.all([
    getDashboardStatsCached(ctx.orgId, ctx.userId),
    getRevenueChartCached(ctx.orgId, ctx.userId),
    getActivityLogsCached(ctx.orgId, ctx.userId, null, 10),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your business at a glance.
        </p>
      </div>

      <StatsCards initialData={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart initialData={revenue} />
        <RecentActivityFeed initialData={activity} />
      </div>
    </div>
  );
}
