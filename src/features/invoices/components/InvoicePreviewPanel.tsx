"use client";

import { Loader2 } from "lucide-react";
import { formatCents, type Currency } from "../schemas";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetPanel,
} from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc/client";

interface InvoicePreviewPanelProps {
  invoiceId: string | null;
  onClose: () => void;
}

export function InvoicePreviewPanel({
  invoiceId,
  onClose,
}: InvoicePreviewPanelProps) {
  const { data: invoice, isLoading } = trpc.invoice.getById.useQuery(
    { id: invoiceId || "" },
    { enabled: !!invoiceId },
  );

  return (
    <Sheet open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[480px] border-l border-(--inv-border) bg-[var(--inv-surface)] shadow-2xl sm:max-w-md"
      >
        <SheetHeader className="border-b border-(--inv-border) pb-4">
          <SheetTitle className="font-display text-xl font-extrabold tracking-tight text-[var(--inv-text-primary)]">
            Invoice Preview
          </SheetTitle>
        </SheetHeader>
        <SheetPanel className="pt-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-(--inv-accent-primary) opacity-50" />
            </div>
          ) : invoice ? (
            <div className="space-y-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-data text-[11px] font-bold tracking-[0.08em] text-(--inv-text-secondary) uppercase">
                    Invoice
                  </div>
                  <div className="font-metrics mt-1 text-[32px] leading-none font-medium tracking-tight text-[var(--inv-text-primary)]">
                    INV-{invoice.number}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[11px] font-bold tracking-[0.08em] text-(--inv-text-secondary) uppercase">
                    Amount
                  </div>
                  <div className="font-metrics mt-1 text-[32px] leading-none font-medium tracking-tight text-(--inv-accent-primary)">
                    {formatCents(
                      invoice.amountCents,
                      invoice.currency as Currency,
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-(--inv-border) bg-[var(--inv-surface-elevated)] p-5">
                <div className="font-data mb-3 text-[11px] font-bold tracking-[0.08em] text-(--inv-text-secondary) uppercase">
                  Client Info
                </div>
                <div className="font-display text-[15px] font-medium text-[var(--inv-text-primary)]">
                  {invoice.client?.companyName ||
                    invoice.client?.contactName ||
                    "Unknown Client"}
                </div>
                <div className="font-data mt-1 text-[13px] text-[var(--inv-text-muted)]">
                  {invoice.client?.email || "No Email Provided"}
                </div>
              </div>

              <div>
                <div className="font-data mb-4 text-[11px] font-bold tracking-[0.08em] text-(--inv-text-secondary) uppercase">
                  Line Items
                </div>
                <div className="space-y-3">
                  {invoice.lineItems.length === 0 ? (
                    <div className="font-data text-sm text-[var(--inv-text-muted)] italic">
                      No line items.
                    </div>
                  ) : (
                    invoice.lineItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b border-(--inv-border) py-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <div className="font-display text-[14px] font-medium text-[var(--inv-text-primary)]">
                            {item.description}
                          </div>
                          <div className="font-data mt-1 text-[12px] text-[var(--inv-text-muted)]">
                            Qty: {item.quantity} ×{" "}
                            {formatCents(
                              item.unitPriceCents,
                              invoice.currency as Currency,
                            )}
                          </div>
                        </div>
                        <div className="font-metrics text-[16px] font-medium text-[var(--inv-text-primary)]">
                          {formatCents(
                            Number(item.quantity) * item.unitPriceCents,
                            invoice.currency as Currency,
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="font-data mt-10 text-center text-sm text-[var(--inv-text-muted)]">
              Invoice not found.
            </div>
          )}
        </SheetPanel>
      </SheetContent>
    </Sheet>
  );
}
