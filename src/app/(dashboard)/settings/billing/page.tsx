import { Suspense } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations } from "@/db/schema";
import { createTRPCContext } from "@/lib/trpc/init";
import { ConnectStripeCard } from "@/features/billing/components/ConnectStripeCard";
import { BillingStatusCard } from "@/features/billing/components/BillingStatusCard";

export const metadata = {
  title: "Billing — Settings",
  description: "Manage your Stripe Connect account and payout settings.",
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function BillingPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-5 w-80 rounded-md bg-neutral-100 dark:bg-neutral-800/60" />
      <div className="h-52 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60" />
    </div>
  );
}

// ── Inner async component (Suspense boundary wraps this) ──────────────────────
async function BillingContent() {
  const ctx = await createTRPCContext();
  if (!ctx) redirect("/login");

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    redirect("/dashboard");
  }

  const org = await withRLS(
    { userId: ctx.userId, orgId: ctx.orgId },
    async (tx) => {
      return tx.query.organizations.findFirst({
        where: eq(organizations.id, ctx.orgId),
        columns: {
          stripeAccountId: true,
          stripeOnboardingComplete: true,
          name: true,
        },
      });
    },
  );

  if (!org) redirect("/dashboard");

  const isConnected = org.stripeOnboardingComplete && !!org.stripeAccountId;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Billing &amp; Payments
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Connect Stripe to accept invoice payments from your clients.
        </p>
      </div>

      {/* Main card */}
      {isConnected ? (
        <BillingStatusCard
          chargesEnabled={true}
          payoutsEnabled={true}
          accountId={org.stripeAccountId ?? undefined}
        />
      ) : (
        <ConnectStripeCard />
      )}

      {/* Additional info */}
      <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          How it works
        </h3>
        <ol className="space-y-2">
          {[
            "Connect your Stripe account in under 5 minutes.",
            "Clients see a \"Pay now\" button on their invoice.",
            "They pay by card, Apple Pay, Google Pay, or bank transfer.",
            "Funds arrive in your bank within 2 business days.",
            "Invoice status updates to Paid automatically.",
          ].map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-neutral-500 dark:text-neutral-400"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingContent />
    </Suspense>
  );
}
