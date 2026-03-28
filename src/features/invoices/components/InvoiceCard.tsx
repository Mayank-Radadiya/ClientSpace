"use client";

// src/features/invoices/components/InvoiceCard.tsx
// Mobile-friendly card view for invoices with color-coded statuses.

import { FileDownIcon, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type InvoiceStatus,
  type Currency,
  formatCents,
  STATUS_LABELS,
} from "../schemas";
import { InvoiceStatusButton } from "./InvoiceStatusButton";

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
  InvoiceStatus,
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
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.badgeVariant} className="gap-1.5 capitalize">
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoiceCard({ invoice, onStatusUpdate }: InvoiceCardProps) {
  const status = invoice.status as InvoiceStatus;
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

  const isOverdue = status === "overdue";
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
              isOverdue
                ? "font-semibold text-red-500 dark:text-red-400"
                : "text-muted-foreground",
            )}
          >
            {isOverdue ? "Overdue · " : "Due · "}
            {dueDate}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t px-4 py-3">
          {canDownload && (
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download PDF for INV-${invoice.number}`}
              className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <FileDownIcon className="h-4 w-4" />
            </a>
          )}

          <div className="flex-1">
            <InvoiceStatusButton
              invoice={{
                id: invoice.id,
                status,
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
