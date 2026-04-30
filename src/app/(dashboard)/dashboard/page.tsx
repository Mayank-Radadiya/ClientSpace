import { StatsCards } from "@/features/analytics/components/StatsCards";
import { RevenueChart } from "@/features/analytics/components/RevenueChart";
import { RecentActivityFeed } from "@/features/analytics/components/RecentActivityFeed";

export const metadata = { title: "Dashboard" };

/**
 * Dashboard Page — Server component is now a thin shell.
 *
 * Auth is handled by the (dashboard) layout. Data fetching is handled
 * entirely by the client components via React Query cache.
 *
 * First visit: client components show skeleton → fetch from API → cache data.
 * Subsequent visits: client components render instantly from cache.
 */
export default async function DashboardPage() {
  return (
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
        <RecentActivityFeed />
      </div>
    </div>
  );
}
