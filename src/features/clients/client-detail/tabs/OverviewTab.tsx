"use client";

import { useRouter } from "next/navigation";
import { formatCents, formatRelative } from "../../utils/formatters";
import { cn } from "@/lib/utils";

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
  projectsQuery: { data?: Project[] | null };
  invoicesQuery: { data?: Invoice[] | null };
  activityQuery: { data?: Activity[] | null };
};

const PROJ_STATUS_COLOR: Record<string, string> = {
  not_started: "text-[#6B6B7E]",
  in_progress: "text-[#4F7FFF]",
  review: "text-[#F59E0B]",
  completed: "text-[#22C55E]",
  archived: "text-[#3D3D4E]",
};

const INV_STATUS_COLOR: Record<string, string> = {
  draft: "text-[#6B6B7E]",
  sent: "text-[#4F7FFF]",
  paid: "text-[#22C55E]",
  overdue: "text-[#EF4444]",
  cancelled: "text-[#3D3D4E]",
};

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

export function OverviewTab({
  client,
  projectsQuery,
  invoicesQuery,
  activityQuery,
}: OverviewTabProps) {
  const router = useRouter();
  const recentProjects = (projectsQuery.data ?? []).slice(0, 4);
  const recentInvoices = (invoicesQuery.data ?? []).slice(0, 4);
  const recentActivity = (activityQuery.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Details grid */}
      <div className="border-border bg-card rounded-2xl border p-5">
        <h3 className="text-muted-foreground mb-4 text-[10px] font-bold tracking-[0.2em] uppercase">
          Client Details
        </h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Email", value: client.email },
            {
              label: "Last Active",
              value: formatRelative(client.lastActivityAt),
            },
            { label: "Revenue", value: formatCents(client.totalRevenueCents) },
            {
              label: "Outstanding",
              value:
                client.outstandingAmountCents > 0
                  ? formatCents(client.outstandingAmountCents)
                  : "—",
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">
                {label}
              </dt>
              <dd className="text-foreground mt-1 text-[13px] font-medium">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
              Recent Projects
            </h3>
            <button
              onClick={() => router.push(`/projects`)}
              className="text-[10px] tracking-wide text-[#4F7FFF] hover:text-[#6B95FF]"
            >
              View all →
            </button>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  className="border-border flex items-center justify-between rounded-xl border px-3 py-2"
                >
                  <span className="text-foreground truncate text-[13px]">
                    {p.name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-[0.12em] uppercase",
                      PROJ_STATUS_COLOR[p.status] ?? "text-muted-foreground",
                    )}
                  >
                    {p.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
              Recent Invoices
            </h3>
            <button
              onClick={() => router.push(`/invoices`)}
              className="text-[10px] tracking-wide text-[#4F7FFF] hover:text-[#6B95FF]"
            >
              View all →
            </button>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="border-border flex items-center justify-between rounded-xl border px-3 py-2"
                >
                  <div>
                    <span className="text-foreground text-[13px]">
                      INV-{String(inv.number).padStart(4, "0")}
                    </span>
                    <span className="text-muted-foreground ml-2 text-[11px] font-(--font-metrics)">
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
      {recentActivity.length > 0 && (
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="text-muted-foreground mb-4 text-[10px] font-bold tracking-[0.2em] uppercase">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4F7FFF]" />
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
