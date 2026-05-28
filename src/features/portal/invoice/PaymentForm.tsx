"use client";

import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  invoiceId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
}

// ── Amount formatter ──────────────────────────────────────────────────────────
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

// ── Stripe Elements appearance (Obsidian design system) ───────────────────────
const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#7c3aed",
    colorBackground: "#ffffff",
    colorText: "#111827",
    colorDanger: "#ef4444",
    fontFamily: "inherit",
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      fontSize: "14px",
    },
    ".Input:focus": {
      border: "1px solid #7c3aed",
      boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.1)",
    },
    ".Label": {
      fontSize: "13px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "6px",
    },
  },
};

// ── Inner form component (must be inside <Elements> provider) ─────────────────
function CheckoutForm({
  invoiceId,
  amount,
  currency,
  onSuccess,
}: {
  invoiceId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!stripe || !elements) return;

      setIsProcessing(true);
      setErrorMessage(null);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Redirect URL after payment — Stripe will append payment_intent params
          return_url: `${appUrl}/portal/invoices/${invoiceId}?payment=success`,
        },
        // Redirect only on success (card errors stay on-page)
        redirect: "if_required",
      });

      if (error) {
        // Show user-facing error message only — never the raw error object
        const message =
          error.type === "card_error" || error.type === "validation_error"
            ? (error.message ?? "Your payment could not be processed. Please check your card details.")
            : "An unexpected error occurred. Please try again.";

        setErrorMessage(message);
        setIsProcessing(false);
      } else {
        // Payment succeeded without redirect (3DS not required)
        toast.success("Payment successful! Your invoice is being updated.");
        onSuccess();
      }
    },
    [stripe, elements, invoiceId, appUrl, onSuccess],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5" id="payment-form">
      {/* Payment element — renders card, Apple Pay, Google Pay, Link etc. */}
      <PaymentElement
        id="payment-element"
        options={{
          layout: "tabs",
        }}
      />

      {/* Error banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-300"
        >
          <span aria-hidden="true" className="mt-0.5 shrink-0 text-red-500">
            ⚠
          </span>
          {errorMessage}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        id="pay-now-btn"
        disabled={!stripe || isProcessing}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5",
          "bg-violet-600 text-sm font-semibold text-white shadow-sm",
          "hover:bg-violet-700 active:bg-violet-800",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        )}
      >
        {isProcessing ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden="true"
            />
            Processing…
          </>
        ) : (
          `Pay ${formatAmount(amount, currency)}`
        )}
      </button>

      {/* Security note */}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Secured by Stripe. We never store your card details.
      </p>
    </form>
  );
}

// ── Public export — Elements provider wrapper ─────────────────────────────────
export function PaymentForm({
  clientSecret,
  publishableKey,
  invoiceId,
  amount,
  currency,
  onSuccess,
}: PaymentFormProps) {
  // Load Stripe.js lazily — only when this component mounts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripePromise = loadStripe(publishableKey);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: STRIPE_APPEARANCE,
      }}
    >
      <CheckoutForm
        invoiceId={invoiceId}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
