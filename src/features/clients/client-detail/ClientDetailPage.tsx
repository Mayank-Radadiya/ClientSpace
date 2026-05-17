"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientAvatar } from "../components/ClientAvatar";
import { StatusDropdown } from "../components/StatusDropdown";
import { EditClientModal } from "../components/EditClientModal";
import { DeleteClientModal } from "../components/DeleteClientModal";
import { ArchiveClientModal } from "../components/ArchiveClientModal";
import { RestoreClientModal } from "../components/RestoreClientModal";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { formatCents, formatRelative } from "../utils/formatters";
import type { ClientListItem, ClientDisplayStatus } from "../client.types";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { InvoicesTab } from "./tabs/InvoicesTab";
import { ContactsTab } from "./tabs/ContactsTab";
import { FilesTab } from "./tabs/FilesTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { NotesTab } from "./tabs/NotesTab";
import { OverviewTab } from "./tabs/OverviewTab";

// Tab imports

// The tRPC router returns:
// getClientProjects → array of { id, name, status, priority, updatedAt: Date }
// getClientInvoices → array of { id, number, status, amountCents, dueDate, updatedAt: Date }
// getClientActivity → array of { id, eventType, metadata, createdAt: Date }

type Tab =
  | "overview"
  | "projects"
  | "invoices"
  | "contacts"
  | "files"
  | "activity"
  | "notes";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "invoices", label: "Invoices" },
  { id: "contacts", label: "Contacts" },
  { id: "files", label: "Files" },
  { id: "activity", label: "Activity" },
  { id: "notes", label: "Notes" },
];

export function ClientDetailPage({
  clientId,
  role,
}: {
  clientId: string;
  role: "owner" | "admin" | "member" | "client";
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const {
    data: client,
    isLoading,
    error,
  } = trpc.clients.getClientById.useQuery({ clientId });

  const projectsQuery = trpc.clients.getClientProjects.useQuery(
    { clientId },
    { enabled: activeTab === "projects" || activeTab === "overview" },
  );
  const invoicesQuery = trpc.clients.getClientInvoices.useQuery(
    { clientId },
    { enabled: activeTab === "invoices" || activeTab === "overview" },
  );
  const activityQuery = trpc.clients.getClientActivity.useQuery(
    { clientId },
    { enabled: activeTab === "activity" || activeTab === "overview" },
  );

  const isArchived = client?.displayStatus === "archived";
  const canManage = role === "owner" || role === "admin";

  // getClientById returns the same shape as ClientListItem — cast directly
  const clientAsListItem = client as ClientListItem | null;

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="bg-muted h-8 w-32 animate-pulse rounded-lg" />
          <div className="bg-muted h-32 animate-pulse rounded-2xl" />
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
            className="mt-6 rounded-xl bg-[#4F7FFF] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6B95FF]"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

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
          <ArrowLeft className="h-3.5 w-3.5" />
          All Clients
        </motion.button>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="border-border bg-card mb-6 overflow-hidden rounded-2xl border p-6"
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
                  <StatusDropdown
                    status={client.displayStatus}
                    interactive={false}
                  />
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-foreground text-[32px] leading-none font-(--font-metrics)">
                  {client.activeProjectCount}
                </p>
                <p className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">
                  Projects
                </p>
              </div>
              <div className="bg-border h-10 w-px" />
              <div className="text-center">
                <p
                  className={cn(
                    "text-[28px] leading-none font-(--font-metrics)",
                    client.outstandingAmountCents > 0
                      ? "text-[#F59E0B]"
                      : "text-foreground",
                  )}
                >
                  {client.outstandingAmountCents > 0
                    ? formatCents(client.outstandingAmountCents)
                    : "—"}
                </p>
                <p className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">
                  Outstanding
                </p>
              </div>
              <div className="bg-border h-10 w-px" />
              <div className="text-center">
                <p className="text-foreground text-[28px] leading-none font-(--font-metrics)">
                  {formatCents(client.totalRevenueCents)}
                </p>
                <p className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">
                  Revenue
                </p>
              </div>
            </div>
          </div>

          {/* Action bar */}
          {canManage && (
            <div className="border-border mt-4 flex items-center gap-2 border-t pt-4">
              <button
                onClick={() => setEditOpen(true)}
                className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors hover:border-[rgba(255,255,255,0.15)]"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              {isArchived ? (
                <button
                  onClick={() => setRestoreOpen(true)}
                  className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                </button>
              ) : (
                <button
                  onClick={() => setArchiveOpen(true)}
                  className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors"
                >
                  <Archive className="h-3.5 w-3.5" /> Archive
                </button>
              )}
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[rgba(239,68,68,0.2)] px-4 py-2 text-[11px] font-semibold tracking-[0.15em] text-[#EF4444] uppercase transition-colors hover:bg-[rgba(239,68,68,0.06)]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </motion.div>

        {/* Tab nav */}
        <div className="border-border mb-6 flex gap-1 overflow-x-auto border-b">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative shrink-0 px-4 pt-1 pb-3 text-[12px] font-semibold tracking-[0.15em] uppercase transition-colors",
                activeTab === tab.id
                  ? "text-[#4F7FFF]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute right-0 bottom-0 left-0 h-[2px] bg-[#4F7FFF]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              client={client}
              projectsQuery={projectsQuery}
              invoicesQuery={invoicesQuery}
              activityQuery={activityQuery}
            />
          )}
          {activeTab === "projects" && (
            <ProjectsTab clientId={clientId} query={projectsQuery} />
          )}
          {activeTab === "invoices" && (
            <InvoicesTab clientId={clientId} query={invoicesQuery} />
          )}
          {activeTab === "contacts" && (
            <ContactsTab
              clientId={clientId}
              contactName={client.contactName}
              email={client.email}
            />
          )}
          {activeTab === "files" && <FilesTab clientId={clientId} />}
          {activeTab === "activity" && (
            <ActivityTab clientId={clientId} query={activityQuery} />
          )}
          {activeTab === "notes" && <NotesTab clientId={clientId} />}
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
      <ArchiveClientModal
        open={archiveOpen}
        client={clientAsListItem}
        onClose={() => setArchiveOpen(false)}
        onSuccess={(msg: string) => toast.success(msg)}
        onError={(msg: string) => toast.error(msg)}
        onInvalidate={() => {
          utils.clients.getClientById.invalidate({ clientId });
          utils.clients.getBootstrap.invalidate();
        }}
      />
      <RestoreClientModal
        open={restoreOpen}
        client={clientAsListItem}
        onClose={() => setRestoreOpen(false)}
        onSuccess={(msg: string) => toast.success(msg)}
        onError={(msg: string) => toast.error(msg)}
        onInvalidate={() => {
          utils.clients.getClientById.invalidate({ clientId });
          utils.clients.getBootstrap.invalidate();
        }}
      />
    </div>
  );
}
