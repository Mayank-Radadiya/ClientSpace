"use client";

// src/features/invoices/components/InvoiceStatusButton.tsx
// Status transition button for invoice lifecycle management.
// Shows context-appropriate label, handles loading state, shows toast feedback.

import React, { useTransition } from "react";
import { gooeyToast } from "goey-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type InvoiceStatus,
  NEXT_STATUS_LABELS,
  getNextStatus,
} from "../schemas";
import { updateInvoiceStatus } from "../server/actions";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoiceStatusButtonProps {
  invoice: {
    id: string;
    status: InvoiceStatus;
    number: number;
  };
  onSuccess?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoiceStatusButton({
  invoice,
  onSuccess,
  variant = "default",
  size = "sm",
}: InvoiceStatusButtonProps) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = getNextStatus(invoice.status);
  const label = NEXT_STATUS_LABELS[invoice.status];

  // Terminal state — no further transitions
  if (!nextStatus || !label) {
    return (
      <Button variant="outline" size={size} disabled>
        Paid
      </Button>
    );
  }

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await updateInvoiceStatus({
          invoiceId: invoice.id,
          status: nextStatus as "sent" | "paid",
        });

        if (result.success) {
          const messages: Record<InvoiceStatus, string> = {
            sent: `INV-${invoice.number} marked as sent.`,
            paid: `INV-${invoice.number} marked as paid.`,
            draft: "",
            overdue: "",
          };
          gooeyToast.success(
            messages[nextStatus as InvoiceStatus] ?? "Invoice updated.",
          );
          onSuccess?.();
        } else {
          gooeyToast.error(result.error ?? "Failed to update invoice status.");
        }
      } catch {
        gooeyToast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      aria-label={`${label} — Invoice ${invoice.number}`}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          Updating…
        </>
      ) : (
        label
      )}
    </Button>
  );
}
