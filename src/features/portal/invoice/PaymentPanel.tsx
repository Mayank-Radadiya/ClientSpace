"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { PaymentForm } from "@/features/portal/invoice/PaymentForm";
import { cn } from "@/lib/utils";

interface PaymentPanelProps {
  invoiceId: string;
  amountCents: number;
  currency: string;
}

export function PaymentPanel({ invoiceId, amountCents, currency }: PaymentPanelProps) {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    publishableKey: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  const createIntent = trpc.portal.createPaymentIntent.useMutation({
    onSuccess: (data) => setPaymentData(data),
    onError: (err) => {
      console.error("[PaymentPanel] createPaymentIntent error:", err.message);
    },
  });

  if (isPaid) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800/30 dark:bg-emerald-950/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Payment complete</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Refreshing invoice status…</p>
      </div>
    );
  }

  if (paymentData) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Pay now</h3>
        <PaymentForm
          clientSecret={paymentData.clientSecret}
          publishableKey={paymentData.publishableKey}
          invoiceId={invoiceId}
          amount={paymentData.amount}
          currency={paymentData.currency}
          onSuccess={() => {
            setIsPaid(true);
            // Refresh the page after 2s to show the paid state
            setTimeout(() => router.refresh(), 2000);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Pay now</h3>
      <button
        id="initiate-payment-btn"
        onClick={() => createIntent.mutate({ invoiceId })}
        disabled={createIntent.isPending}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5",
          "bg-violet-600 text-sm font-semibold text-white shadow-sm",
          "hover:bg-violet-700 active:bg-violet-800",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        )}
      >
        {createIntent.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
            Loading…
          </>
        ) : (
          "Pay invoice"
        )}
      </button>
      {createIntent.isError && (
        <p role="alert" className="text-center text-xs text-red-600 dark:text-red-400">
          {createIntent.error.message ?? "Failed to load payment form. Please try again."}
        </p>
      )}
      <p className="text-center text-xs text-neutral-400">
        Secured by Stripe · Card, Apple Pay, Google Pay accepted
      </p>
    </div>
  );
}
