"use client";

// src/features/invoices/components/EmptyInvoiceState.tsx
// Clean, modern empty state for when no invoices exist.

import { FileText, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmptyInvoiceStateProps {
  hasFilters?: boolean;
  onCreateClick?: () => void;
  onResetFilters?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyInvoiceState({
  hasFilters = false,
  onCreateClick,
  onResetFilters,
}: EmptyInvoiceStateProps) {
  if (hasFilters) {
    // Empty due to filters
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="relative mb-6">
          <div className="from-primary/10 absolute -inset-4 rounded-full bg-linear-to-tr to-transparent opacity-50 blur-2xl" />
          <div className="bg-muted/30 border-border/50 relative flex h-20 w-20 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm">
            <FileText className="text-muted-foreground/60 h-8 w-8" />
          </div>
        </div>
        <h3 className="text-foreground text-xl font-semibold tracking-tight">
          No invoices found
        </h3>
        <p className="text-muted-foreground mt-2 mb-6 max-w-sm text-sm">
          We couldn't find any invoices matching your current filters. Try
          adjusting your search or clearing the filters.
        </p>
        {onResetFilters && (
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="shadow-sm"
          >
            Clear all filters
          </Button>
        )}
      </div>
    );
  }

  // Truly empty - no invoices created yet
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-28 text-center">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05]">
        <div className="bg-primary h-[500px] w-[500px] rounded-full blur-3xl" />
      </div>

      <div className="relative mb-8">
        <div className="from-primary/10 absolute -inset-4 rounded-full bg-linear-to-tr to-transparent opacity-50 blur-2xl" />
        <div className="from-primary/5 to-primary/10 border-primary/20 shadow-primary/5 relative flex h-24 w-24 items-center justify-center rounded-3xl border bg-linear-to-b shadow-lg">
          <Receipt className="text-primary h-10 w-10 drop-shadow-sm" />
        </div>
        <div className="bg-background absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm">
          <Plus className="text-primary h-4 w-4" />
        </div>
      </div>
      <h3 className="text-foreground text-2xl font-bold tracking-tight">
        Draft your first invoice
      </h3>
      <p className="text-muted-foreground mt-3 mb-8 max-w-md text-sm leading-relaxed">
        Get paid faster with beautiful, professional invoices. Track payments,
        manage billing details, and keep your finances effortlessly organized.
      </p>
      {onCreateClick && (
        <Button
          onClick={onCreateClick}
          size="lg"
          className="gap-2 shadow-md transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      )}
    </div>
  );
}
