"use client";

// src/features/invoices/components/InvoicesPageClient.tsx
// Client-side wrapper for invoices page with state management and layout.

import { useState } from "react";
import { motion } from "framer-motion";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { InvoiceToolbar } from "./InvoiceToolbar";
import { InvoiceList } from "./InvoiceList";
import { useInvoiceFilters } from "../hooks/useInvoiceFilters";
import type { StatusCount } from "./InvoiceToolbar";

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
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicesPageClient({
  clients,
  projects,
  isOwnerOrAdmin,
  userRole,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="mx-auto max-w-[1400px] space-y-8 p-6 md:p-8"
    >
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
      >
        {isOwnerOrAdmin && (
          <CreateInvoiceDialog
            clients={clients}
            projects={projects}
            triggerId="create-invoice-toolbar"
          />
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
            ? () => document.getElementById("create-invoice-toolbar")?.click()
            : undefined
        }
        onCountsChange={handleCountsChange}
      />
    </motion.div>
  );
}
