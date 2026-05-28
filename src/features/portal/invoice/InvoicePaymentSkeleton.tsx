// src/features/portal/invoice/InvoicePaymentSkeleton.tsx
// Skeleton loading state for the invoice payment page.
// Used as the Suspense fallback to avoid layout shift.

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800",
        className,
      )}
    />
  );
}

export function InvoicePaymentSkeleton() {
  return (
    <div className="space-y-8">
      {/* Invoice number heading */}
      <Shimmer className="h-7 w-48" />

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Left: invoice details (3/5) */}
        <div className="space-y-4 lg:col-span-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <Shimmer className="h-5 w-32" />
            <Shimmer className="h-5 w-20" />
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-neutral-100 dark:border-neutral-800">
            <div className="space-y-px">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <Shimmer className="h-4 w-2/3" />
                  <Shimmer className="h-4 w-20" />
                </div>
              ))}
            </div>
            {/* Total row */}
            <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-6 w-28" />
            </div>
          </div>
        </div>

        {/* Right: payment panel (2/5) */}
        <div className="space-y-4 lg:col-span-2">
          <Shimmer className="h-5 w-24" />
          <div className="space-y-3 rounded-xl border border-neutral-100 p-5 dark:border-neutral-800">
            <Shimmer className="h-10 w-full" />
            <Shimmer className="h-10 w-full" />
            <Shimmer className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
