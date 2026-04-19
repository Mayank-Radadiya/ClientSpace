"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/features/activity/components/ActivityTimeline";

type ActivityRow = RouterOutputs["activity"]["getActivityLogs"]["logs"][number];

interface RecentActivityFeedProps {
  initialLogs: ActivityRow[];
}

export function RecentActivityFeed({ initialLogs }: RecentActivityFeedProps) {
  const { data } = trpc.activity.getActivityLogs.useQuery(
    { limit: 10 },
    {
      initialData: {
        logs: initialLogs,
        total: initialLogs.length,
      },
      staleTime: 30_000,
    },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityTimeline items={data.logs} showProject maxHeight="360px" />
      </CardContent>
    </Card>
  );
}
