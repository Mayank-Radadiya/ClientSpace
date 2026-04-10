"use client";

// src/features/invoices/components/InvoicesPageClient.tsx
// Client-side wrapper for invoices page with state management and layout.

import { useState } from "react";
import { motion } from "framer-motion";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { InvoiceToolbar } from "./InvoiceToolbar";
import { InvoiceList } from "./InvoiceList";
import { useInvoiceFilters } from "../hooks/useInvoiceFilters";

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
    hasActiveFilters,
    resetFilters,
  } = useInvoiceFilters();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  const handleCountsChange = (total: number, filtered: number) => {
    setTotalCount(total);
    setFilteredCount(filtered);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="mx-auto max-w-[1400px] space-y-8 p-6 md:p-8"
    >
      {/* ── Page Header ───────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {userRole === "client"
            ? "View and download your invoices."
            : "Manage your client invoices and track payments."}
        </p>
      </div>

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
      >
        {isOwnerOrAdmin && (
          <CreateInvoiceDialog clients={clients} projects={projects} />
        )}
      </InvoiceToolbar>

      {/* ── Invoice List (Includes Financial Summary) ──────────── */}
      <InvoiceList
        statusFilter={status}
        searchQuery={debouncedSearch}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        onCreateClick={
          isOwnerOrAdmin ? () => setCreateDialogOpen(true) : undefined
        }
        onCountsChange={handleCountsChange}
      />
    </motion.div>
  );
}
