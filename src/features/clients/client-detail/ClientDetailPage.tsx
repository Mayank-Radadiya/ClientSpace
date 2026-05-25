"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { trpc } from "@/lib/trpc/client";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientAvatar } from "../components/ClientAvatar";
import { ClientLifecycleSelector } from "../components/ClientLifecycleSelector";
import { ClientHealthBanner, computeHealthAlert } from "../components/ClientHealthBanner";
import { EditClientModal } from "../components/EditClientModal";
import { DeleteClientModal } from "../components/DeleteClientModal";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { formatCents, formatRelative } from "../utils/formatters";
import type { ClientListItem } from "../client.types";
import { useState } from "react";

// Tab content components
import { OverviewTab } from "./tabs/OverviewTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { InvoicesTab } from "./tabs/InvoicesTab";
import { FilesTab } from "./tabs/FilesTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { NotesFeedSection } from "./intelligence/NotesFeedSection";

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = "overview" | "work" | "billing" | "intelligence";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "work", label: "Work" },
  { id: "billing", label: "Billing" },
  { id: "intelligence", label: "Intelligence" },
];

// ─── KPI Metric block ─────────────────────────────────────────────────────────

function MetricBlock({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "text-[28px] leading-none font-(--font-metrics) tabular-nums",
          highlight ? "text-amber-500" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-muted-foreground mt-1 text-[10px] tracking-[0.18em] uppercase">
        {label}
      </p>
    </div>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function MetricSep() {
  return <div className="bg-border h-10 w-px shrink-0" aria-hidden="true" />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ClientDetailPage({
  clientId,
  role,
}: {
  clientId: string;
  role: "owner" | "admin" | "member" | "client";
}) {
  const router = useRouter();
  const utils = trpc.useUtils();

  // URL-persisted tab state via nuqs
  const [activeTab, setActiveTab] = useQueryState<Tab>("tab", {
    defaultValue: "overview",
    parse: (v): Tab =>
      (["overview", "work", "billing", "intelligence"] as Tab[]).includes(
        v as Tab,
      )
        ? (v as Tab)
        : "overview",
    serialize: (v) => v,
    history: "push",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ─── Data ──────────────────────────────────────────────────────────────────

  const {
    data: client,
    isLoading,
    error,
  } = trpc.clients.getClientById.useQuery({ clientId });

  const projectsQuery = trpc.clients.getClientProjects.useQuery(
    { clientId },
    {
      enabled: activeTab === "work" || activeTab === "overview",
      staleTime: 60_000,
    },
  );

  const invoicesQuery = trpc.clients.getClientInvoices.useQuery(
    { clientId },
    {
      enabled: activeTab === "billing" || activeTab === "overview",
      staleTime: 60_000,
    },
  );

  const activityQuery = trpc.clients.getClientActivity.useQuery(
    { clientId },
    {
      enabled: activeTab === "intelligence" || activeTab === "overview",
      staleTime: 60_000,
    },
  );

  // ─── Derived state ─────────────────────────────────────────────────────────

  const canManage = role === "owner" || role === "admin";
  const clientAsListItem = client as ClientListItem | null;

  // Lifecycle status — fallback to deriving from displayStatus for existing clients
  const lifecycleStatus =
    (client as (typeof client & { lifecycleStatus?: string }) | null)
      ?.lifecycleStatus ??
    (client?.displayStatus === "archived"
      ? "archived"
      : client?.displayStatus === "pending"
        ? "prospect"
        : "active");

  // Health alert computation
  const healthAlert = client
    ? computeHealthAlert({
        outstandingAmountCents: client.outstandingAmountCents,
        lastActivityAt: client.lastActivityAt,
        activeProjectCount: client.activeProjectCount,
        invitedAt: client.invitedAt,
        lifecycleStatus,
        onCreateProject: () =>
          router.push(`/projects/new?clientId=${clientId}`),
        onAddNote: () => setActiveTab("intelligence"),
      })
    : null;

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="bg-muted h-8 w-32 animate-pulse rounded-lg" />
          <div className="bg-muted h-36 animate-pulse rounded-2xl" />
          <div className="bg-muted h-12 animate-pulse rounded-xl" />
          <div className="bg-muted h-64 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <p className="text-foreground text-2xl font-bold">Client not found</p>
          <p className="text-muted-foreground mt-2 text-sm">
            This client may have been deleted or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.push("/clients")}
            className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-10">

        {/* Back nav */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/clients")}
          className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2 text-[12px] font-semibold tracking-[0.15em] uppercase transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          All Clients
        </motion.button>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="border-border bg-card mb-4 overflow-hidden rounded-2xl border p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <ClientAvatar
                companyName={client.companyName}
                contactName={client.contactName}
                email={client.email}
                size="lg"
              />
              <div>
                <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
                  {client.companyName || client.email}
                </h1>
                {client.contactName && (
                  <p className="text-muted-foreground text-[13px]">
                    {client.contactName}
                  </p>
                )}
                <p className="text-muted-foreground text-[12px]">
                  {client.email}
                </p>
                <div className="mt-2">
                  <ClientLifecycleSelector
                    clientId={clientId}
                    currentStatus={lifecycleStatus as Parameters<typeof ClientLifecycleSelector>[0]["currentStatus"]}
                    role={role}
                    onSuccess={() => {
                      utils.clients.getClientById.invalidate({ clientId });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* KPI strip */}
            <div
              className="flex items-center gap-5"
              role="group"
              aria-label="Client metrics"
            >
              <MetricBlock
                value={String(client.activeProjectCount)}
                label="Projects"
              />
              <MetricSep />
              <MetricBlock
                value={
                  client.outstandingAmountCents > 0
                    ? formatCents(client.outstandingAmountCents)
                    : "—"
                }
                label="Outstanding"
                highlight={client.outstandingAmountCents > 0}
              />
              <MetricSep />
              <MetricBlock
                value={formatCents(client.totalRevenueCents)}
                label="Revenue"
              />
            </div>
          </div>

          {/* Action bar */}
          {canManage && (
            <div className="border-border mt-4 flex items-center gap-2 border-t pt-4">
              <button
                id="client-edit-btn"
                onClick={() => setEditOpen(true)}
                className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors hover:border-foreground/15"
              >
                <Edit2 className="h-3.5 w-3.5" aria-hidden="true" /> Edit
              </button>
              <button
                id="client-delete-btn"
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-destructive/20 px-4 py-2 text-[11px] font-semibold tracking-[0.15em] text-destructive uppercase transition-colors hover:bg-destructive/5"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
              </button>
            </div>
          )}
        </motion.div>

        {/* Health alert banner */}
        <ClientHealthBanner
          clientId={clientId}
          alert={healthAlert}
          role={role}
        />

        {/* Tab nav */}
        <div
          className="border-border mb-6 flex gap-1 overflow-x-auto border-b"
          role="tablist"
          aria-label="Client sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative shrink-0 px-4 pt-1 pb-3 text-[12px] font-semibold tracking-[0.15em] uppercase transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute right-0 bottom-0 left-0 h-[2px] bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <motion.div
          key={activeTab}
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <OverviewTab
              client={client}
              projectsQuery={projectsQuery}
              invoicesQuery={invoicesQuery}
              activityQuery={activityQuery}
              onTabSwitch={setActiveTab}
            />
          )}

          {/* ── WORK ── */}
          {activeTab === "work" && (
            <div className="space-y-6">
              <ProjectsTab clientId={clientId} query={projectsQuery} />
              <FilesTab clientId={clientId} />
            </div>
          )}

          {/* ── BILLING ── */}
          {activeTab === "billing" && (
            <InvoicesTab clientId={clientId} query={invoicesQuery} />
          )}

          {/* ── INTELLIGENCE ── */}
          {activeTab === "intelligence" && (
            <div className="space-y-8">
              {/* Notes section */}
              <section aria-labelledby="notes-heading">
                <h2
                  id="notes-heading"
                  className="text-muted-foreground mb-4 text-[10px] font-bold tracking-[0.2em] uppercase"
                >
                  Team Notes
                </h2>
                <NotesFeedSection clientId={clientId} role={role} />
              </section>

              {/* Activity section */}
              <section aria-labelledby="activity-heading">
                <h2
                  id="activity-heading"
                  className="text-muted-foreground mb-4 text-[10px] font-bold tracking-[0.2em] uppercase"
                >
                  Activity
                </h2>
                <ActivityTab clientId={clientId} query={activityQuery} />
              </section>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <EditClientModal
        open={editOpen}
        client={clientAsListItem}
        onClose={() => setEditOpen(false)}
        onSuccess={(msg: string) => toast.success(msg)}
        onError={(msg: string) => toast.error(msg)}
        onInvalidate={() => {
          utils.clients.getClientById.invalidate({ clientId });
          utils.clients.getBootstrap.invalidate();
        }}
      />
      <DeleteClientModal
        open={deleteOpen}
        client={clientAsListItem}
        onClose={() => setDeleteOpen(false)}
        onSuccess={(msg: string) => {
          toast.success(msg);
          router.push("/clients");
        }}
        onError={(msg: string) => toast.error(msg)}
        onInvalidate={() => utils.clients.getBootstrap.invalidate()}
      />
    </div>
  );
}
