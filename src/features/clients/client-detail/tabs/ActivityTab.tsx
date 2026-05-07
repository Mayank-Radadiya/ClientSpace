"use client";

type Activity = { id: string; eventType: string; metadata: Record<string, unknown>; createdAt: Date };

type ActivityTabProps = {
  clientId: string;
  query: { data?: Activity[] | null; isLoading?: boolean };
};

function formatActivityLabel(eventType: string, metadata: Record<string, unknown>): string {
  if (eventType === "project_created") return `Project created: ${metadata.projectName ?? ""}`;
  if (eventType === "invoice_created") return `Invoice #${metadata.invoiceNumber ?? ""} created`;
  if (eventType === "invoice_paid") return `Invoice paid`;
  if (eventType === "comment_added") return `Comment added`;
  if (eventType === "file_uploaded") return `File uploaded: ${metadata.fileName ?? ""}`;
  return eventType.replace(/_/g, " ");
}

function formatRelativeDate(date: Date): string {
  const ms = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (ms < day) return "Today";
  if (ms < day * 2) return "Yesterday";
  return `${Math.floor(ms / day)}d ago`;
}

export function ActivityTab({ query }: ActivityTabProps) {
  const activity = query.data ?? [];

  if (query.isLoading) {
    return <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16">
        <p className="text-[13px] font-medium text-muted-foreground font-[var(--font-data)]">No activity yet</p>
        <p className="mt-1 text-[12px] text-muted-foreground font-[var(--font-data)]">Activity will appear here as you work with this client</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="relative space-y-0">
        {activity.map((a, i) => (
          <div key={a.id} className="relative flex gap-4 pb-5 last:pb-0">
            {i < activity.length - 1 && (
              <div className="absolute top-5 left-2 h-full w-px bg-border" />
            )}
            <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-[#4F7FFF] bg-background" />
            <div className="flex flex-1 items-start justify-between gap-4 min-w-0">
              <p className="text-[13px] text-foreground font-[var(--font-data)]">
                {formatActivityLabel(a.eventType, a.metadata)}
              </p>
              <span className="shrink-0 text-[10px] text-muted-foreground font-[var(--font-data)] whitespace-nowrap">
                {formatRelativeDate(a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
