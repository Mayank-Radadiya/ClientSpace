"use client";

import { Calendar, ArrowUpDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvoiceFilterStatus } from "../hooks/useInvoiceFilters";
import { STATUS_LABELS } from "../schemas";

type InvoiceUiStatus = InvoiceFilterStatus;

interface StatusCount {
  key: InvoiceUiStatus;
  label: string;
  count: number;
  disabled?: boolean;
}

interface InvoiceToolbarProps {
  title?: string;
  subtitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  status: InvoiceFilterStatus;
  onStatusChange: (value: InvoiceFilterStatus) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  totalCount?: number;
  filteredCount?: number;
  statusCounts?: StatusCount[];
  sortBy?: "number" | "issued" | "due" | "amount";
  sortDir?: "asc" | "desc";
  onSortByChange?: (value: "number" | "issued" | "due" | "amount") => void;
  children?: React.ReactNode;
}

function renderSortText(sortBy: "number" | "issued" | "due" | "amount") {
  if (sortBy === "number") return "Invoice #";
  if (sortBy === "issued") return "Issued";
  if (sortBy === "due") return "Due";
  return "Amount";
}

export function InvoiceToolbar({
  title = "Invoices",
  subtitle,
  search,
  onSearchChange,
  status,
  onStatusChange,
  hasActiveFilters,
  onResetFilters,
  totalCount = 0,
  filteredCount = 0,
  statusCounts = [
    { key: "all", label: "All", count: totalCount },
    { key: "draft", label: "Draft", count: 0 },
    { key: "sent", label: "Sent", count: 0 },
    { key: "paid", label: "Paid", count: 0 },
    { key: "overdue", label: "Overdue", count: 0 },
  ],
  sortBy = "due",
  sortDir = "desc",
  onSortByChange,
  children,
}: InvoiceToolbarProps) {
  const resolvedSubtitle = subtitle ?? `${totalCount} invoices`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {resolvedSubtitle}
          </p>
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>

      <div className="border-border/70 bg-card/80 hide-scrollbar flex overflow-x-auto rounded-xl border px-2 py-1">
        {statusCounts.map((item) => {
          const isAll = item.key === "all";
          const isKnownStatus = ["draft", "sent", "paid", "overdue"].includes(
            item.key,
          );
          const isActive = item.key === status;
          const disabled =
            item.disabled || (item.count === 0 && !isAll) || !isKnownStatus;

          return (
            <button
              key={item.key}
              type="button"
              disabled={disabled}
              onClick={() => onStatusChange(item.key as InvoiceFilterStatus)}
              className={cn(
                "relative flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                disabled &&
                  "hover:text-muted-foreground cursor-not-allowed opacity-45 hover:bg-transparent",
              )}
              aria-label={`${item.label} (${item.count})`}
            >
              <span className="font-medium">
                {item.key === "all"
                  ? "All"
                  : (STATUS_LABELS[item.key as keyof typeof STATUS_LABELS] ??
                    item.label)}
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {item.count}
              </span>
              {isActive && (
                <span className="bg-primary absolute right-2 bottom-0 left-2 h-px rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-[60%]">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pr-9 pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2 py-4"
              onClick={() => onSortByChange?.(sortBy)}
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort: {renderSortText(sortBy)}{" "}
              {sortDir === "asc" ? "(ASC)" : "(DESC)"}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 py-4"
                onClick={onResetFilters}
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>

          <div className="text-muted-foreground ml-auto text-sm">
            {filteredCount !== totalCount && hasActiveFilters ? (
              <span>
                <span className="text-foreground font-semibold tabular-nums">
                  {filteredCount}
                </span>{" "}
                invoices
              </span>
            ) : (
              <span>
                <span className="text-foreground font-semibold tabular-nums">
                  {totalCount}
                </span>{" "}
                invoices
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Sorted by {renderSortText(sortBy)}{" "}
        {sortDir === "asc" ? "ascending" : "descending"}
      </p>
    </div>
  );
}

export type { StatusCount, InvoiceUiStatus };
