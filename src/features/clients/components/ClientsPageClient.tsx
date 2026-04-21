"use client";

import { useMemo } from "react";
import {
  Clock3,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  ClientBootstrapStats,
  ClientDisplayStatus,
  ClientListItem,
} from "../client.types";
import { useClientPermissions } from "../hooks/useClientPermissions";
import { useClients } from "../hooks/useClients";
import { useClientSheet } from "../hooks/useClientSheet";
import { InviteClientDialog } from "./InviteClientDialog";

type Role = "owner" | "admin" | "member" | "client";

type ClientsPageClientProps = {
  initialClients: ClientListItem[];
  initialStats: ClientBootstrapStats;
  role: Role;
};

const STATUS_STYLES: Record<ClientDisplayStatus, string> = {
  active: "bg-success/10 text-success-foreground",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning-foreground",
  archived: "bg-destructive/10 text-destructive",
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function statusLabel(status: ClientDisplayStatus): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  if (status === "pending") return "Pending";
  return "Archived";
}

function formatRelative(iso: string | null): string {
  if (!iso) return "No activity";
  const ms = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (ms < day) return "Today";
  if (ms < day * 2) return "Yesterday";
  const days = Math.floor(ms / day);
  return `${days}d ago`;
}

export function ClientsPageClient({
  initialClients,
  initialStats,
  role,
}: ClientsPageClientProps) {
  const permissions = useClientPermissions(role);

  const { data, isFetching } = trpc.client.getBootstrap.useQuery(undefined, {
    initialData: { clients: initialClients, stats: initialStats },
    refetchOnWindowFocus: true,
  });

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

  const {
    isOpen,
    setIsOpen,
    selectedClient,
    tab,
    setTab,
    openClient,
  } = useClientSheet(clients);

  const selectedClientId = selectedClient?.id;

  const projectsQuery = trpc.client.getClientProjects.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: isOpen && !!selectedClientId && (tab === "projects" || tab === "overview") },
  );

  const invoicesQuery = trpc.client.getClientInvoices.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: isOpen && !!selectedClientId && (tab === "invoices" || tab === "overview") },
  );

  const activityQuery = trpc.client.getClientActivity.useQuery(
    { clientId: selectedClientId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: isOpen && !!selectedClientId && (tab === "activity" || tab === "overview") },
  );

  const activeProjectsMetric = useMemo(() => stats.activeProjects, [stats.activeProjects]);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {counts.all} clients · {counts.active} active
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[320px]">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company, contact, email"
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" /> Grid
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" /> List
            </Button>

            {permissions.canInviteClient && <InviteClientDialog />}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          className={cn(
            "cursor-pointer border transition",
            statFilter === "all" && "border-primary/40",
          )}
          onClick={() => setStatFilter("all")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Clients</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalClients}</CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer border transition",
            statFilter === "has_projects" && "border-primary/40",
          )}
          onClick={() => setStatFilter("has_projects")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeProjectsMetric}</CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer border transition",
            statFilter === "has_outstanding" && "border-primary/40",
          )}
          onClick={() => setStatFilter("has_outstanding")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCents(stats.outstandingInvoicesCents)}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "active", "inactive", "pending", "archived"] as const).map((status) => {
            const label = status === "all" ? "All" : statusLabel(status);
            const count = status === "all" ? counts.all : counts[status];
            const isActive = statusFilter === status;
            return (
              <Button
                key={status}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
              >
                {label} ({count})
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
            <SelectTrigger className="w-[210px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_activity_desc">Last activity (new)</SelectItem>
              <SelectItem value="last_activity_asc">Last activity (old)</SelectItem>
              <SelectItem value="name_asc">Name A-Z</SelectItem>
              <SelectItem value="name_desc">Name Z-A</SelectItem>
              <SelectItem value="revenue_desc">Revenue high-low</SelectItem>
              <SelectItem value="outstanding_desc">Outstanding high-low</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-muted-foreground text-sm">{totalFiltered} results</span>
        </div>
      </section>

      {view === "grid" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleClients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer border transition hover:border-primary/40"
              onClick={() => openClient(client.id)}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {client.companyName ?? client.contactName ?? client.email}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {client.contactName ?? "No contact"}
                    </p>
                  </div>

                  <Badge className={STATUS_STYLES[client.displayStatus]}>
                    {statusLabel(client.displayStatus)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{client.email}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-2">
                    <p className="text-muted-foreground text-xs">Projects</p>
                    <p className="font-semibold">{client.activeProjectCount}</p>
                  </div>
                  <div className="rounded-lg border p-2">
                    <p className="text-muted-foreground text-xs">Outstanding</p>
                    <p className="font-semibold">
                      {formatCents(client.outstandingAmountCents)}
                    </p>
                  </div>
                </div>

                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatRelative(client.lastActivityAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <section className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer"
                  onClick={() => openClient(client.id)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {client.companyName ?? client.contactName ?? client.email}
                      </span>
                      <span className="text-muted-foreground text-xs">{client.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[client.displayStatus]}>
                      {statusLabel(client.displayStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.activeProjectCount}</TableCell>
                  <TableCell>{formatCents(client.outstandingAmountCents)}</TableCell>
                  <TableCell>{formatRelative(client.lastActivityAt)}</TableCell>
                  <TableCell>
                    {permissions.canEditClient ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-xs" variant="ghost" onClick={(event) => event.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(event) => event.stopPropagation()}>
                            Edit client
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(event) => event.stopPropagation()}>
                            Archive client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {visibleClients.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-lg font-medium">No matching clients</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try adjusting search, status, or sorting.
          </p>
          <Button className="mt-4" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : null}

      {canLoadMore ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Load more
          </Button>
        </div>
      ) : null}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full max-w-xl">
          {selectedClient ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selectedClient.companyName ??
                    selectedClient.contactName ??
                    selectedClient.email}
                </SheetTitle>
                <SheetDescription>{selectedClient.email}</SheetDescription>
              </SheetHeader>

              <div className="px-6 pb-6">
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Projects</p>
                    <p className="text-lg font-semibold">{selectedClient.activeProjectCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Outstanding</p>
                    <p className="text-lg font-semibold">
                      {formatCents(selectedClient.outstandingAmountCents)}
                    </p>
                  </div>
                </div>

                <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs">Status</p>
                      <Badge className={cn("mt-2", STATUS_STYLES[selectedClient.displayStatus])}>
                        {statusLabel(selectedClient.displayStatus)}
                      </Badge>
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs">Total revenue</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCents(selectedClient.totalRevenueCents)}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="projects" className="mt-4 space-y-2">
                    {projectsQuery.isLoading ? (
                      <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading projects...
                      </p>
                    ) : (projectsQuery.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground text-sm">No projects for this client.</p>
                    ) : (
                      (projectsQuery.data ?? []).map((project) => (
                        <div key={project.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{project.name}</p>
                            <Badge variant="outline">{project.status.replace("_", " ")}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="invoices" className="mt-4 space-y-2">
                    {invoicesQuery.isLoading ? (
                      <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices...
                      </p>
                    ) : (invoicesQuery.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground text-sm">No invoices for this client.</p>
                    ) : (
                      (invoicesQuery.data ?? []).map((invoice) => (
                        <div key={invoice.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">INV-{invoice.number}</p>
                            <Badge variant="outline">{invoice.status}</Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {formatCents(invoice.amountCents)}
                          </p>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="activity" className="mt-4 space-y-2">
                    {activityQuery.isLoading ? (
                      <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading activity...
                      </p>
                    ) : (activityQuery.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground text-sm">No activity found.</p>
                    ) : (
                      (activityQuery.data ?? []).map((activity) => (
                        <div key={activity.id} className="rounded-lg border p-3">
                          <p className="text-sm font-medium">{activity.eventType}</p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground p-6 text-sm">Select a client.</div>
          )}
        </SheetContent>
      </Sheet>

      {isFetching ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Syncing latest clients...
        </p>
      ) : null}
    </div>
  );
}
