// src/features/dashboard/components/MetricsSection.tsx
// Dashboard metrics overview - displays key stats in a grid

"use client";

import { DollarSign, FolderKanban, FileText, Upload } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricsSectionProps {
  metrics: {
    revenue: {
      total: number;
      formatted: string;
      period: string;
    };
    projects: {
      total: number;
      active: number;
    };
    invoices: {
      pendingCount: number;
      pendingAmount: number;
      pendingAmountFormatted: string;
    };
    files: {
      total: number;
      thisMonth: number;
    };
  };
  loading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MetricsSection({
  metrics,
  loading = false,
}: MetricsSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Revenue"
        value={metrics.revenue.formatted}
        description="Current month"
        icon={DollarSign}
        loading={loading}
      />

      <StatCard
        title="Active Projects"
        value={metrics.projects.active}
        description={`${metrics.projects.total} total projects`}
        icon={FolderKanban}
        loading={loading}
      />

      <StatCard
        title="Pending Invoices"
        value={metrics.invoices.pendingCount}
        description={metrics.invoices.pendingAmountFormatted}
        trend={metrics.invoices.pendingCount > 0 ? "neutral" : "up"}
        icon={FileText}
        loading={loading}
      />

      <StatCard
        title="Files"
        value={metrics.files.total}
        description={`${metrics.files.thisMonth} uploaded this month`}
        icon={Upload}
        loading={loading}
      />
    </div>
  );
}
