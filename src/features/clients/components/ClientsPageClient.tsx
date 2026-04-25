"use client";

import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";

import type { ClientBootstrapStats, ClientListItem } from "../client.types";
import { useClientPermissions } from "../hooks/useClientPermissions";
import { useClients } from "../hooks/useClients";
import { useClientSheet } from "../hooks/useClientSheet";

// Components
import { ClientsHeader } from "./ClientsHeader";
import { ClientsPremiumStats } from "./ClientsPremiumStats";
import { ClientsFilterBar } from "./ClientsFilterBar";
import { ClientsEmptyState } from "./ClientsEmptyState";
import { ClientsGrid } from "./ClientsGrid";
import { ClientsList } from "./ClientsList";
import { ClientDetailSheet } from "./ClientDetailSheet";

type Role = "owner" | "admin" | "member" | "client";

type ClientsPageClientProps = {
  initialClients: ClientListItem[];
  initialStats: ClientBootstrapStats;
  role: Role;
};

export function ClientsPageClient({
  initialClients,
  initialStats,
  role,
}: ClientsPageClientProps) {
  const permissions = useClientPermissions(role);

  const { data, isFetching, refetch } = trpc.client.getBootstrap.useQuery(
    undefined,
    {
      initialData: { clients: initialClients, stats: initialStats },
      refetchOnWindowFocus: true,
    },
  );

  const clients = data?.clients ?? initialClients;
  const stats = data?.stats ?? initialStats;

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

  const selectedClientId = selectedClient?.id;

  const projectsQuery = trpc.client.getClientProjects.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    {
      enabled:
        isOpen &&
        !!selectedClientId &&
        (tab === "projects" || tab === "overview"),
    },
  );

  const invoicesQuery = trpc.client.getClientInvoices.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    {
      enabled:
        isOpen &&
        !!selectedClientId &&
        (tab === "invoices" || tab === "overview"),
    },
  );

  const activityQuery = trpc.client.getClientActivity.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    {
      enabled:
        isOpen &&
        !!selectedClientId &&
        (tab === "activity" || tab === "overview"),
    },
  );

  const activeProjectsMetric = useMemo(
    () => stats.activeProjects,
    [stats.activeProjects],
  );

  return (
    <div className="bg-background border-border text-foreground relative mb-8 min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-2xl border p-6 shadow-lg md:p-10">
      {/* Glow effects specific to this page */}
      <div className="pointer-events-none absolute -right-96 -bottom-96 h-[800px] w-[800px] rounded-full" />

      <div className="relative z-10 space-y-10">
        <ClientsHeader
          counts={counts}
          search={search}
          setSearch={setSearch}
          view={view}
          setView={setView}
          canInviteClient={permissions.canInviteClient}
        />

        <ClientsPremiumStats
          stats={{
            totalClients: stats.totalClients,
            activeProjects: activeProjectsMetric,
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
            visibleClients={visibleClients}
            openClient={openClient}
          />
        ) : (
          <ClientsList
            visibleClients={visibleClients}
            openClient={openClient}
            permissions={permissions}
            onClientArchived={() => refetch()}
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

      {isFetching && (
        <div className="border-border bg-foreground absolute right-6 bottom-6 flex items-center gap-3 rounded-full border px-4 py-2 shadow-2xl backdrop-blur-xl">
          <div className="bg-primary h-2 w-2 animate-ping rounded-full" />
          <span className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
            Syncing Data
          </span>
        </div>
      )}

      {/* Slide-over Detail Panel */}
      <ClientDetailSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedClient={selectedClient}
        tab={tab}
        setTab={setTab}
        projectsQuery={projectsQuery}
        invoicesQuery={invoicesQuery}
        activityQuery={activityQuery}
        onClientArchived={() => refetch()}
      />
    </div>
  );
}
