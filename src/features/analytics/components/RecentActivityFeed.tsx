"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityTimeline } from "@/features/activity/components/ActivityTimeline";

export function RecentActivityFeed({ initialData }: { initialData?: any }) {
  const { data, isLoading } = trpc.activity.getActivityLogs.useQuery(
    { limit: 10 },
    {
      staleTime: 30_000, // Activity data: refresh every 30s
      initialData,
    },
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityTimeline
          items={data?.logs ?? []}
          showProject
          maxHeight="360px"
        />
      </CardContent>
    </Card>
  );
}
