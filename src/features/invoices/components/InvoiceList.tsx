"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  AlertCircleIcon,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { bulkUpdateInvoiceStatus, deleteInvoices } from "../server/actions";
import { InvoiceRow } from "./InvoiceRow";
import { InvoiceCard } from "./InvoiceCard";
import { InvoiceTableSkeleton } from "./InvoiceTableSkeleton";
import { InvoiceBulkActionBar } from "./InvoiceBulkActionBar";
import { InvoiceFinancialSummary } from "./InvoiceFinancialSummary";
import { InvoicePreviewPanel } from "./InvoicePreviewPanel";
import type {
  InvoiceFilterStatus,
  InvoiceSortBy,
  InvoiceSortDir,
} from "../hooks/useInvoiceFilters";
import type { StatusCount } from "./InvoiceToolbar";

function tableLayoutClass(view: "desktop" | "tablet"): string {
  if (view === "desktop") return "hidden lg:block";
  return "hidden md:block lg:hidden";
}

interface InvoiceListProps {
  statusFilter?: InvoiceFilterStatus;
  searchQuery?: string;
  sortBy?: InvoiceSortBy;
  sortDir?: InvoiceSortDir;
  onSortChange?: (column: InvoiceSortBy) => void;
  userRole?: string;
  onCreateClick?: () => void;
  onCountsChange?: (
    total: number,
    filtered: number,
    statusCounts: StatusCount[],
  ) => void;
  projectId?: string;
  initialInvoices?: any;
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
  clientId: string;
  pdfUrl: string | null;
  pdfStatus: string | null;
}

function timeValue(dateString?: string | null): number {
  if (!dateString) return 0;
  const ms = new Date(dateString).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function EmptyTabState({
  status,
  onCreateClick,
}: {
  status: InvoiceFilterStatus;
  onCreateClick?: () => void;
}) {
  const copyMap: Record<
    InvoiceFilterStatus,
    { title: string; subtitle: string }
  > = {
    all: {
      title: "No invoices yet",
      subtitle:
        "Create your first invoice to start tracking billing and payments.",
    },
    draft: {
      title: "No draft invoices",
      subtitle:
        "Drafts let you prepare invoices before sending them to clients.",
    },
    sent: {
      title: "No sent invoices",
      subtitle: "Sent invoices will appear here once they are delivered.",
    },
    paid: {
      title: "No paid invoices",
      subtitle: "Paid invoices are shown here once payments are settled.",
    },
    overdue: {
      title: "No overdue invoices",
      subtitle: "Great news - you currently have no overdue invoices.",
    },
  };

  const copy = copyMap[status] ?? copyMap.all;

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-(--inv-border) bg-[var(--inv-surface)] px-6 py-12 text-center shadow-sm">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-(--inv-border) bg-[var(--inv-surface-elevated)]">
        {/* Geometric Line Art Abstract */}
        <div className="absolute inset-2 rounded-full border border-[var(--inv-accent-primary)] opacity-20" />
        <div className="absolute inset-4 rounded-full border border-[var(--inv-accent-primary)] opacity-40" />
        <FileText
          className="h-8 w-8 text-(--inv-accent-primary)"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="font-display text-xl font-bold tracking-tight text-[var(--inv-text-primary)]">
        {copy.title}
      </h3>
      <p className="font-data mt-3 max-w-sm text-[13px] leading-relaxed text-(--inv-text-secondary)">
        {copy.subtitle}
      </p>
      {status === "draft" && onCreateClick && (
        <Button
          className="mt-8 h-10 rounded-full bg-[var(--inv-accent-primary)] px-6 font-medium tracking-wide text-white transition-all hover:scale-105 hover:bg-[var(--inv-accent-hover)] active:scale-95"
          onClick={onCreateClick}
        >
          Create Invoice
        </Button>
      )}
    </div>
  );
}

