"use client";

// src/features/invoices/components/InvoicesPageClient.tsx
// Client-side wrapper for invoices page with state management and layout.

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { gooeyToast } from "goey-toast";
import { InvoiceToolbar } from "./InvoiceToolbar";
import { InvoiceList } from "./InvoiceList";
import { useInvoiceFilters } from "../hooks/useInvoiceFilters";
import type { StatusCount } from "./InvoiceToolbar";
import { PageLayout } from "@/app/(dashboard)/_components/PageLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string;
}

interface Project {
  id: string;
  clientId: string;
  name: string;
}

interface InvoicesPageClientProps {
  clients: Client[];
  projects: Project[];
  isOwnerOrAdmin: boolean;
  userRole: string;
  initialInvoices?: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicesPageClient({
  clients,
  projects,
  isOwnerOrAdmin,
  userRole,
  initialInvoices,
}: InvoicesPageClientProps) {
  const {
    search,
    setSearch,
    debouncedSearch,
    status,
    setStatus,
    sortBy,
    sortDir,
    toggleSort,
    hasActiveFilters,
    resetFilters,
  } = useInvoiceFilters();

  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([
    { key: "all", label: "All", count: 0 },
    { key: "draft", label: "Draft", count: 0 },
    { key: "sent", label: "Sent", count: 0 },
    { key: "paid", label: "Paid", count: 0 },
    { key: "overdue", label: "Overdue", count: 0 },
  ]);

  const handleCountsChange = (
    total: number,
    filtered: number,
    nextStatusCounts: StatusCount[],
  ) => {
    setTotalCount(total);
    setFilteredCount(filtered);
    setStatusCounts(nextStatusCounts);
  };

  const router = useRouter();
  const { data } = trpc.invoices.list.useQuery({ projectId: undefined });

  const handleExportCSV = () => {
    const items = data?.items;
    if (!items || items.length === 0) {
      gooeyToast.error("No invoices available to export.");
      return;
    }
    // Generate CSV
    const headers = ["Invoice Number", "Client", "Due Date", "Amount", "Currency", "Status"];
    const rows = items.map((inv: any) => [
      `INV-${inv.number}`,
      inv.client?.companyName || inv.client?.contactName || inv.client?.email || "Unknown",
      inv.dueDate || "--",
      (inv.amountCents / 100).toFixed(2),
      inv.currency,
      inv.status
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    gooeyToast.success("Invoices exported to CSV successfully!");
  };

  return (
    <PageLayout bleed>
      <InvoiceToolbar
        title="Invoices"
        subtitle={`${totalCount} invoices`}
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        totalCount={totalCount}
        filteredCount={filteredCount}
        statusCounts={statusCounts}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortByChange={toggleSort}
        onExportCSV={handleExportCSV}
      >
        {isOwnerOrAdmin && (
          <Link href="/invoices/create" passHref legacyBehavior>
            <Button className="group from-primary shadow-primary/25 hover:shadow-primary/40 relative overflow-hidden rounded-xl bg-linear-to-br to-indigo-600 px-6 font-bold tracking-wide text-white shadow-lg transition-[transform,shadow] duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95">
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <PlusIcon className="text-white hover:scale-105" />
              <span className="relative z-10 text-white">Create Invoice</span>
            </Button>
          </Link>
        )}
      </InvoiceToolbar>

      <InvoiceList
        statusFilter={status}
        searchQuery={debouncedSearch}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={toggleSort}
        userRole={userRole}
        onCreateClick={
          isOwnerOrAdmin
            ? () => router.push("/invoices/create")
            : undefined
        }
        onCountsChange={handleCountsChange}
        initialInvoices={initialInvoices}
      />
    </PageLayout>
  );
}
