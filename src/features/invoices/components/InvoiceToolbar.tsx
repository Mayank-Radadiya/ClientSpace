"use client";

// src/features/invoices/components/InvoiceToolbar.tsx
// Search and filter controls for invoice list with clean, modern design.

import { Search, X, Calendar, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { INVOICE_STATUSES, STATUS_LABELS } from "../schemas";
import type { InvoiceFilterStatus } from "../hooks/useInvoiceFilters";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: InvoiceFilterStatus;
  onStatusChange: (value: InvoiceFilterStatus) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  totalCount?: number;
  filteredCount?: number;
  children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoiceToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  hasActiveFilters,
  onResetFilters,
  totalCount = 0,
  filteredCount = 0,
  children,
}: InvoiceToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top row: Status Tabs and Primary Action */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Status Tabs (Segmented Control) */}
        <div className="bg-muted/50 hide-scrollbar flex self-start overflow-x-auto rounded-lg p-1">
          {["all", ...INVOICE_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s as InvoiceFilterStatus)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all",
                status === s
                  ? "bg-background text-foreground ring-border/50 shadow-sm ring-1"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {s === "all"
                ? "All"
                : STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
            </button>
          ))}
        </div>

        {/* Primary Action (New Invoice Button) passed as children */}
        {children && <div className="shrink-0">{children}</div>}
      </div>

      {/* Bottom row: Filter Controls */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-[300px]">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-border/60 h-9 bg-transparent pr-9 pl-9 shadow-sm focus-visible:bg-transparent"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Date Filter (Mock) */}
          <Button
            variant="outline"
            size="sm"
            className="border-border/60 text-muted-foreground hover:text-foreground hidden h-9 shadow-sm sm:flex"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Filter by Date
          </Button>

          {/* Sort Dropdown (Mock) */}
          <Button
            variant="outline"
            size="sm"
            className="border-border/60 text-muted-foreground hover:text-foreground hidden h-9 shadow-sm md:flex"
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-muted-foreground text-sm">
          {filteredCount !== totalCount && hasActiveFilters ? (
            <span>
              <span className="text-foreground font-medium">
                {filteredCount}
              </span>{" "}
              of {totalCount} invoices
            </span>
          ) : (
            <span>
              <span className="text-foreground font-medium">{totalCount}</span>{" "}
              invoices
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
