"use client";

// src/features/invoices/components/InvoiceList.tsx
// Invoice list with filtering, search, and polished UI.

import React, { useMemo } from "react";
import { AlertCircleIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { InvoiceRow } from "./InvoiceRow";
import { InvoiceCard } from "./InvoiceCard";
import { InvoiceTableSkeleton } from "./InvoiceTableSkeleton";
import { EmptyInvoiceState } from "./EmptyInvoiceState";
import type { InvoiceFilterStatus } from "../hooks/useInvoiceFilters";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceListProps {
  statusFilter?: InvoiceFilterStatus;
  searchQuery?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  onCreateClick?: () => void;
  onCountsChange?: (total: number, filtered: number) => void;
}

interface InvoiceData {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoiceList({
  statusFilter = "all",
  searchQuery = "",
  hasActiveFilters = false,
  onResetFilters,
  onCreateClick,
  onCountsChange,
}: InvoiceListProps) {
  const { data, isLoading, error, refetch } = trpc.invoice.getAll.useQuery(
    {
      status: statusFilter === "all" ? undefined : (statusFilter as any),
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
    },
  );

  // Client-side filtering for search (since backend might not support it yet)
  const filteredData = useMemo(() => {
    if (!data || !searchQuery) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((invoice: any) => {
      const invoiceNumber = `INV-${invoice.number}`.toLowerCase();
      const clientName = (
        invoice.clientCompanyName ??
        invoice.clientContactName ??
        invoice.clientEmail ??
        ""
      ).toLowerCase();
      const amount = invoice.amountCents.toString();

      return (
        invoiceNumber.includes(query) ||
        clientName.includes(query) ||
        amount.includes(query)
      );
    });
  }, [data, searchQuery]);

  // Update counts when they change
  React.useEffect(() => {
    if (data && filteredData && onCountsChange) {
      onCountsChange(data.length, filteredData.length);
    }
  }, [data, filteredData, onCountsChange]);

  // ── Error State ──────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        <AlertCircleIcon className="h-4 w-4 shrink-0" />
        <span>Failed to load invoices.</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refetch()}
          className="ml-auto text-red-700 dark:text-red-300"
        >
          Try again
        </Button>
      </div>
    );
  }

  // ── Loading State ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <InvoiceTableSkeleton rows={5} />
        </div>
        {/* Mobile skeleton */}
        <div className="grid gap-3 md:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-sm" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2 border-t pt-3">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  }

  // ── Empty State ──────────────────────────────────────────────────

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="rounded-lg border">
        <EmptyInvoiceState
          hasFilters={hasActiveFilters}
          onResetFilters={onResetFilters}
          onCreateClick={onCreateClick}
        />
      </div>
    );
  }

  // ── Table with Data ──────────────────────────────────────────────

  return (
    <>
      {/* Desktop: Table View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="hidden rounded-lg border md:block"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((invoice: any) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice as InvoiceData}
                onStatusUpdate={() => void refetch()}
              />
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Mobile: Card View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="grid gap-3 md:hidden"
      >
        {filteredData.map((invoice: any) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice as InvoiceData}
            onStatusUpdate={() => void refetch()}
          />
        ))}
      </motion.div>
    </>
  );
}
