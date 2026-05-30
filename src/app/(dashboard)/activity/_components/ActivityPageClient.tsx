"use client";

// src/app/(dashboard)/activity/_components/ActivityPageClient.tsx
// Full-page activity log view with paginated feed and actor/project details.

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { ActivityTimeline } from "@/features/activity/components/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";

// FIX: Activity page was a stub with "Coming soon" — now renders real activity logs

export function ActivityPageClient() {
  const { data, isLoading, error, refetch, isRefetching } =
    trpc.activity.getActivityLogs.useQuery({ limit: 50 });

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Failed to load activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">{error.message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = data?.logs ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {data?.total ?? items.length} event{items.length !== 1 ? "s" : ""} across your workspace
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <ActivityTimeline items={items as any} showProject maxHeight="none" />
    </div>
  );
}
