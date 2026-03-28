"use client";

// src/features/invoices/components/InvoiceToolbar.tsx
// Search and filter controls for invoice list with clean, modern design.

import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUSES, STATUS_LABELS } from "../schemas";
import type { InvoiceFilterStatus } from "../hooks/useInvoiceFilters";

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
}: InvoiceToolbarProps) {
  const showingFiltered = hasActiveFilters && filteredCount !== totalCount;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Search + Filter */}
      <div className="flex flex-1 items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9 pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select
          value={status}
          onValueChange={(value) => {
            if (value) onStatusChange(value as InvoiceFilterStatus);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset Filters (if active) */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="hidden sm:inline-flex"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Right: Results Count */}
      {totalCount > 0 && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          {showingFiltered ? (
            <>
              Showing <Badge variant="outline">{filteredCount}</Badge> of{" "}
              {totalCount}
            </>
          ) : (
            <>
              <Badge variant="outline">{totalCount}</Badge>{" "}
              {totalCount === 1 ? "invoice" : "invoices"}
            </>
          )}
        </div>
      )}
    </div>
  );
}
