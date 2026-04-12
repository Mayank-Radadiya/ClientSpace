// src/features/invoices/components/ProjectInvoicesPageClient.tsx
// Client component for project-scoped invoices page

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { InvoiceToolbar } from "./InvoiceToolbar";
import { InvoiceList } from "./InvoiceList";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { useInvoiceFilters } from "../hooks/useInvoiceFilters";
import type { StatusCount } from "./InvoiceToolbar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectInfo {
  id: string;
  name: string;
  clientId: string;
  clientCompanyName: string | null;
}

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

interface ProjectInvoicesPageClientProps {
  projectInfo: ProjectInfo;
  clients: Client[];
  projects: Project[];
  isOwnerOrAdmin: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectInvoicesPageClient({
  projectInfo,
  clients,
  projects,
  isOwnerOrAdmin,
}: ProjectInvoicesPageClientProps) {
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
      className="space-y-6 p-6 md:p-8"
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
            triggerId="project-create-invoice-toolbar"
          />
        )}
      </InvoiceToolbar>

      <InvoiceList
        statusFilter={status}
        searchQuery={debouncedSearch}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={toggleSort}
        userRole="owner"
        onCreateClick={
          isOwnerOrAdmin
            ? () =>
                document
                  .getElementById("project-create-invoice-toolbar")
                  ?.click()
            : undefined
        }
        onCountsChange={handleCountsChange}
        projectId={projectInfo.id}
      />
    </motion.div>
  );
}
