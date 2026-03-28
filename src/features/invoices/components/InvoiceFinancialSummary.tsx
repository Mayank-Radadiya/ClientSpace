// src/features/invoices/components/InvoiceFinancialSummary.tsx
// Financial summary cards for project invoices - shows total billed, paid, outstanding

"use client";

import { motion } from "framer-motion";
import { DollarSign, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceFinancialSummaryProps {
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
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
  currency = "USD",
  loading = false,
}: InvoiceFinancialSummaryProps) {
  if (loading) {
    return <InvoiceFinancialSummarySkeleton />;
  }

  const summaryItems = [
    {
      label: "Total Billed",
      value: formatCurrency(totalBilled, currency),
      icon: DollarSign,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Paid",
      value: formatCurrency(totalPaid, currency),
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstanding, currency),
      icon: Clock,
      color:
        outstanding > 0
          ? "text-orange-600 dark:text-orange-400"
          : "text-muted-foreground",
      bgColor:
        outstanding > 0 ? "bg-orange-50 dark:bg-orange-950/30" : "bg-muted/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", item.bgColor)}>
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-xs font-medium">
                  {item.label}
                </p>
                <p className="font-brand mt-0.5 text-lg font-semibold">
                  {item.value}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function InvoiceFinancialSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
