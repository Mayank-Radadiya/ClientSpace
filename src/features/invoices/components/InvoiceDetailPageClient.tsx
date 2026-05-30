"use client";

// src/features/invoices/components/InvoiceDetailPageClient.tsx
// Client component for the invoice detail page — renders full invoice info with line items.

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDownIcon, CheckCircle, Send, Loader2 } from "lucide-react";
import { useInvoiceDetail, useUpdateInvoiceStatusMutation } from "@/features/invoices/hooks/useInvoices";
import { formatCents, calculateTotals, type Currency } from "@/features/invoices/schemas";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceDetailPageClientProps {
  orgId: string;
  invoiceId: string;
}

const STATUS_BADGE_VARIANTS: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  paid: "outline",
  overdue: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

export function InvoiceDetailPageClient({
  orgId,
  invoiceId,
}: InvoiceDetailPageClientProps) {
  const router = useRouter();
  const { data: invoice, isLoading, error, refetch } = useInvoiceDetail(orgId, invoiceId);
  const updateStatusMut = useUpdateInvoiceStatusMutation(orgId, invoiceId);

  const handleStatusUpdate = useCallback(
    (status: "sent" | "paid") => {
      updateStatusMut.mutate(
        { id: invoiceId, status },
        {
          onSuccess: () => {
            refetch();
          },
        },
      );
    },
    [invoiceId, updateStatusMut, refetch],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Invoice Not Found</CardTitle>
            <CardDescription>
              {error?.message || "The invoice could not be loaded."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
            <Button variant="ghost" onClick={() => router.push("/invoices")} className="ml-2">
              Back to Invoices
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const status = invoice.status as string;
  const statusBadgeVariant = STATUS_BADGE_VARIANTS[status] ?? "secondary";
  const currency = (invoice.currency ?? "USD") as Currency;
  const lineItems = (invoice as any).lineItems ?? [];
  const client = (invoice as any).client;
  const totals = calculateTotals(
    lineItems.map((li: any) => ({
      description: li.description,
      quantity: li.quantity,
      unitPriceCents: li.unitPriceCents,
    })),
    invoice.taxRateBasisPoints ?? 0,
  );

  const canMarkSent = status === "draft";
  const canMarkPaid = status === "sent" || status === "overdue";
  const canDownload = status === "sent" || status === "paid" || status === "overdue";

  // FIX: Invoice line items from the detail query were not rendered
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Back link */}
      <Link
        href="/invoices"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      {/* Header card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="font-mono text-2xl">INV-{invoice.number}</CardTitle>
            <CardDescription className="mt-1">
              {client?.companyName || client?.contactName || client?.email || "Unknown Client"}
            </CardDescription>
          </div>
          <Badge variant={statusBadgeVariant} className="capitalize">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium">Amount</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatCents(invoice.amountCents, currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Due Date</p>
              <p className="text-sm font-medium">
                {invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Tax Rate</p>
              <p className="text-sm font-medium">
                {((invoice.taxRateBasisPoints ?? 0) / 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Currency</p>
              <p className="text-sm font-medium">{currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No line items on this invoice.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs font-medium uppercase tracking-wider">
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 pr-4 text-right">Qty</th>
                  <th className="pb-2 pr-4 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item: any, i: number) => {
                  const lineTotal = Math.round(item.quantity * item.unitPriceCents);
                  return (
                    <tr key={item.id || i} className="border-border/50 border-b last:border-0">
                      <td className="py-3 pr-4">{item.description}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{item.quantity}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {formatCents(item.unitPriceCents, currency)}
                      </td>
                      <td className="py-3 text-right tabular-nums font-medium">
                        {formatCents(lineTotal, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td colSpan={3} className="py-2 pr-4 text-right text-sm">
                    Subtotal
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatCents(totals.subtotal, currency)}
                  </td>
                </tr>
                {totals.tax > 0 && (
                  <tr>
                    <td colSpan={3} className="py-1 pr-4 text-right text-sm">
                      Tax ({((invoice.taxRateBasisPoints ?? 0) / 100).toFixed(2)}%)
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {formatCents(totals.tax, currency)}
                    </td>
                  </tr>
                )}
                <tr className="text-lg font-bold">
                  <td colSpan={3} className="py-3 pr-4 text-right">
                    Total
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatCents(totals.total, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {canDownload && (
            <Button variant="outline" onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank', 'noopener,noreferrer')}>
              <FileDownIcon className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
          {canMarkSent && (
            <Button
              onClick={() => handleStatusUpdate("sent")}
              disabled={updateStatusMut.isPending}
            >
              {updateStatusMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Mark as Sent
            </Button>
          )}
          {canMarkPaid && (
            <Button
              onClick={() => handleStatusUpdate("paid")}
              disabled={updateStatusMut.isPending}
              variant="outline"
            >
              {updateStatusMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark as Paid
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
