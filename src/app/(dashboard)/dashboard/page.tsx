import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { trpc } from "@/lib/trpc/client";
import { getQueryClient } from "@/lib/trpc/query-client";
import { getServerCaller } from "@/lib/trpc/server";
import { StatsCards } from "@/features/analytics/components/StatsCards";
import { RevenueChart } from "@/features/analytics/components/RevenueChart";
import { RecentActivityFeed } from "@/features/analytics/components/RecentActivityFeed";

export const metadata = { title: "Dashboard — ClientSpace" };

export default async function DashboardPage() {
  const caller = await getServerCaller();
  if (!caller) redirect("/login");

  const queryClient = getQueryClient();

  const [stats, revenueChart, activityData] = await Promise.all([
    caller.analytics.getDashboardStats(),
    caller.analytics.getRevenueChart(),
    caller.activity.getActivityLogs({ limit: 10 }),
  ]);

  queryClient.setQueryData(
    getQueryKey(trpc.analytics.getDashboardStats, undefined, "query"),
    stats,
  );

  queryClient.setQueryData(
    getQueryKey(trpc.analytics.getRevenueChart, undefined, "query"),
    revenueChart,
  );

  queryClient.setQueryData(
    getQueryKey(trpc.activity.getActivityLogs, { limit: 10 }, "query"),
    activityData,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your business at a glance.
          </p>
        </div>

        <StatsCards />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart />
          <RecentActivityFeed initialLogs={activityData.logs} />
        </div>
      </div>
    </HydrationBoundary>
  );
}
