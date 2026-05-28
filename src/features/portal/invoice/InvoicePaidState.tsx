"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface InvoicePaidStateProps {
  invoiceNumber: number;
  amountCents: number;
  currency: string;
  paidAt: Date | string | null;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function formatAmount(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function InvoicePaidState({
  invoiceNumber,
  amountCents,
  currency,
  paidAt,
}: InvoicePaidStateProps) {
  const paidDate = paidAt ? new Date(paidAt) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 rounded-2xl",
        "border border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20",
        "px-8 py-12 text-center",
      )}
    >
      {/* Animated checkmark circle */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-100/50 dark:bg-emerald-900/30 dark:ring-emerald-900/20">
        <CheckIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Payment received
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Invoice #{invoiceNumber} has been paid in full.
        </p>
      </div>

      {/* Amount */}
      <div className="rounded-xl border border-emerald-200 bg-white px-6 py-4 dark:border-emerald-800/30 dark:bg-neutral-900">
        <p className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {formatAmount(amountCents, currency)}
        </p>
        {paidDate && (
          <p className="mt-1 text-sm text-neutral-400">
            Paid on {format(paidDate, "MMMM d, yyyy")}
          </p>
        )}
      </div>

      <p className="max-w-sm text-xs text-neutral-400">
        A receipt has been sent to your email. Keep it for your records.
      </p>
    </div>
  );
}
