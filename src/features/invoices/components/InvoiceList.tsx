"use client";

import React, { useMemo, useState, useTransition } from "react";
import { AlertCircleIcon, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
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
    <div className="border-border/70 bg-muted/10 flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center">
      <h3 className="text-base font-semibold">{copy.title}</h3>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">
        {copy.subtitle}
      </p>
      {status === "draft" && onCreateClick && (
        <Button className="mt-4" onClick={onCreateClick}>
          Create invoice
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
}: InvoiceListProps) {
  const globalQuery = trpc.invoice.getAll.useQuery(
    { status: undefined },
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

  const { data, isLoading, error, refetch } = projectId
    ? projectQuery
    : globalQuery;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();

  const filteredData = useMemo(() => {
    if (!data) return [] as InvoiceData[];
    const baseRows =
      statusFilter === "all"
        ? (data as InvoiceData[])
        : (data as InvoiceData[]).filter(
            (invoice) => invoice.status === statusFilter,
          );
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
  }, [data, searchQuery, statusFilter]);

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
    const rows = (data as InvoiceData[] | undefined) ?? [];
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
  }, [data]);

  const statusCounts = useMemo<StatusCount[]>(() => {
    const rows = (data as InvoiceData[] | undefined) ?? [];
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
  }, [data]);

  React.useEffect(() => {
    onCountsChange?.(data?.length ?? 0, sortedData.length, statusCounts);
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
        className={
          "group inline-flex items-center gap-1 text-left text-xs tracking-[0.08em] uppercase"
        }
        aria-label={`Sort by ${label}`}
      >
        <span className={cn(active ? "text-primary" : "text-muted-foreground")}>
          {label}
        </span>
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="text-primary h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="text-primary h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="text-muted-foreground/0 group-hover:text-muted-foreground h-3.5 w-3.5" />
        )}
      </button>
    );
  };

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
              </div>
            </Card>
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
            setTimeout(() => {
              window.open(
                `/api/invoices/${id}/pdf`,
                "_blank",
                "noopener,noreferrer",
              );
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
          "bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm",
          tableLayoutClass("desktop"),
        )}
      >
        {showEmpty ? (
          <div className="p-4">
            <EmptyTabState
              status={statusFilter}
              onCreateClick={onCreateClick}
            />
          </div>
        ) : (
          <Table>
            {/* <TableCaption>
              {userRole === "client"
                ? "List of invoices available for viewing and downloading."
                : "Invoice register with status, due dates, and payment actions."}
            </TableCaption> */}
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col" className="w-[40px] pl-4">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onCheckedChange={handleSelectAllChange}
                    aria-label="Select all invoices"
                  />
                </TableHead>
                <TableHead scope="col" className="w-[140px] font-medium">
                  {renderSortHeader("Invoice #", "number")}
                </TableHead>
                <TableHead scope="col" className="min-w-[180px] font-medium">
                  Client
                </TableHead>
                <TableHead scope="col" className="font-medium">
                  {renderSortHeader("Issued", "issued")}
                </TableHead>
                <TableHead scope="col" className="font-medium">
                  {renderSortHeader("Due", "due")}
                </TableHead>
                <TableHead scope="col" className="font-medium">
                  {renderSortHeader("Amount", "amount")}
                </TableHead>
                <TableHead scope="col" className="font-medium">
                  Status
                </TableHead>
                <TableHead scope="col" className="text-right font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((invoice) => (
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
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm",
          tableLayoutClass("tablet"),
        )}
      >
        {showEmpty ? (
          <div className="p-4">
            <EmptyTabState
              status={statusFilter}
              onCreateClick={onCreateClick}
            />
          </div>
        ) : (
          <Table>
            <TableCaption>
              Compact invoices table for medium screens.
            </TableCaption>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col" className="w-[40px] pl-4">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={indeterminate}
                    onCheckedChange={handleSelectAllChange}
                    aria-label="Select all invoices"
                  />
                </TableHead>
                <TableHead scope="col" className="w-[140px] font-medium">
                  {renderSortHeader("Invoice #", "number")}
                </TableHead>
                <TableHead scope="col" className="min-w-[180px] font-medium">
                  Client
                </TableHead>
                <TableHead scope="col" className="font-medium">
                  {renderSortHeader("Due", "due")}
                </TableHead>
                <TableHead scope="col" className="font-medium">
                  {renderSortHeader("Amount", "amount")}
                </TableHead>
                <TableHead scope="col" className="font-medium">
                  Status
                </TableHead>
                <TableHead scope="col" className="text-right font-medium">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((invoice) => (
                <InvoiceRow
                  key={`tablet-${invoice.id}`}
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
    </div>
  );
}
