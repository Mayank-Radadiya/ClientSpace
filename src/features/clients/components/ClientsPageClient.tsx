"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";

import { useClients } from "../hooks/useClients";
import { useClientSheet } from "../hooks/useClientSheet";
import { useBulkSelect } from "../hooks/useBulkSelect";
import { useToast } from "../hooks/useToast";

// Components
import { ClientsHeader } from "./ClientsHeader";
import { ClientsPremiumStats } from "./ClientsPremiumStats";
import { ClientsFilterBar } from "./ClientsFilterBar";
import { ClientsEmptyState } from "./ClientsEmptyState";
import { ClientsGrid } from "./ClientsGrid";
import { ClientsList } from "./ClientsList";
import { ClientDetailSheet } from "./ClientDetailSheet";
import { AddClientModal } from "./AddClientModal";
import { EditClientModal } from "./EditClientModal";
import { DeleteClientModal } from "./DeleteClientModal";
import { BulkActionBar } from "./BulkActionBar";
import { ToastStack } from "./ToastStack";
import { InviteClientDialog } from "./InviteClientDialog";

import type { ClientListItem, ClientDisplayStatus } from "../client.types";

type Role = "owner" | "admin" | "member" | "client";

type ClientsPageClientProps = {
  role: Role;
};

export function ClientsPageClient({ role }: ClientsPageClientProps) {
  const utils = trpc.useUtils();
  const toast = useToast();

  const { data, isFetching, isLoading } = trpc.clients.getBootstrap.useQuery();

  const clients = data?.clients ?? [];
  const stats = data?.stats ?? {
    totalClients: 0,
    activeClients: 0,
    activeProjects: 0,
    outstandingInvoicesCents: 0,
  };

  const {
    view,
    setView,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statFilter,
    setStatFilter,
    sort,
    setSort,
    counts,
    totalFiltered,
    visibleClients,
    canLoadMore,
    loadMore,
    clearFilters,
  } = useClients({ clients });

  const { isOpen, setIsOpen, selectedClient, tab, setTab, openClient } =
    useClientSheet(clients);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editModalClient, setEditModalClient] = useState<ClientListItem | null>(null);
  const [deleteModalClient, setDeleteModalClient] = useState<ClientListItem | null>(null);

  // ── Bulk select ────────────────────────────────────────────────────────────
  const allIds = visibleClients.map((c) => c.id);
  const { selected, toggle, selectAll, clearAll, isSelected, count: selectedCount, allSelected, someSelected } = useBulkSelect({ ids: allIds });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const archiveMutation = trpc.clients.archiveClient.useMutation({
    onSuccess: (_, { clientId }) => {
      utils.clients.getBootstrap.invalidate();
      const client = clients.find((c) => c.id === clientId);
      toast.success(
        `${client?.companyName ?? "Client"} archived`,
        {
          undoLabel: "Undo",
          onUndo: () => unarchiveMutation.mutate({ clientId }),
        },
      );
    },
    onError: (err) => toast.error(err.message || "Failed to archive client"),
  });

  const unarchiveMutation = trpc.clients.unarchiveClient.useMutation({
    onSuccess: () => utils.clients.getBootstrap.invalidate(),
  });

  const invalidate = useCallback(() => {
    utils.clients.getBootstrap.invalidate();
  }, [utils]);

  // ── Status change (toggle active ↔ archived) ───────────────────────────────
  function handleStatusChange(id: string, newStatus: ClientDisplayStatus) {
    if (newStatus === "archived") {
      archiveMutation.mutate({ clientId: id });
    } else if (newStatus === "active") {
      unarchiveMutation.mutate({ clientId: id });
    }
    // inactive / pending are derived — not user-settable via DB
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────
  function handleBulkArchive() {
    const ids = Array.from(selected);
    ids.forEach((id) => archiveMutation.mutate({ clientId: id }));
    clearAll();
  }

  function handleBulkDelete() {
    // Open delete modal for first selected; sequential delete not ideal — 
    // For simplicity, prompt user to delete individually
    const id = Array.from(selected)[0];
    const client = clients.find((c) => c.id === id);
    if (client) setDeleteModalClient(client);
    clearAll();
  }

  function handleBulkExport() {
    const selectedClients = clients.filter((c) => selected.has(c.id));
    const csv = [
      "Company,Contact,Email,Status,Projects,Outstanding",
      ...selectedClients.map((c) =>
        [c.companyName, c.contactName, c.email, c.displayStatus, c.activeProjectCount, c.outstandingAmountCents / 100].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(url);
    clearAll();
    toast.success(`Exported ${selectedClients.length} clients`);
  }

  // ── Sheet queries ─────────────────────────────────────────────────────────
  const selectedClientId = selectedClient?.id;

  const projectsQuery = trpc.clients.getClientProjects.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: isOpen && !!selectedClientId && (tab === "projects" || tab === "overview") },
  );

  const invoicesQuery = trpc.clients.getClientInvoices.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: isOpen && !!selectedClientId && (tab === "invoices" || tab === "overview") },
  );

  const activityQuery = trpc.clients.getClientActivity.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: isOpen && !!selectedClientId && (tab === "activity" || tab === "overview") },
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-background border-border text-foreground relative mb-8 min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-2xl border p-6 shadow-lg md:p-10">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="bg-muted h-8 w-48 animate-pulse rounded-lg" />
              <div className="bg-muted h-4 w-72 animate-pulse rounded-lg" />
            </div>
            <div className="bg-muted h-10 w-36 animate-pulse rounded-xl" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-muted h-28 animate-pulse rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="bg-muted h-40 animate-pulse rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border-border text-foreground relative mb-8 min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-2xl border p-6 shadow-lg md:p-10">
      <div className="relative z-10 space-y-6">
        <ClientsHeader
          view={view}
          setView={setView}
          search={search}
          setSearch={setSearch}
          role={role}
          onAddClient={() => setAddModalOpen(true)}
          onInviteClient={() => setInviteOpen(true)}
          onExport={handleBulkExport}
        />

        <ClientsPremiumStats
          stats={{
            totalClients: stats.totalClients,
            activeProjects: stats.activeProjects,
            outstandingInvoicesCents: stats.outstandingInvoicesCents,
          }}
          statFilter={statFilter}
          setStatFilter={setStatFilter}
        />

        <ClientsFilterBar
          counts={counts}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          totalFiltered={totalFiltered}
          sort={sort}
          setSort={setSort}
        />

        {/* Content */}
        {visibleClients.length === 0 ? (
          <ClientsEmptyState clearFilters={clearFilters} />
        ) : view === "grid" ? (
          <ClientsGrid
            clients={visibleClients}
            selected={selected}
            onToggle={toggle}
            onEdit={(client) => setEditModalClient(client)}
            onDelete={(client) => setDeleteModalClient(client)}
            onArchive={(client) => archiveMutation.mutate({ clientId: client.id })}
            onStatusChange={handleStatusChange}
            role={role}
          />
        ) : (
          <ClientsList
            clients={visibleClients}
            selected={selected}
            onToggleAll={allSelected ? clearAll : selectAll}
            onToggle={toggle}
            onEdit={(client) => setEditModalClient(client)}
            onDelete={(client) => setDeleteModalClient(client)}
            onArchive={(client) => archiveMutation.mutate({ clientId: client.id })}
            onStatusChange={handleStatusChange}
            allSelected={allSelected}
            someSelected={someSelected}
            role={role}
          />
        )}

        {canLoadMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={loadMore}
              className="border-border bg-muted/50 text-foreground hover:bg-primary/5 hover:text-primary rounded-full border px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:border-[primary]/50"
            >
              Load More Results
            </button>
          </div>
        )}
      </div>

      {/* Syncing indicator */}
      {isFetching && (
        <div className="border-border bg-card absolute right-6 bottom-6 flex items-center gap-3 rounded-full border px-4 py-2 shadow-2xl backdrop-blur-xl">
          <div className="bg-primary/70 h-2 w-2 animate-pulse rounded-full" />
          <span className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
            Syncing Data
          </span>
        </div>
      )}

      {/* Slide-over Detail Panel (quick preview) */}
      <ClientDetailSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedClient={selectedClient}
        tab={tab}
        setTab={setTab}
        projectsQuery={projectsQuery}
        invoicesQuery={invoicesQuery}
        activityQuery={activityQuery}
        onClientArchived={() => utils.clients.getBootstrap.invalidate()}
      />

      {/* Modals */}
      <AddClientModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={(msg) => { toast.success(msg); invalidate(); }}
        onError={(msg) => toast.error(msg)}
      />

      <EditClientModal
        open={!!editModalClient}
        client={editModalClient}
        onClose={() => setEditModalClient(null)}
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
        onInvalidate={invalidate}
      />

      <DeleteClientModal
        open={!!deleteModalClient}
        client={deleteModalClient}
        onClose={() => setDeleteModalClient(null)}
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
        onInvalidate={invalidate}
      />

      {/* Invite dialog (legacy - email only flow) */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setInviteOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <InviteClientDialog />
          </div>
        </div>
      )}

      {/* Bulk action floating bar */}
      <BulkActionBar
        count={selectedCount}
        onClear={clearAll}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        archiving={archiveMutation.isPending}
      />

      {/* Toast stack */}
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
