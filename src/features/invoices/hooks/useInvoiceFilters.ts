"use client";

// src/features/invoices/hooks/useInvoiceFilters.ts
// Client-side filter state management for invoice list with debounced search.

import { useState, useMemo } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { InvoiceStatus } from "../schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceFilterStatus = InvoiceStatus | "all";

export interface InvoiceFilters {
  search: string;
  status: InvoiceFilterStatus;
}

export type InvoiceSortBy = "number" | "issued" | "due" | "amount";
export type InvoiceSortDir = "asc" | "desc";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInvoiceFilters() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceFilterStatus>("all");
  const [sortBy, setSortBy] = useState<InvoiceSortBy>("due");
  const [sortDir, setSortDir] = useState<InvoiceSortDir>("desc");

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300);

  // Compute if any filters are active
  const hasActiveFilters = useMemo(() => {
    return debouncedSearch.length > 0 || status !== "all";
  }, [debouncedSearch, status]);

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setSortBy("due");
    setSortDir("desc");
  };

  const toggleSort = (column: InvoiceSortBy) => {
    if (column === sortBy) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDir("desc");
  };

  return {
    search,
    setSearch,
    debouncedSearch,
    status,
    setStatus,
    sortBy,
    sortDir,
    setSortBy,
    setSortDir,
    toggleSort,
    hasActiveFilters,
    resetFilters,
  };
}
