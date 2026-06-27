"use client";

import Link from "next/link";
import { FolderKanban, FileText, CheckCircle2, DollarSign } from "lucide-react";

interface OverviewCards {
  activeProjects: number;
  pendingInvoices: number;
  completedMilestones: number;
  totalEarned: number;
}

function formatCents(cents: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(0)}`;
  }
}

const cards: {
  label: string;
  key: keyof OverviewCards;
  icon: React.ComponentType<{ className?: string }>;
  format: (v: number) => string;
  href: string;
}[] = [
  {
    label: "Active Projects",
    key: "activeProjects",
    icon: FolderKanban,
    format: String,
    href: "/portal/projects",
  },
  {
    label: "Pending Invoices",
    key: "pendingInvoices",
    icon: FileText,
    format: String,
    href: "/portal/invoices",
  },
  {
    label: "Milestones Done",
    key: "completedMilestones",
    icon: CheckCircle2,
    format: String,
    href: "/portal/projects",
  },
  {
    label: "Total Paid",
    key: "totalEarned",
    icon: DollarSign,
    format: formatCents,
    href: "/portal/invoices",
  },
];

export function PortalDashboardClient({
  cards: cardValues,
}: {
  cards: OverviewCards;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.key}
            href={card.href}
            className="bg-card hover:border-primary/40 group rounded-xl border p-4 transition-colors"
          >
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
              <Icon className="text-primary h-4 w-4" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
              {card.format(cardValues[card.key])}
            </p>
            <p className="text-muted-foreground text-sm">{card.label}</p>
          </Link>
        );
      })}
    </div>
  );
}