export function InvoiceList({
  statusFilter = "all",
  searchQuery = "",
  sortBy = "due",
  sortDir = "desc",
  onSortChange,
  onCreateClick,
  onCountsChange,
  projectId,
  initialInvoices,
}: InvoiceListProps) {
  const { data, isLoading, error, refetch } = trpc.invoices.list.useQuery(
    { projectId },
    {
      initialData: initialInvoices,
      // Poll every 3 seconds while any PDF is being generated.
      // Uses a selector-free approach: refetchInterval receives the latest data
      // directly so we don't need a separate useMemo before the query.
      refetchInterval: (query) => {
        const items = query.state.data?.items as
          | Array<{ pdfStatus?: string }>
          | undefined;
        const hasPending = items?.some(
          (inv) =>
            inv.pdfStatus === "pending" || inv.pdfStatus === "generating",
        );
        return hasPending ? 3000 : false;
      },
    },
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);

  const mappedInvoices = useMemo<InvoiceData[]>(() => {
    const items = data?.items;
    if (!items) return [];
    return items.map((item: any) => ({
      id: item.id,
      number: item.number,
      status: item.status,
      amountCents: item.amountCents,
      currency: item.currency,
      dueDate: item.dueDate,
      clientId: item.clientId,
      clientCompanyName: item.client?.companyName ?? null,
      clientContactName: item.client?.contactName ?? null,
      clientEmail: item.client?.email ?? null,
      pdfUrl: item.pdfUrl ?? null,
      pdfStatus: item.pdfStatus ?? null,
    }));
  }, [data?.items]);

  const filteredData = useMemo(() => {
    const baseRows =
      statusFilter === "all"
        ? mappedInvoices
        : mappedInvoices.filter((invoice) => invoice.status === statusFilter);
    if (!searchQuery) return baseRows;

    const query = searchQuery.toLowerCase();
    return baseRows.filter((invoice) => {
      const invoiceNumber = `INV-${invoice.number}`.toLowerCase();
      const clientName = (
        invoice.clientCompanyName ??
        invoice.clientContactName ??
        invoice.clientEmail ??
        ""
      )
        .replace(/,+/g, " ")
        .toLowerCase();

      return (
        invoiceNumber.includes(query) ||
        clientName.includes(query) ||
        String(invoice.amountCents).includes(query)
      );
    });
  }, [mappedInvoices, searchQuery, statusFilter]);

  const sortedData = useMemo(() => {
    const rows = [...filteredData];
    rows.sort((a, b) => {
      let left = 0;
      let right = 0;

      if (sortBy === "number") {
        left = a.number;
        right = b.number;
      } else if (sortBy === "issued") {
        left = timeValue(a.issuedDate || a.dueDate);
        right = timeValue(b.issuedDate || b.dueDate);
      } else if (sortBy === "due") {
        left = timeValue(a.dueDate);
        right = timeValue(b.dueDate);
      } else {
        left = a.amountCents;
        right = b.amountCents;
      }

      return sortDir === "asc" ? left - right : right - left;
    });
    return rows;
  }, [filteredData, sortBy, sortDir]);

  const summary = useMemo(() => {
    const rows = mappedInvoices;
    let totalBilled = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let overdue = 0;
    let paidInvoices = 0;
    let outstandingInvoices = 0;
    let overdueInvoices = 0;

    rows.forEach((inv) => {
      totalBilled += inv.amountCents;
      if (inv.status === "paid") {
        totalPaid += inv.amountCents;
        paidInvoices += 1;
      }
      if (inv.status === "sent" || inv.status === "overdue") {
        outstanding += inv.amountCents;
        outstandingInvoices += 1;
      }
      if (inv.status === "overdue") {
        overdue += inv.amountCents;
        overdueInvoices += 1;
      }
    });

    return {
      totalBilled,
      totalPaid,
      outstanding,
      overdue,
      currency: "USD",
      totalInvoices: rows.length,
      paidInvoices,
      outstandingInvoices,
      overdueInvoices,
    };
  }, [mappedInvoices]);

  const statusCounts = useMemo<StatusCount[]>(() => {
    const rows = mappedInvoices;
    const draft = rows.filter((r) => r.status === "draft").length;
    const sent = rows.filter((r) => r.status === "sent").length;
    const paid = rows.filter((r) => r.status === "paid").length;
    const overdue = rows.filter((r) => r.status === "overdue").length;

    return [
      { key: "all", label: "All", count: rows.length },
      { key: "draft", label: "Draft", count: draft },
      { key: "sent", label: "Sent", count: sent },
      { key: "paid", label: "Paid", count: paid },
      { key: "overdue", label: "Overdue", count: overdue },
    ];
  }, [mappedInvoices]);

  React.useEffect(() => {
    onCountsChange?.(data?.items?.length ?? 0, sortedData.length, statusCounts);
  }, [data, sortedData.length, statusCounts, onCountsChange]);

  const allSelected =
    sortedData.length > 0 && selectedIds.size === sortedData.length;
  const indeterminate =
    selectedIds.size > 0 && selectedIds.size < sortedData.length;

  const handleSelectAllChange = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(sortedData.map((inv) => inv.id)));
  };

  const handleRowSelectChange = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const selectedTotal = selectedIds.size;

  const renderSortHeader = (label: string, key: InvoiceSortBy) => {
    const active = sortBy === key;
    return (
      <button
        type="button"
        onClick={() => onSortChange?.(key)}
        className="group font-data inline-flex items-center gap-1 text-left text-[11px] tracking-[0.08em] uppercase transition-colors hover:text-[var(--inv-text-primary)]"
        aria-label={`Sort by ${label}`}
      >
        <span
          className={cn(
            active
              ? "font-bold text-(--inv-accent-primary)"
              : "text-(--inv-text-secondary)",
          )}
        >
          {label}
        </span>
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-(--inv-accent-primary)" />
          ) : (
            <ArrowDown className="h-3 w-3 text-(--inv-accent-primary)" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-[var(--inv-text-muted)] opacity-0 transition-opacity group-hover:opacity-50" />
        )}
      </button>
    );
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        <AlertCircleIcon className="h-4 w-4 shrink-0" />
        <span className="font-medium">Failed to load invoices.</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          className="ml-auto border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
        >
          Try again
        </Button>
      </div>
    );
  }

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
            <div
              key={i}
              className="rounded-xl border border-(--inv-border) bg-[var(--inv-surface)] p-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20 opacity-20" />
                    <Skeleton className="h-3 w-32 opacity-20" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-sm opacity-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 opacity-20" />
                  <Skeleton className="h-4 w-24 opacity-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const showEmpty = sortedData.length === 0;

  return (
    <div className="space-y-6">
      <InvoiceFinancialSummary {...summary} />

      <InvoiceBulkActionBar
        selectedCount={selectedTotal}
        totalCount={sortedData.length}
        onSelectAll={() =>
          setSelectedIds(new Set(sortedData.map((inv) => inv.id)))
        }
        onClearSelection={() => setSelectedIds(new Set())}
        onSend={() => {
          if (isBulkPending) return;
          startBulkTransition(async () => {
            const ids = Array.from(selectedIds);
            const res = await bulkUpdateInvoiceStatus({
              invoiceIds: ids,
              status: "sent",
            });
            if (res.success) {
              gooeyToast.success(`Sent ${ids.length} invoices.`);
              setSelectedIds(new Set());
              void refetch();
            } else {
              gooeyToast.error(res.error ?? "Failed to send invoices.");
            }
          });
        }}
        onDownload={() => {
          const ids = Array.from(selectedIds);
          ids.forEach((id, idx) => {
            const inv = mappedInvoices.find((i) => i.id === id);
            const url =
              inv?.pdfStatus === "ready" && inv.pdfUrl
                ? inv.pdfUrl
                : `/api/invoices/${id}/pdf`;
            setTimeout(() => {
              window.open(url, "_blank", "noopener,noreferrer");
            }, idx * 250);
          });
          gooeyToast.success(`Downloading ${ids.length} PDFs...`);
        }}
        onMarkPaid={() => {
          if (isBulkPending) return;
          startBulkTransition(async () => {
            const ids = Array.from(selectedIds);
            const res = await bulkUpdateInvoiceStatus({
              invoiceIds: ids,
              status: "paid",
            });
            if (res.success) {
              gooeyToast.success(`Marked ${ids.length} invoices as paid.`);
              setSelectedIds(new Set());
              void refetch();
            } else {
              gooeyToast.error(res.error ?? "Failed to mark invoices as paid.");
            }
          });
        }}
        onDelete={() => {
          if (isBulkPending) return;
          startBulkTransition(async () => {
            const ids = Array.from(selectedIds);
            const res = await deleteInvoices(ids);
            if (res.success) {
              gooeyToast.success(`Deleted ${ids.length} invoices.`);
              setSelectedIds(new Set());
              void refetch();
            } else {
              gooeyToast.error(res.error ?? "Failed to delete invoices.");
            }
          });
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "overflow-hidden rounded-xl border border-(--inv-border) bg-[var(--inv-surface)] shadow-md",
          tableLayoutClass("desktop"),
        )}
      >
        {showEmpty ? (
          <EmptyTabState status={statusFilter} onCreateClick={onCreateClick} />
        ) : (
          <Table>
            <TableHeader className="border-b border-(--inv-border) bg-[var(--inv-surface-elevated)]">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead scope="col" className="w-[40px] pl-4">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onCheckedChange={handleSelectAllChange}
                    aria-label="Select all invoices"
                    className="border-(--inv-border) text-white data-[state=checked]:border-[var(--inv-accent-primary)] data-[state=checked]:bg-[var(--inv-accent-primary)]"
                  />
                </TableHead>
                <TableHead scope="col" className="w-[140px]">
                  {renderSortHeader("Invoice #", "number")}
                </TableHead>
                <TableHead
                  scope="col"
                  className="font-data min-w-[180px] text-[11px] tracking-[0.08em] text-(--inv-text-secondary) uppercase"
                >
                  Client
                </TableHead>
                <TableHead scope="col">
                  {renderSortHeader("Issued", "issued")}
                </TableHead>
                <TableHead scope="col">
                  {renderSortHeader("Due", "due")}
                </TableHead>
                <TableHead scope="col" className="text-right">
                  {renderSortHeader("Amount", "amount")}
                </TableHead>
                <TableHead
                  scope="col"
                  className="font-data text-[11px] tracking-[0.08em] text-(--inv-text-secondary) uppercase"
                >
                  Status
                </TableHead>
                <TableHead
                  scope="col"
                  className="font-data text-right text-[11px] tracking-[0.08em] text-(--inv-text-secondary) uppercase"
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={{
                    ...invoice,
                    pdfUrl: invoice.pdfUrl,
                    pdfStatus: invoice.pdfStatus,
                  }}
                  isSelected={selectedIds.has(invoice.id)}
                  onSelectChange={(checked) =>
                    handleRowSelectChange(invoice.id, checked)
                  }
                  onStatusUpdate={() => void refetch()}
                  onClickRow={() => setPreviewInvoiceId(invoice.id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "overflow-hidden rounded-xl border border-(--inv-border) bg-[var(--inv-surface)] shadow-md",
          tableLayoutClass("tablet"),
        )}
      >
        {showEmpty ? (
          <EmptyTabState status={statusFilter} onCreateClick={onCreateClick} />
        ) : (
          <Table>
            <TableHeader className="border-b border-(--inv-border) bg-[var(--inv-surface-elevated)]">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead scope="col" className="w-[40px] pl-4">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onCheckedChange={handleSelectAllChange}
                    aria-label="Select all invoices"
                    className="border-(--inv-border) text-white data-[state=checked]:border-[var(--inv-accent-primary)] data-[state=checked]:bg-[var(--inv-accent-primary)]"
                  />
                </TableHead>
                <TableHead scope="col" className="w-[140px]">
                  {renderSortHeader("Invoice #", "number")}
                </TableHead>
                <TableHead
                  scope="col"
                  className="font-data min-w-[180px] text-[11px] tracking-[0.08em] text-(--inv-text-secondary) uppercase"
                >
                  Client
                </TableHead>
                <TableHead scope="col">
                  {renderSortHeader("Due", "due")}
                </TableHead>
                <TableHead scope="col" className="text-right">
                  {renderSortHeader("Amount", "amount")}
                </TableHead>
                <TableHead
                  scope="col"
                  className="font-data text-[11px] tracking-[0.08em] text-(--inv-text-secondary) uppercase"
                >
                  Status
                </TableHead>
                <TableHead
                  scope="col"
                  className="font-data text-right text-[11px] tracking-[0.08em] text-(--inv-text-secondary) uppercase"
                >
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((invoice) => (
                <InvoiceRow
                  key={`tablet-${invoice.id}`}
                  invoice={{
                    ...invoice,
                    pdfUrl: invoice.pdfUrl,
                    pdfStatus: invoice.pdfStatus,
                  }}
                  isSelected={selectedIds.has(invoice.id)}
                  onSelectChange={(checked) =>
                    handleRowSelectChange(invoice.id, checked)
                  }
                  onStatusUpdate={() => void refetch()}
                  onClickRow={() => setPreviewInvoiceId(invoice.id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="grid gap-3 md:hidden"
      >
        {showEmpty ? (
          <EmptyTabState status={statusFilter} onCreateClick={onCreateClick} />
        ) : (
          sortedData.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onStatusUpdate={() => void refetch()}
            />
          ))
        )}
      </motion.div>

      <InvoicePreviewPanel
        invoiceId={previewInvoiceId}
        onClose={() => setPreviewInvoiceId(null)}
      />
    </div>
  );
}
