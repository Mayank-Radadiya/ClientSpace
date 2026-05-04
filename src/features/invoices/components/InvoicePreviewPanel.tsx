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

export function InvoicePreviewPanel({ invoiceId, onClose }: InvoicePreviewPanelProps) {
  const { data: invoice, isLoading } = trpc.invoice.getById.useQuery(
    { id: invoiceId || "" },
    { enabled: !!invoiceId }
  );

  return (
    <Sheet open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-md bg-[var(--inv-surface)] border-l border-[var(--inv-border)] shadow-2xl">
        <SheetHeader className="border-b border-[var(--inv-border)] pb-4">
          <SheetTitle className="font-display text-xl font-extrabold text-[var(--inv-text-primary)] tracking-tight">
            Invoice Preview
          </SheetTitle>
        </SheetHeader>
        <SheetPanel className="pt-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--inv-accent-primary)] opacity-50" />
            </div>
          ) : invoice ? (
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-data text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--inv-text-secondary)]">Invoice</div>
                  <div className="font-metrics text-[32px] font-medium leading-none tracking-tight text-[var(--inv-text-primary)] mt-1">INV-{invoice.number}</div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--inv-text-secondary)]">Amount</div>
                  <div className="font-metrics text-[32px] font-medium leading-none tracking-tight text-[var(--inv-accent-primary)] mt-1">
                    {formatCents(invoice.amountCents, invoice.currency as Currency)}
                  </div>
                </div>
              </div>
              
              <div className="rounded-xl border border-[var(--inv-border)] bg-[var(--inv-surface-elevated)] p-5">
                <div className="font-data text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--inv-text-secondary)] mb-3">Client Info</div>
                <div className="font-display text-[15px] font-medium text-[var(--inv-text-primary)]">
                  {invoice.client?.companyName || invoice.client?.contactName || "Unknown Client"}
                </div>
                <div className="font-data text-[13px] text-[var(--inv-text-muted)] mt-1">
                  {invoice.client?.email || "No Email Provided"}
                </div>
              </div>

              <div>
                <div className="font-data text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--inv-text-secondary)] mb-4">Line Items</div>
                <div className="space-y-3">
                  {invoice.items.length === 0 ? (
                    <div className="font-data text-sm text-[var(--inv-text-muted)] italic">No line items.</div>
                  ) : (
                    invoice.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-3 border-b border-[var(--inv-border)] last:border-0 last:pb-0">
                        <div>
                          <div className="font-display text-[14px] font-medium text-[var(--inv-text-primary)]">{item.description}</div>
                          <div className="font-data text-[12px] text-[var(--inv-text-muted)] mt-1">Qty: {item.quantity} × {formatCents(item.unitPriceCents, invoice.currency as Currency)}</div>
                        </div>
                        <div className="font-metrics text-[16px] font-medium text-[var(--inv-text-primary)]">
                          {formatCents(Number(item.quantity) * item.unitPriceCents, invoice.currency as Currency)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[var(--inv-text-muted)] text-center font-data text-sm mt-10">Invoice not found.</div>
          )}
        </SheetPanel>
      </SheetContent>
    </Sheet>
  );
}
