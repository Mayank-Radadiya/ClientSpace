import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { invoices, organizations, clients } from "@/db/schema";
import { InvoicePaidState } from "@/features/portal/invoice/InvoicePaidState";
import { PaymentPanel } from "@/features/portal/invoice/PaymentPanel";
import { InvoicePaymentSkeleton } from "@/features/portal/invoice/InvoicePaymentSkeleton";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Inner page content (async server component) ───────────────────────────────
async function InvoicePageContent({ invoiceId }: { invoiceId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Resolve the client record (across orgs — use SYSTEM context)
  const clientRecord = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.clients.findFirst({
        where: eq(clients.userId, user.id),
        columns: { id: true, orgId: true, status: true },
      });
    },
  );

  if (!clientRecord || clientRecord.status !== "active") redirect("/login");

  // 2. Fetch invoice with line items (scoped to org)
  const invoice = await withRLS(
    { userId: user.id, orgId: clientRecord.orgId },
    async (tx) => {
      return tx.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId),
        with: {
          lineItems: true,
        },
      });
    },
  );

  if (!invoice) notFound();

  // 3. Security: ensure invoice belongs to this client (not just the org)
  if (invoice.clientId !== clientRecord.id) {
    redirect("/portal/invoices");
  }

  // 4. Fetch org Stripe status
  const org = await withRLS(
    { userId: user.id, orgId: clientRecord.orgId },
    async (tx) => {
      return tx.query.organizations.findFirst({
        where: eq(organizations.id, clientRecord.orgId),
        columns: {
          name: true,
          stripeAccountId: true,
          stripeOnboardingComplete: true,
        },
      });
    },
  );

  const isPaid = invoice.status === "paid";
  const canPay =
    !isPaid &&
    !!org?.stripeAccountId &&
    !!org.stripeOnboardingComplete &&
    (invoice.status === "sent" || invoice.status === "overdue");

  // 5. Compute tax breakdown
  const taxCents = Math.round(
    (invoice.amountCents * (invoice.taxRateBasisPoints ?? 0)) / 10000,
  );
  const subtotalCents = invoice.amountCents - taxCents;

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Invoice #{invoice.number}
          </h1>
          {org?.name && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              From {org.name}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            isPaid
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : invoice.status === "overdue"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          )}
        >
          {invoice.status}
        </span>
      </div>

      {/* Paid confirmation — full width */}
      {isPaid ? (
        <InvoicePaidState
          invoiceNumber={invoice.number}
          amountCents={invoice.amountCents}
          currency={invoice.currency}
          paidAt={invoice.paidAt}
        />
      ) : (
        /* Two-column layout: invoice details + payment panel */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* ── Left: Invoice details (3/5) ── */}
          <div className="space-y-6 lg:col-span-3">
            <div
              className={cn(
                "overflow-hidden rounded-2xl border",
                "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
                "shadow-sm",
              )}
            >
              {/* Invoice meta */}
              <div className="flex flex-col gap-1 border-b border-neutral-100 px-6 py-5 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {invoice.dueDate && (
                    <>
                      Due{" "}
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Issued{" "}
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {format(new Date(invoice.createdAt), "MMMM d, yyyy")}
                  </span>
                </div>
              </div>

              {/* Line items table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left dark:border-neutral-800">
                      <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-neutral-500 dark:text-neutral-400">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-neutral-500 dark:text-neutral-400">
                        Unit price
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-neutral-500 dark:text-neutral-400">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                    {(invoice.lineItems ?? []).map((item) => {
                      const qty = parseFloat(String(item.quantity));
                      const lineTotal = Math.round(qty * item.unitPriceCents);
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 text-neutral-800 dark:text-neutral-200">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                            {qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                            {formatAmount(item.unitPriceCents, invoice.currency)}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums font-medium text-neutral-800 dark:text-neutral-200">
                            {formatAmount(lineTotal, invoice.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals section */}
              <div className="space-y-2 border-t border-neutral-100 px-6 py-5 dark:border-neutral-800">
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatAmount(subtotalCents, invoice.currency)}
                  </span>
                </div>
                {(invoice.taxRateBasisPoints ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>
                      Tax ({((invoice.taxRateBasisPoints ?? 0) / 100).toFixed(0)}%)
                    </span>
                    <span className="tabular-nums">
                      {formatAmount(taxCents, invoice.currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Total due
                  </span>
                  <span className="text-2xl font-bold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
                    {formatAmount(invoice.amountCents, invoice.currency)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                  <p className="text-xs text-neutral-400">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Payment panel (2/5) ── */}
          <div className="lg:col-span-2">
            <div
              className={cn(
                "rounded-2xl border p-6",
                "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
                "shadow-sm",
              )}
            >
              {canPay ? (
                <PaymentPanel
                  invoiceId={invoice.id}
                  amountCents={invoice.amountCents}
                  currency={invoice.currency}
                />
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {invoice.status === "draft"
                      ? "This invoice has not been sent yet."
                      : "Online payment is not available for this invoice."}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Contact your agency to arrange payment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PortalInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<InvoicePaymentSkeleton />}>
      <InvoicePageContent invoiceId={id} />
    </Suspense>
  );
}
