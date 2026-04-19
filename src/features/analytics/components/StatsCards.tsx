"use client";

import { BriefcaseBusiness, DollarSign, ReceiptText, Users } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { StatCard, StatCardSkeleton } from "@/components/ui/stat-card";

function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function StatsCards() {
  const { data, isLoading } = trpc.analytics.getDashboardStats.useQuery();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const revenueValue =
    data.revenueTotalCents > 0
      ? formatCents(data.revenueTotalCents)
      : "No revenue yet";

  const outstandingValue =
    data.outstandingCents > 0
      ? formatCents(data.outstandingCents)
      : "Nothing outstanding";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={revenueValue}
        description="Paid invoices"
        icon={DollarSign}
      />
      <StatCard
        title="Outstanding"
        value={outstandingValue}
        description="Draft + sent invoices"
        icon={ReceiptText}
      />
      <StatCard
        title="Active Projects"
        value={data.activeProjects}
        description="Non-archived projects"
        icon={BriefcaseBusiness}
      />
      <StatCard
        title="Active Clients"
        value={data.activeClients}
        description="Current organization clients"
        icon={Users}
      />
    </div>
  );
}
