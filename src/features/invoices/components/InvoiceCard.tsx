"use client";

// src/features/invoices/components/InvoiceCard.tsx
// Mobile-friendly card view for invoices with color-coded statuses.

import { FileDownIcon, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Currency, formatCents } from "../schemas";
import { InvoiceStatusButton } from "./InvoiceStatusButton";
import type { InvoiceStatus } from "../schemas";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceCardData {
  id: string;
  number: number;
  status: string;
  amountCents: number;
  currency: string;
  dueDate: string | null;
  clientCompanyName: string | null;
  clientContactName: string | null;
  clientEmail: string | null;
}

interface InvoiceCardProps {
  invoice: InvoiceCardData;
  onStatusUpdate?: () => void;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InvoiceUiStatus,
  {
    badgeVariant: "secondary" | "info" | "success" | "error" | "warning";
    dot: string;
    amountColor: string;
    cardBorder: string;
  }
> = {
  draft: {
    badgeVariant: "secondary",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    amountColor: "text-foreground",
    cardBorder: "border-border",
  },
  sent: {
    badgeVariant: "info",
    dot: "bg-blue-500",
    amountColor: "text-blue-600 dark:text-blue-400",
    cardBorder: "border-blue-200/50 dark:border-blue-800/30",
  },
  paid: {
    badgeVariant: "success",
    dot: "bg-emerald-500",
    amountColor: "text-emerald-600 dark:text-emerald-400",
    cardBorder: "border-emerald-200/50 dark:border-emerald-800/30",
  },
  overdue: {
    badgeVariant: "error",
    dot: "bg-red-500 animate-pulse",
    amountColor: "text-red-600 dark:text-red-400",
    cardBorder: "border-red-200/50 dark:border-red-800/30",
  },
  viewed: {
    badgeVariant: "info",
    dot: "bg-violet-500",
    amountColor: "text-violet-600 dark:text-violet-400",
    cardBorder: "border-violet-200/50 dark:border-violet-800/30",
  },
  cancelled: {
    badgeVariant: "secondary",
    dot: "bg-zinc-500",
    amountColor: "text-muted-foreground",
    cardBorder: "border-border",
  },
};

type InvoiceUiStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "paid"
  | "overdue"
  | "cancelled";

const STATUS_LABELS_UI: Record<InvoiceUiStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

function normalizeStatus(status: string): InvoiceUiStatus {
  if (status === "sent") return "sent";
  if (status === "viewed") return "viewed";
  if (status === "paid") return "paid";
  if (status === "overdue") return "overdue";
  if (status === "cancelled") return "cancelled";
  return "draft";
}

function toCoreStatus(status: InvoiceUiStatus): InvoiceStatus {
  if (status === "sent") return "sent";
  if (status === "paid") return "paid";
  if (status === "overdue") return "overdue";
  return "draft";
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvoiceUiStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.badgeVariant} className="gap-1.5 capitalize">
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {STATUS_LABELS_UI[status]}
    </Badge>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoiceCard({ invoice, onStatusUpdate }: InvoiceCardProps) {
  const status = normalizeStatus(invoice.status);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  const clientName =
    invoice.clientCompanyName ??
    invoice.clientContactName ??
    invoice.clientEmail ??
    "—";

  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const urgency = (() => {
    if (status === "paid") return "paid" as const;
    if (!invoice.dueDate) return "normal" as const;
    const now = new Date();
    const due = new Date(invoice.dueDate);
    const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 0 || status === "overdue") return "overdue" as const;
    if (days <= 3) return "soon" as const;
    return "normal" as const;
  })();
  const canDownload =
    status === "sent" || status === "paid" || status === "overdue";

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 transition-shadow hover:shadow-md",
        cfg.cardBorder,
      )}
    >
      <div className="space-y-0">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold tracking-tight">
              INV-{invoice.number}
            </p>
            <p className="text-muted-foreground mt-0.5 truncate text-sm">
              {clientName}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Amount */}
        <div className="bg-muted/30 border-y px-4 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <span
              className={cn("text-xl font-bold tabular-nums", cfg.amountColor)}
            >
              {formatCents(invoice.amountCents, invoice.currency as Currency)}
            </span>
          </div>
        </div>

        {/* Meta row: Due date */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Calendar className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <span
            className={cn(
              "text-sm",
              urgency === "overdue" &&
                "font-semibold text-red-600 dark:text-red-400",
              urgency === "soon" &&
                "font-medium text-amber-600 dark:text-amber-400",
              urgency === "paid" && "text-muted-foreground line-through",
              urgency === "normal" && "text-muted-foreground",
            )}
          >
            {urgency === "overdue" ? "Overdue · " : "Due · "}
            {dueDate}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t px-4 py-3">
          {canDownload && (
            <Link
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download PDF for INV-${invoice.number}`}
              className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <FileDownIcon className="h-4 w-4" />
            </Link>
          )}

          <div className="flex-1">
            <InvoiceStatusButton
              invoice={{
                id: invoice.id,
                status: toCoreStatus(status),
                number: invoice.number,
              }}
              onSuccess={onStatusUpdate}
              variant={status === "draft" ? "default" : "outline"}
              size="sm"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
