"use client";

// src/features/invoices/components/InvoiceRow.tsx
// Individual invoice row — premium badges + styled action buttons + row selection.

import {
  FileDownIcon,
  Send,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import React, { useTransition } from "react";
import { gooeyToast } from "goey-toast";
import {
  type InvoiceStatus,
  type Currency,
  formatCents,
  STATUS_LABELS,
  getNextStatus,
} from "../schemas";
import { updateInvoiceStatus } from "../server/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceRowData {
  id: string;
  number: number;
  status: string;
  amountCents: number;
  currency: string;
  issuedDate?: string | null;
  dueDate: string | null;
  clientCompanyName: string | null;
  clientContactName: string | null;
  clientEmail: string | null;
}

interface InvoiceRowProps {
  invoice: InvoiceRowData;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onStatusUpdate?: () => void;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InvoiceStatus,
  {
    label: string;
    dot: string;
    badge: string;
    rowHighlight: string;
  }
> = {
  draft: {
    label: "Draft",
    dot: "bg-zinc-400",
    badge:
      "border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400",
    rowHighlight: "",
  },
  sent: {
    label: "Sent",
    dot: "bg-blue-500",
    badge:
      "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/50 dark:text-blue-400",
    rowHighlight: "",
  },
  paid: {
    label: "Paid",
    dot: "bg-emerald-500",
    badge:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/50 dark:text-emerald-400",
    rowHighlight: "",
  },
  overdue: {
    label: "Overdue",
    dot: "bg-red-500 animate-pulse",
    badge:
      "border border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-400",
    rowHighlight: "border-l-2 border-l-red-500/70",
  },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        cfg.badge,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── InlineActionButton ───────────────────────────────────────────────────────

function InlineActionButton({
  invoice,
  onSuccess,
}: {
  invoice: { id: string; status: InvoiceStatus; number: number };
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = getNextStatus(invoice.status);

  // Paid — terminal state
  if (!nextStatus) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" />
        Paid
      </span>
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
          const msg =
            nextStatus === "sent"
              ? `INV-${invoice.number} marked as sent.`
              : `INV-${invoice.number} marked as paid.`;
          gooeyToast.success(msg);
          onSuccess?.();
        } else {
          gooeyToast.error(result.error ?? "Failed to update.");
        }
      } catch {
        gooeyToast.error("Unexpected error. Try again.");
      }
    });
  };

  const isDraft = invoice.status === "draft";

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className={cn(
        "inline-flex w-[120px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:opacity-60",
        isDraft
          ? "border border-violet-600/30 bg-violet-600 text-white shadow-sm shadow-violet-500/20 hover:bg-violet-700 hover:shadow-violet-500/30"
          : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/70",
      )}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isDraft ? (
        <Send className="size-3.5" />
      ) : (
        <CheckCircle2 className="size-3.5" />
      )}
      {isPending ? "Updating…" : isDraft ? "Mark as Sent" : "Mark as Paid"}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoiceRow({
  invoice,
  isSelected,
  onSelectChange,
  onStatusUpdate,
}: InvoiceRowProps) {
  const status = invoice.status as InvoiceStatus;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  const clientName =
    invoice.clientCompanyName ??
    invoice.clientContactName ??
    invoice.clientEmail ??
    "—";

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const issuedDate = formatDate(invoice.issuedDate || invoice.dueDate); // Fallback to dueDate if issuedDate is missing in DB
  const dueDate = formatDate(invoice.dueDate);

  const isOverdue = status === "overdue";
  const canDownload =
    status === "sent" || status === "paid" || status === "overdue";

  return (
    <TableRow
      className={cn(
        "group data-[state=selected]:bg-muted hover:bg-muted/40 transition-colors",
        isSelected && "bg-muted/50",
        cfg.rowHighlight,
      )}
      data-state={isSelected ? "selected" : undefined}
    >
      {/* Checkbox */}
      <TableCell className="w-[40px] pl-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange?.(!!checked)}
          aria-label={`Select invoice ${invoice.number}`}
        />
      </TableCell>

      {/* Invoice Number */}
      <TableCell className="w-[100px]">
        <span className="font-mono text-sm font-medium tracking-tight">
          INV-{invoice.number}
        </span>
      </TableCell>

      {/* Client */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm leading-none font-medium">{clientName}</span>
          {invoice.clientEmail && (
            <span className="text-muted-foreground mt-1 text-xs">
              {invoice.clientEmail}
            </span>
          )}
        </div>
      </TableCell>

      {/* Issued Date */}
      <TableCell className="text-muted-foreground text-sm">
        {issuedDate}
      </TableCell>

      {/* Due Date */}
      <TableCell>
        <span
          className={cn(
            "text-sm font-medium",
            isOverdue
              ? "text-rose-600 dark:text-rose-500"
              : "text-muted-foreground",
          )}
        >
          {dueDate}
        </span>
      </TableCell>

      {/* Amount (Right Aligned, Tabular) */}
      <TableCell>
        <span className="text-sm font-medium tabular-nums">
          {formatCents(invoice.amountCents, invoice.currency as Currency)}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusBadge status={status} />
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-3 transition-opacity">
          <InlineActionButton
            invoice={{ id: invoice.id, status, number: invoice.number }}
            onSuccess={onStatusUpdate}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              {canDownload && (
                <DropdownMenuItem asChild>
                  <a
                    href={`/api/invoices/${invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <FileDownIcon className="mr-2 h-4 w-4" />
                    <span>Download PDF</span>
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => gooeyToast.info("Edit not implemented yet")}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => gooeyToast.info("Delete not implemented yet")}
                className="text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
