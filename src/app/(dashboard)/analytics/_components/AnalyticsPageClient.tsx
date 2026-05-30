"use client";

// src/app/(dashboard)/analytics/_components/AnalyticsPageClient.tsx
// Analytics dashboard — aggregated stats, revenue chart, and project health overview.

import { RevenueChart } from "@/features/analytics/components/RevenueChart";
import { StatsCards } from "@/features/analytics/components/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Loader2 } from "lucide-react";

// FIX: Analytics page was empty — now renders real stats and revenue chart from existing tRPC procedures

export function AnalyticsPageClient() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Metrics and performance across your workspace
          </p>
        </div>
      </div>

      <StatsCards />
      <RevenueChart />
    </div>
  );
}
