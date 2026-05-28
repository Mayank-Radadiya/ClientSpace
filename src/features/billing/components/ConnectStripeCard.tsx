"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

// ── Zap icon (inline SVG, no icon library dep) ───────────────────────────────
function ZapIcon({ className }: { className?: string }) {
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
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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

export function ConnectStripeCard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const createConnectLink = trpc.billing.createConnectLink.useMutation({
    onSuccess: ({ url }) => {
      router.push(url);
    },
    onError: (err) => {
      console.error("[ConnectStripeCard] createConnectLink error:", err.message);
      toast.error("Failed to start Stripe onboarding. Please try again.");
      setIsLoading(false);
    },
  });

  function handleConnect() {
    setIsLoading(true);
    createConnectLink.mutate();
  }

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
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {/* Icon container */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
          <ZapIcon className="h-7 w-7 text-violet-600 dark:text-violet-400" />
        </div>

        <div className="flex-1 space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Accept payments from clients
          </h2>
          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Connect your Stripe account to let clients pay invoices directly.
            Funds land in your bank within 2 business days. Powered by{" "}
            <a
              href="https://stripe.com/connect"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
            >
              Stripe Connect
            </a>
            .
          </p>
        </div>

        <button
          id="connect-stripe-btn"
          onClick={handleConnect}
          disabled={isLoading}
          className={cn(
            "group flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold",
            "bg-violet-600 text-white shadow-sm",
            "hover:bg-violet-700 active:bg-violet-800",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
          )}
        >
          {isLoading ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Redirecting…
            </>
          ) : (
            <>
              Connect Stripe
              <ExternalLinkIcon className="h-4 w-4 opacity-70 transition-opacity group-hover:opacity-100" />
            </>
          )}
        </button>
      </div>

      {/* Feature list */}
      <div className="relative mt-8 grid grid-cols-1 gap-3 border-t border-neutral-100 pt-6 dark:border-neutral-800 sm:grid-cols-3">
        {[
          { label: "Instant setup", desc: "No bank forms to fill manually" },
          { label: "Multiple payment methods", desc: "Card, Apple Pay, bank transfer" },
          { label: "Automatic reconciliation", desc: "Invoice status updates automatically" },
        ].map(({ label, desc }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {label}
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
