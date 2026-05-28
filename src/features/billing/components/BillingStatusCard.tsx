"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface BillingStatusCardProps {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId?: string;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function StatusBadge({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      )}
    >
      {active ? (
        <CheckCircleIcon className="h-3.5 w-3.5" />
      ) : (
        <AlertCircleIcon className="h-3.5 w-3.5" />
      )}
      {label}
    </div>
  );
}

export function BillingStatusCard({
  chargesEnabled,
  payoutsEnabled,
  accountId,
}: BillingStatusCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const createPortalLink = trpc.billing.createPortalLink.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank", "noopener,noreferrer");
      setIsLoading(false);
    },
    onError: (err) => {
      console.error("[BillingStatusCard] createPortalLink error:", err.message);
      toast.error("Failed to open Stripe dashboard. Please try again.");
      setIsLoading(false);
    },
  });

  const isFullyActive = chargesEnabled && payoutsEnabled;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
        "p-8 shadow-sm",
      )}
    >
      {/* Decorative gradient blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
      />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Stripe Connect
              </h2>
              {isFullyActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {accountId
                ? `Account ${accountId}`
                : "Your Stripe account is connected."}
            </p>
          </div>

          <button
            id="manage-payouts-btn"
            onClick={() => {
              setIsLoading(true);
              createPortalLink.mutate();
            }}
            disabled={isLoading}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
              "border border-neutral-200 bg-white text-neutral-700",
              "hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
            )}
          >
            {isLoading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent"
                aria-hidden="true"
              />
            ) : (
              <ExternalLinkIcon className="h-4 w-4 opacity-60 group-hover:opacity-100" />
            )}
            Manage payouts
          </button>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge active={chargesEnabled} label={chargesEnabled ? "Payments active" : "Payments pending"} />
          <StatusBadge active={payoutsEnabled} label={payoutsEnabled ? "Payouts active" : "Payouts pending"} />
        </div>

        {/* Info footer */}
        {!isFullyActive && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-300">
            Your Stripe account is still being verified. This usually takes 1–2 business days.
            You can check your status in the Stripe dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
