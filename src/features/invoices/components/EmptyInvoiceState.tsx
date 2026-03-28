"use client";

// src/features/invoices/components/EmptyInvoiceState.tsx
// Clean, modern empty state for when no invoices exist.

import { FileText, Plus } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted/50 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <FileText className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">No invoices found</h3>
        <p className="text-muted-foreground mb-4 max-w-sm text-sm">
          No invoices match your current filters. Try adjusting your search or
          filter criteria.
        </p>
        {onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  // Truly empty - no invoices created yet
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-primary/5 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
        <FileText className="text-primary h-10 w-10" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">No invoices yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">
        Get started by creating your first invoice. Track payments, manage
        billing, and keep your finances organized.
      </p>
      {onCreateClick && (
        <Button onClick={onCreateClick}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Your First Invoice
        </Button>
      )}
    </div>
  );
}
