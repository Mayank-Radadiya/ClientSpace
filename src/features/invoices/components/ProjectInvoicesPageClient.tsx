// src/features/invoices/components/ProjectInvoicesPageClient.tsx
// Client component for project-scoped invoices page

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { InvoiceFinancialSummary } from "./InvoiceFinancialSummary";
import { InvoiceToolbar } from "./InvoiceToolbar";
import { InvoiceList } from "./InvoiceList";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { useInvoiceFilters } from "../hooks/useInvoiceFilters";

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
    hasActiveFilters,
    resetFilters,
  } = useInvoiceFilters();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // Fetch project financials
  const { data: financials, isLoading: financialsLoading } =
    trpc.invoice.getProjectFinancials.useQuery({
      projectId: projectInfo.id,
    });

  const handleCountsChange = (total: number, filtered: number) => {
    setTotalCount(total);
    setFilteredCount(filtered);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="space-y-6 p-6 md:p-8"
    >
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-brand text-2xl font-semibold tracking-tight">
            Invoices
          </h1>
          {projectInfo.clientCompanyName && (
            <p className="text-muted-foreground mt-1 text-sm">
              {projectInfo.clientCompanyName}
            </p>
          )}
        </div>

        {/* Create Invoice Button (owner/admin only) */}
        {isOwnerOrAdmin && (
          <CreateInvoiceDialog clients={clients} projects={projects} />
        )}
      </div>

      {/* ── Financial Summary ─────────────────────────────────── */}
      <InvoiceFinancialSummary
        totalBilled={financials?.totalBilled ?? 0}
        totalPaid={financials?.totalPaid ?? 0}
        outstanding={financials?.outstanding ?? 0}
        loading={financialsLoading}
      />

      {/* ── Toolbar: Search + Filters ────────────────────────── */}
      <InvoiceToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      {/* ── Invoice List ──────────────────────────────────────── */}
      <InvoiceList
        statusFilter={status}
        searchQuery={debouncedSearch}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        onCreateClick={
          isOwnerOrAdmin ? () => setCreateDialogOpen(true) : undefined
        }
        onCountsChange={handleCountsChange}
        projectId={projectInfo.id}
      />
    </motion.div>
  );
}
