// src/features/invoices/components/InvoiceFinancialSummary.tsx
// Financial summary cards for project invoices - shows total billed, paid, outstanding, overdue

"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceFinancialSummaryProps {
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  overdue?: number;
  totalInvoices?: number;
  paidInvoices?: number;
  outstandingInvoices?: number;
  overdueInvoices?: number;
  currency?: string;
  loading?: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoiceFinancialSummary({
  totalBilled,
  totalPaid,
  outstanding,
  overdue = 0,
  totalInvoices = 0,
  paidInvoices = 0,
  outstandingInvoices = 0,
  overdueInvoices = 0,
  currency = "USD",
  loading = false,
}: InvoiceFinancialSummaryProps) {
  if (loading) {
    return <InvoiceFinancialSummarySkeleton />;
  }

  const summaryItems = [
    {
      label: "Total invoiced",
      value: formatCurrency(totalBilled, currency),
      color: "text-foreground",
      meta: `+ ${totalInvoices} invoices`,
      metaColor: "text-muted-foreground",
    },
    {
      label: "Paid",
      value: formatCurrency(totalPaid, currency),
      color: "text-emerald-600 dark:text-emerald-500",
      meta: `${paidInvoices} invoices · on time`,
      metaColor: "text-muted-foreground",
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstanding, currency),
      color: "text-amber-600 dark:text-amber-500",
      meta: `${outstandingInvoices} invoices pending`,
      metaColor: "text-muted-foreground",
    },
    {
      label: "Overdue",
      value: formatCurrency(overdue, currency),
      color: "text-rose-600 dark:text-rose-500",
      meta: `${overdueInvoices} invoices · action needed`,
      metaColor: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
        >
          <Card className="p-5 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-muted-foreground text-sm font-medium">
              {item.label}
            </p>
            <div
              className={cn(
                "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
                item.color,
              )}
            >
              {item.value}
            </div>
            <p className={cn("mt-1 text-xs", item.metaColor)}>{item.meta}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function InvoiceFinancialSummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-5 shadow-sm">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </Card>
      ))}
    </div>
  );
}
