"use client";
// ─── Main Component ───────────────────────────────────────────────────────────

// src/features/invoices/components/InvoiceList.tsx
// Invoice list with filtering, search, selection, and polished UI.

import React, { useMemo, useState, useTransition } from "react";
import { AlertCircleIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { gooeyToast } from "goey-toast";
import { bulkUpdateInvoiceStatus, deleteInvoices } from "../server/actions";
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
import { InvoiceBulkActionBar } from "./InvoiceBulkActionBar";
import { InvoiceFinancialSummary } from "./InvoiceFinancialSummary";
import type { InvoiceFilterStatus } from "../hooks/useInvoiceFilters";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceListProps {
  statusFilter?: InvoiceFilterStatus;
  searchQuery?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  onCreateClick?: () => void;
  onCountsChange?: (total: number, filtered: number) => void;
  projectId?: string; // Optional: filter invoices by project
}

interface InvoiceData {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoiceList({
  statusFilter = "all",
  searchQuery = "",
  hasActiveFilters = false,
  onResetFilters,
  onCreateClick,
  onCountsChange,
  projectId,
}: InvoiceListProps) {
  // Fetch data based on whether we're filtering by project or not
  const globalQuery = trpc.invoice.getAll.useQuery(
    {
      status: statusFilter === "all" ? undefined : (statusFilter as any),
    },
    {
      enabled: !projectId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  );

  const projectQuery = trpc.invoice.getByProject.useQuery(
    { projectId: projectId! },
    {
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  );

  // Use the appropriate query result
  const { data, isLoading, error, refetch } = projectId
    ? projectQuery
    : globalQuery;

  // Selected row state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();

  const handleSelectAllChange = (checked: boolean) => {
    if (checked && filteredData) {
      setSelectedIds(new Set(filteredData.map((inv: InvoiceData) => inv.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleRowSelectChange = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  // Client-side filtering for search
  const filteredData = useMemo(() => {
    if (!data || !searchQuery) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((invoice: InvoiceData) => {
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

  // Calculate financial summary from data
  const summary = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let overdue = 0;

    if (data) {
      data.forEach((inv: InvoiceData) => {
        totalBilled += inv.amountCents;
        if (inv.status === "paid") {
          totalPaid += inv.amountCents;
        }
        if (inv.status === "sent" || inv.status === "overdue") {
          outstanding += inv.amountCents;
        }
        if (inv.status === "overdue") {
          overdue += inv.amountCents;
        }
      });
    }

    return { totalBilled, totalPaid, outstanding, overdue, currency: "USD" };
  }, [data]);

  const allSelected =
    filteredData &&
    filteredData.length > 0 &&
    selectedIds.size === filteredData.length;
  const indeterminate =
    selectedIds.size > 0 && selectedIds.size < (filteredData?.length ?? 0);

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
      <div className="space-y-6">
        <InvoiceFinancialSummary
          totalBilled={0}
          totalPaid={0}
          outstanding={0}
          overdue={0}
          loading
        />
        <div className="hidden md:block">
          <InvoiceTableSkeleton rows={5} />
        </div>
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
      </div>
    );
  }

  // ── Empty State ──────────────────────────────────────────────────

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="space-y-6">
        <InvoiceFinancialSummary {...summary} />
        <div className="rounded-lg border shadow-sm">
          <EmptyInvoiceState
            hasFilters={hasActiveFilters}
            onResetFilters={onResetFilters}
            onCreateClick={onCreateClick}
          />
        </div>
      </div>
    );
  }

  // ── Table with Data ──────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <InvoiceFinancialSummary {...summary} />

      <InvoiceBulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onSend={() => {
          startBulkTransition(async () => {
            const ids = Array.from(selectedIds);
            const res = await bulkUpdateInvoiceStatus({
              invoiceIds: ids,
              status: "sent",
            });
            if (res.success) {
              gooeyToast.success(`Sent ${ids.length} invoices.`);
              setSelectedIds(new Set());
              refetch();
            } else {
              gooeyToast.error(res.error ?? "Failed to send invoices.");
            }
          });
        }}
        onDownload={() => {
          const ids = Array.from(selectedIds);
          if (ids.length > 5) {
            gooeyToast.error(
              "Please select up to 5 invoices to download at once.",
            );
            return;
          }
          let delay = 0;
          ids.forEach((id) => {
            setTimeout(() => {
              window.open(`/api/invoices/${id}/pdf`, "_blank");
            }, delay);
            delay += 300;
          });
          gooeyToast.success(`Downloading ${ids.length} PDFs...`);
          setSelectedIds(new Set());
        }}
        onMarkPaid={() => {
          startBulkTransition(async () => {
            const ids = Array.from(selectedIds);
            const res = await bulkUpdateInvoiceStatus({
              invoiceIds: ids,
              status: "paid",
            });
            if (res.success) {
              gooeyToast.success(`Marked ${ids.length} invoices as paid.`);
              setSelectedIds(new Set());
              refetch();
            } else {
              gooeyToast.error(res.error ?? "Failed to mark as paid.");
            }
          });
        }}
        onDelete={() => {
          startBulkTransition(async () => {
            const ids = Array.from(selectedIds);
            const res = await deleteInvoices(ids);
            if (res.success) {
              gooeyToast.success(`Deleted ${ids.length} invoices.`);
              setSelectedIds(new Set());
              refetch();
            } else {
              gooeyToast.error(res.error ?? "Failed to delete invoices.");
            }
          });
        }}
      />

      {/* Desktop: Table View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-card text-card-foreground hidden overflow-hidden rounded-xl border shadow-sm md:block"
      >
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  checked={allSelected}
                  indeterminate={indeterminate}
                  onCheckedChange={handleSelectAllChange}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[100px] font-medium">Invoice #</TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">Issued</TableHead>
              <TableHead className="font-medium">Due</TableHead>
              <TableHead className="font-medium">Amount</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((invoice: InvoiceData) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                isSelected={selectedIds.has(invoice.id)}
                onSelectChange={(checked) =>
                  handleRowSelectChange(invoice.id, checked)
                }
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
        className="grid gap-3 shadow-sm md:hidden"
      >
        {filteredData.map((invoice: InvoiceData) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            onStatusUpdate={() => void refetch()}
          />
        ))}
      </motion.div>
    </div>
  );
}
