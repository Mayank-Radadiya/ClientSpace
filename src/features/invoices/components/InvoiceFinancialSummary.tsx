"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function Sparkline({ color }: { color: string }) {
  const points = "0,20 10,18 20,22 30,12 40,15 50,5 60,8";
  return (
    <svg
      width="60"
      height="24"
      viewBox="0 0 60 24"
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />
    </svg>
  );
}

// Simple counter hook for visual effect
function useCountUp(endValueCents: number, durationMs = 600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      // ease-out-expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(endValueCents * easeProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValueCents, durationMs]);

  return value;
}

function CountUpCurrency({
  cents,
  currency,
}: {
  cents: number;
  currency: string;
}) {
  const animatedCents = useCountUp(cents);
  return <>{formatCurrency(animatedCents, currency)}</>;
}

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
      label: "TOTAL INVOICED",
      cents: totalBilled,
      colorClass: "text-[var(--inv-text-primary)]",
      lineColor: "var(--inv-accent-primary)",
      meta: `+ ${totalInvoices} invoice${totalInvoices !== 1 ? "s" : ""}`,
      accentHex: "#3B6FEF",
    },
    {
      label: "PAID",
      cents: totalPaid,
      colorClass: "text-[var(--inv-status-paid)]",
      lineColor: "var(--inv-status-paid)",
      meta: `${paidInvoices} on time`,
      accentHex: "#22C55E",
    },
    {
      label: "OUTSTANDING",
      cents: outstanding,
      colorClass: "text-[var(--inv-status-pending)]",
      lineColor: "var(--inv-status-pending)",
      meta: `${outstandingInvoices} pending`,
      accentHex: "#F59E0B",
    },
    {
      label: "OVERDUE",
      cents: overdue,
      colorClass: "text-[var(--inv-status-overdue)]",
      lineColor: "var(--inv-status-overdue)",
      meta: `${overdueInvoices} overdue`,
      accentHex: "#EF4444",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            delay: index * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="group relative overflow-hidden rounded-xl border border-(--inv-border) bg-[var(--inv-surface)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
        >
          {/* Top Line Indicator */}
          <div
            className="absolute top-0 right-0 left-0 h-[2px] opacity-70 transition-opacity group-hover:opacity-100"
            style={{ backgroundColor: item.lineColor }}
          />

          {/* Noise Texture */}
          <div className="obsidian-noise absolute inset-0 z-0" />

          <div className="relative z-10 p-5">
            <div className="flex items-center justify-between">
              <p className="font-data text-[11px] tracking-[0.08em] text-(--inv-text-secondary) uppercase">
                {item.label}
              </p>
              <Sparkline color={item.accentHex} />
            </div>

            <div
              className={cn(
                "font-metrics mt-4 text-[44px] leading-none tracking-normal",
                item.colorClass,
              )}
            >
              <CountUpCurrency cents={item.cents} currency={currency} />
            </div>

            <p className="font-data mt-3 text-[12px] text-[var(--inv-text-muted)]">
              {item.meta}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function InvoiceFinancialSummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-(--inv-border) bg-[var(--inv-surface)] p-5"
        >
          <Skeleton className="mb-4 h-3 w-24 opacity-20" />
          <Skeleton className="mb-3 h-10 w-32 opacity-20" />
          <Skeleton className="h-3 w-20 opacity-20" />
        </div>
      ))}
    </div>
  );
}
