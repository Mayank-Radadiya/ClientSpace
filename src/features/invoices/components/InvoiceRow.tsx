"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  CopyPlus,
  Eye,
  FileDownIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { gooeyToast } from "goey-toast";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCents, type Currency } from "../schemas";
import { deleteInvoices, updateInvoiceStatus } from "../server/actions";

export type InvoiceUiStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "paid"
  | "overdue"
  | "cancelled";

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
  onClickRow?: () => void;
}

const STATUS_VISUALS: Record<
  InvoiceUiStatus,
  {
    label: string;
    dot: string;
    badge: string;
    labelClass?: string;
    pulse?: boolean;
    borderColor?: string;
  }
> = {
  draft: {
    label: "Draft",
    dot: "bg-[var(--inv-status-draft)]",
    badge: "bg-[var(--inv-status-draft)]/10 text-[var(--inv-status-draft)]",
    borderColor: "border-[var(--inv-status-draft)]/30",
  },
  sent: {
    label: "Sent",
    dot: "bg-[var(--inv-status-sent)]",
    badge: "bg-[var(--inv-status-sent)]/10 text-[var(--inv-status-sent)]",
    borderColor: "border-[var(--inv-status-sent)]/30",
    pulse: true,
  },
  viewed: {
    label: "Viewed",
    dot: "bg-violet-500",
    badge: "bg-violet-500/10 text-violet-500",
    borderColor: "border-violet-500/30",
  },
  paid: {
    label: "Paid",
    dot: "bg-[var(--inv-status-paid)]",
    badge: "bg-[var(--inv-status-paid)]/10 text-[var(--inv-status-paid)]",
    borderColor: "border-[var(--inv-status-paid)]/30",
  },
  overdue: {
    label: "Overdue",
    dot: "bg-[var(--inv-status-overdue)]",
    badge: "bg-[var(--inv-status-overdue)]/10 text-[var(--inv-status-overdue)]",
    borderColor: "border-[var(--inv-status-overdue)]/30",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-zinc-500",
    badge: "bg-zinc-500/10 text-zinc-500",
    labelClass: "line-through",
    borderColor: "border-zinc-500/30",
  },
};

function normalizeStatus(status: string): InvoiceUiStatus {
  if (status === "draft") return "draft";
  if (status === "sent") return "sent";
  if (status === "paid") return "paid";
  if (status === "overdue") return "overdue";
  if (status === "viewed") return "viewed";
  if (status === "cancelled") return "cancelled";
  return "draft";
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "--";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function deriveClientName(invoice: InvoiceRowData): string {
  const raw =
    invoice.clientCompanyName ??
    invoice.clientContactName ??
    invoice.clientEmail ??
    "Unknown";
  return raw.replace(/,+/g, " ").replace(/\s+/g, " ").trim();
}

function initialsFromName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

function StatusBadge({ status }: { status: InvoiceUiStatus }) {
  const cfg = STATUS_VISUALS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em]",
        cfg.badge,
        cfg.borderColor
      )}
      aria-label={`Invoice status ${cfg.label}`}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          cfg.dot,
          cfg.pulse && "inv-animate-pulse-sent"
        )}
      />
      <span className={cfg.labelClass}>{cfg.label}</span>
    </span>
  );
}

