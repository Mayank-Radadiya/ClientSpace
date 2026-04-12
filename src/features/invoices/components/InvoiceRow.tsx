"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  FileDownIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  CopyPlus,
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
}

const STATUS_VISUALS: Record<
  InvoiceUiStatus,
  {
    label: string;
    dot: string;
    badge: string;
    labelClass?: string;
    pulse?: boolean;
  }
> = {
  draft: {
    label: "Draft",
    dot: "bg-zinc-500 dark:bg-zinc-400",
    badge: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  },
  sent: {
    label: "Sent",
    dot: "bg-blue-500 dark:bg-blue-400",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  viewed: {
    label: "Viewed",
    dot: "bg-violet-500 dark:bg-violet-400",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  paid: {
    label: "Paid",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  overdue: {
    label: "Overdue",
    dot: "bg-red-500 dark:bg-red-400",
    badge: "bg-red-500/10 text-red-700 dark:text-red-300",
    pulse: true,
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-zinc-600 dark:bg-zinc-500",
    badge: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    labelClass: "line-through",
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

function avatarColorKey(seed: string): string {
  const palette = [
    "from-sky-500/25 to-cyan-500/25 text-sky-800 dark:text-sky-500",
    "from-emerald-500/25 to-teal-500/25 text-emerald-800 dark:text-emerald-500",
    "from-amber-500/25 to-orange-500/25 text-amber-800 dark:text-amber-500",
    "from-pink-500/25 to-rose-500/25 text-pink-800 dark:text-pink-500",
    "from-indigo-500/25 to-blue-500/25 text-indigo-800 dark:text-indigo-500",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx] ?? palette[0]!;
}

function StatusBadge({ status }: { status: InvoiceUiStatus }) {
  const cfg = STATUS_VISUALS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
        cfg.badge,
      )}
      aria-label={`Invoice status ${cfg.label}`}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          cfg.dot,
          cfg.pulse && "invoice-overdue-pulse motion-reduce:animate-none",
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
}: InvoiceRowProps) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const status = normalizeStatus(invoice.status);
  const clientName = deriveClientName(invoice);
  const email = invoice.clientEmail ?? "No email";
  const avatar = initialsFromName(clientName);
  const avatarClass = avatarColorKey(clientName || invoice.id);
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
          style:
            "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30",
        }
      : status === "sent" || status === "overdue"
        ? {
            label: "Mark paid",
            next: "paid" as const,
            icon: CheckCircle2,
            style:
              "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30",
          }
        : {
            label: "View",
            next: null,
            icon: Eye,
            style:
              "bg-zinc-500/10 text-zinc-700 hover:bg-zinc-500/20 dark:text-zinc-400 dark:hover:bg-zinc-500/30",
          };

  const runStatusAction = () => {
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

  const copyInvoiceNumber = async () => {
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
      className={cn(
        "group data-[state=selected]:bg-muted/40 h-11",
        isSelected && "bg-muted/30",
      )}
      data-state={isSelected ? "selected" : undefined}
    >
      <TableCell className="w-[40px] pl-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange?.(!!checked)}
          aria-label={`Select invoice ${invoiceCode}`}
        />
      </TableCell>

      <TableCell className="w-[140px]">
        <TooltipProvider delayDuration={100}>
          <Tooltip open={copied ? true : undefined}>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1">
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="text-muted-foreground hover:text-primary font-mono text-sm font-medium"
                >
                  {invoiceCode}
                </Link>
                <button
                  type="button"
                  onClick={copyInvoiceNumber}
                  className="text-muted-foreground hover:text-foreground inline-flex"
                  aria-label={`Copy ${invoiceCode}`}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? "Copied" : "Copy invoice number"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      <TableCell className="min-w-[180px]">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[11px] font-semibold text-black lg:flex dark:text-white",
              avatarClass,
            )}
            aria-hidden
          >
            {avatar}
          </div>
          <div className="min-w-0">
            <div className="text-foreground/95 truncate text-sm font-medium">
              {clientName}
            </div>
            <div className="text-muted-foreground hidden truncate text-xs lg:block">
              {email}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground text-sm">
        {issuedDate}
      </TableCell>

      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm",
            urgency === "overdue" && "text-rose-600 dark:text-rose-400",
            urgency === "soon" && "text-amber-600 dark:text-amber-400",
            urgency === "paid" && "text-muted-foreground line-through",
            urgency === "normal" && "text-foreground/90",
          )}
        >
          {urgency === "overdue" && <AlertTriangle className="h-3.5 w-3.5" />}
          {dueDate}
        </span>
      </TableCell>

      <TableCell>
        <span className="text-sm font-medium tabular-nums">
          {formatCents(invoice.amountCents, invoice.currency as Currency)}
        </span>
      </TableCell>

      <TableCell>
        <StatusBadge status={status} />
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={runStatusAction}
            disabled={isActionPending}
            className={cn(
              "h-8 gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
              primaryAction.style,
            )}
            aria-label={`${primaryAction.label} ${invoiceCode}`}
          >
            {isActionPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <primaryAction.icon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span
              className={cn(
                "hidden lg:inline",
                primaryAction.label === "View" && "inline",
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
                className="hidden lg:inline-flex"
                aria-label={`Open actions for ${invoiceCode}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem
                onClick={() => gooeyToast.info("Edit coming soon")}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => gooeyToast.info("Duplicate coming soon")}
              >
                <CopyPlus className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`/api/invoices/${invoice.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileDownIcon className="h-4 w-4" />
                  Download PDF
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
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
