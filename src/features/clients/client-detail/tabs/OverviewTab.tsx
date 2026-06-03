"use client";

import { formatCents, formatRelative } from "../../utils/formatters";
import { cn } from "@/lib/utils";
import { FolderOpen, Receipt, Activity } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Project = {
  id: string;
  name: string;
  status: string;
  updatedAt: Date | null;
};

type Invoice = {
  id: string;
  number: number;
  amountCents: number;
  status: string;
  dueDate: Date | string | null;
};

type Activity = {
  id: string;
  eventType: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

type Tab = "overview" | "work" | "billing" | "intelligence";

type OverviewTabProps = {
  client: {
    id: string;
    companyName: string | null;
    contactName: string | null;
    email: string;
    displayStatus: string;
    activeProjectCount: number;
    outstandingAmountCents: number;
    totalRevenueCents: number;
    lastActivityAt: string | null;
    invitedAt: string | null;
    pendingInvite: boolean;
  };
  projectsQuery: { data?: Project[] | null; isLoading?: boolean };
  invoicesQuery: { data?: Invoice[] | null; isLoading?: boolean };
  activityQuery: { data?: Activity[] | null; isLoading?: boolean };
  /** Switch the parent to a different tab programmatically. */
  onTabSwitch?: (tab: Tab) => void;
};

// ─── Status color maps ────────────────────────────────────────────────────────

const PROJ_STATUS_COLOR: Record<string, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-primary",
  review: "text-amber-500",
  completed: "text-emerald-500",
  archived: "text-muted-foreground/40",
};

const PROJ_STATUS_DOT: Record<string, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-primary",
  review: "bg-amber-500",
  completed: "bg-emerald-500",
  archived: "bg-muted-foreground/20",
};

const INV_STATUS_COLOR: Record<string, string> = {
  draft: "text-muted-foreground",
  sent: "text-primary",
  paid: "text-emerald-500",
  overdue: "text-destructive",
  cancelled: "text-muted-foreground/40",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatActivityLabel(
  eventType: string,
  metadata: Record<string, unknown>,
): string {
  if (eventType === "project_created")
    return `Project created: ${metadata.projectName ?? ""}`;
  if (eventType === "invoice_created")
    return `Invoice created: ${metadata.invoiceNumber ?? ""}`;
  if (eventType === "invoice_paid") return `Invoice paid`;
  if (eventType === "comment_added") return `Comment added`;
  if (eventType === "file_uploaded")
    return `File uploaded: ${metadata.fileName ?? ""}`;
  return eventType.replace(/_/g, " ");
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: React.ComponentType<any>;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
        <h3 className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
          {title}
        </h3>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[10px] font-semibold tracking-wide text-primary hover:text-primary/80 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OverviewTab({
  client,
  projectsQuery,
  invoicesQuery,
  activityQuery,
  onTabSwitch,
}: OverviewTabProps) {
  const recentProjects = (projectsQuery.data ?? []).slice(0, 4);
  const recentInvoices = (invoicesQuery.data ?? []).slice(0, 4);
  const recentActivity = (activityQuery.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Client details grid */}
      <div className="border-border bg-card rounded-2xl border p-5">
        <h3 className="text-muted-foreground mb-4 text-[10px] font-bold tracking-[0.2em] uppercase">
          Client Details
        </h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Email", value: client.email },
            {
              label: "Invited",
              value: formatRelative(client.invitedAt),
            },
            { label: "Revenue", value: formatCents(client.totalRevenueCents) },
            {
              label: "Outstanding",
              value:
                client.outstandingAmountCents > 0
                  ? formatCents(client.outstandingAmountCents)
                  : "—",
            },
            {
              label: "Status",
              value: client.pendingInvite ? "Invitation pending" : client.displayStatus,
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">
                {label}
              </dt>
              <dd className="text-foreground mt-1 text-[13px] font-medium capitalize">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <div className="border-border bg-card rounded-2xl border p-5">
          <SectionHeader
            title="Recent Projects"
            icon={FolderOpen}
            action={
              onTabSwitch
                ? { label: "All projects →", onClick: () => onTabSwitch("work") }
                : undefined
            }
          />
          {projectsQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-muted h-10 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  className="border-border flex items-center justify-between rounded-xl border px-3 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        PROJ_STATUS_DOT[p.status] ?? "bg-muted-foreground/40",
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-foreground truncate text-[13px]">
                      {p.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-[0.12em] uppercase",
                      PROJ_STATUS_COLOR[p.status] ?? "text-muted-foreground",
                    )}
                  >
                    {p.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="border-border bg-card rounded-2xl border p-5">
          <SectionHeader
            title="Recent Invoices"
            icon={Receipt}
            action={
              onTabSwitch
                ? { label: "All invoices →", onClick: () => onTabSwitch("billing") }
                : undefined
            }
          />
          {invoicesQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-muted h-10 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : recentInvoices.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="border-border flex items-center justify-between rounded-xl border px-3 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <span className="text-foreground text-[13px]">
                      INV-{String(inv.number).padStart(4, "0")}
                    </span>
                    <span className="text-muted-foreground ml-2 text-[11px] font-(--font-metrics) tabular-nums">
                      {formatCents(inv.amountCents)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-[0.12em] uppercase",
                      INV_STATUS_COLOR[inv.status] ?? "text-muted-foreground",
                    )}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity preview */}
      {(activityQuery.data ?? []).length > 0 && (
        <div className="border-border bg-card rounded-2xl border p-5">
          <SectionHeader
            title="Recent Activity"
            icon={Activity}
            action={
              onTabSwitch
                ? {
                    label: "Full history →",
                    onClick: () => onTabSwitch("intelligence"),
                  }
                : undefined
            }
          />
          <div className="space-y-3">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <div className="flex flex-1 items-center justify-between gap-4">
                  <p className="text-foreground text-[12px]">
                    {formatActivityLabel(
                      a.eventType,
                      a.metadata as Record<string, unknown>,
                    )}
                  </p>
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    {formatRelative(a.createdAt.toISOString())}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