export function InvoiceRow({
  invoice,
  isSelected,
  onSelectChange,
  onStatusUpdate,
  onClickRow,
}: InvoiceRowProps) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const status = normalizeStatus(invoice.status);
  const clientName = deriveClientName(invoice);
  const email = invoice.clientEmail ?? "No email";
  const avatar = initialsFromName(clientName);
  const issuedDate = formatDate(invoice.issuedDate || invoice.dueDate);
  const dueDate = formatDate(invoice.dueDate);
  const invoiceCode = `INV-${invoice.number}`;

  const urgency = useMemo(() => {
    if (status === "paid") return "paid" as const;
    if (!invoice.dueDate) return "normal" as const;

    const now = new Date();
    const due = new Date(invoice.dueDate);
    const diffMs = due.getTime() - now.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);

    if (days < 0 || status === "overdue") return "overdue" as const;
    if (days <= 3) return "soon" as const;
    return "normal" as const;
  }, [invoice.dueDate, status]);

  const primaryAction =
    status === "draft"
      ? {
          label: "Send",
          next: "sent" as const,
          icon: Send,
        }
      : status === "sent" || status === "overdue"
        ? {
            label: "Mark paid",
            next: "paid" as const,
            icon: CheckCircle2,
          }
        : {
            label: "View",
            next: null,
            icon: Eye,
          };

  const runStatusAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!primaryAction.next) {
      window.open(
        `/api/invoices/${invoice.id}/pdf`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    startActionTransition(async () => {
      const result = await updateInvoiceStatus({
        invoiceId: invoice.id,
        status: primaryAction.next,
      });

      if (result.success) {
        gooeyToast.success(`${invoiceCode} updated.`);
        onStatusUpdate?.();
      } else {
        gooeyToast.error(result.error ?? "Failed to update invoice.");
      }
    });
  };

  const copyInvoiceNumber = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(invoiceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      gooeyToast.error("Could not copy invoice number.");
    }
  };

  return (
    <TableRow
      onClick={onClickRow}
      className={cn(
        "group cursor-pointer border-b border-[var(--inv-border)] transition-colors duration-150 ease-out",
        "hover:bg-[var(--inv-accent-subtle)]",
        isSelected && "bg-[var(--inv-accent-subtle)] shadow-[inset_2px_0_0_var(--inv-accent-primary)]",
      )}
      data-state={isSelected ? "selected" : undefined}
    >
      <TableCell className="w-[40px] pl-4" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange?.(!!checked)}
          aria-label={`Select invoice ${invoiceCode}`}
          className="border-[var(--inv-border)] data-[state=checked]:bg-[var(--inv-accent-primary)] data-[state=checked]:border-[var(--inv-accent-primary)] text-white"
        />
      </TableCell>

      <TableCell className="w-[140px]">
        <TooltipProvider delayDuration={100}>
          <Tooltip open={copied ? true : undefined}>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-2">
                <span className="font-data text-sm font-medium text-[var(--inv-text-primary)]">
                  {invoiceCode}
                </span>
                <button
                  type="button"
                  onClick={copyInvoiceNumber}
                  className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--inv-text-muted)] hover:text-[var(--inv-accent-primary)]"
                  aria-label={`Copy ${invoiceCode}`}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[var(--inv-surface-elevated)] border-[var(--inv-border)] text-[var(--inv-text-primary)]">
              {copied ? "Copied" : "Copy invoice number"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      <TableCell className="min-w-[180px]">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F7FFF]/20 to-[#4F7FFF]/40 text-[#4F7FFF] dark:text-[#6B95FF] text-[11px] font-semibold"
            aria-hidden
          >
            {avatar}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-medium text-[var(--inv-text-primary)]">
              {clientName}
            </div>
            <div className="truncate font-data text-[12px] text-[var(--inv-text-muted)]">
              {email}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="font-data text-sm text-[var(--inv-text-secondary)]">
        {issuedDate === "--" ? <span className="text-[var(--inv-text-muted)]">—</span> : issuedDate}
      </TableCell>

      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-data text-sm",
            urgency === "overdue" && "text-[var(--inv-status-overdue)]",
            urgency === "soon" && "text-[var(--inv-status-pending)]",
            urgency === "paid" && "text-[var(--inv-text-muted)] line-through",
            urgency === "normal" && "text-[var(--inv-text-secondary)]",
          )}
        >
          {urgency === "overdue" && <AlertTriangle className="h-3.5 w-3.5" />}
          {dueDate === "--" ? <span className="text-[var(--inv-text-muted)]">—</span> : dueDate}
        </span>
      </TableCell>

      <TableCell className="text-right">
        <span className="font-metrics text-[18px] font-medium tracking-wide text-[var(--inv-text-primary)]">
          {formatCents(invoice.amountCents, invoice.currency as Currency)}
        </span>
      </TableCell>

      <TableCell>
        <StatusBadge status={status} />
      </TableCell>

      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={runStatusAction}
            disabled={isActionPending}
            className="h-8 gap-1.5 rounded-full border-[var(--inv-accent-primary)] bg-transparent text-[var(--inv-accent-primary)] transition-colors hover:bg-[var(--inv-accent-primary)] hover:text-white dark:hover:text-white"
            aria-label={`${primaryAction.label} ${invoiceCode}`}
          >
            {isActionPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <primaryAction.icon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span
              className={cn(
                "hidden lg:inline font-medium tracking-wide"
              )}
            >
              {primaryAction.label}
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden h-8 w-8 text-[var(--inv-text-secondary)] hover:bg-[var(--inv-surface-elevated)] lg:inline-flex"
                aria-label={`Open actions for ${invoiceCode}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] bg-[var(--inv-surface)]/90 backdrop-blur-md border-[var(--inv-border)] shadow-xl">
              <DropdownMenuItem
                className="cursor-pointer text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-[var(--inv-accent-primary)]"
                onClick={() => gooeyToast.info("Edit coming soon")}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-[var(--inv-accent-primary)]"
                onClick={() => gooeyToast.info("Duplicate coming soon")}
              >
                <CopyPlus className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                asChild
                className="cursor-pointer text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-[var(--inv-accent-primary)]"
              >
                <a
                  href={`/api/invoices/${invoice.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileDownIcon className="h-4 w-4 mr-2" />
                  Download PDF
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--inv-border)]" />
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300"
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  startDeleteTransition(async () => {
                    const result = await deleteInvoices([invoice.id]);
                    if (result.success) {
                      gooeyToast.success(`${invoiceCode} deleted.`);
                      onStatusUpdate?.();
                    } else {
                      gooeyToast.error(result.error ?? "Failed to delete.");
                    }
                  });
                }}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
