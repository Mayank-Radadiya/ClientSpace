"use client";

import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityEventMetadata } from "@/db/schema";

type ActivityRow = {
  id: string;
  metadata: ActivityEventMetadata;
  createdAt: Date | string;
  actor?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    email: string;
    role?: string | null;
  } | null;
  actorRole?: string | null;
  project?: { id: string; name: string } | null;
};

interface ActivityTimelineProps {
  items: ActivityRow[];
  showProject?: boolean;
  maxHeight?: string;
}

function toLabel(metadata: ActivityEventMetadata): string {
  switch (metadata.event) {
    case "project.created":
      return `created project "${metadata.projectName}"`;
    case "project.status_changed":
      return `changed project status from ${metadata.from} to ${metadata.to}`;
    case "asset.uploaded":
      return `uploaded "${metadata.assetName}" (v${metadata.versionNumber})`;
    case "asset.approved":
      return `approved "${metadata.assetName}"`;
    case "asset.changes_requested":
      return `requested changes on "${metadata.assetName}"`;
    case "invoice.sent":
      return `sent invoice #${metadata.invoiceNumber}`;
    case "invoice.paid":
      return `marked invoice #${metadata.invoiceNumber} as paid`;
    case "comment.created":
      return "added a comment";
    case "client.invited":
      return `invited ${metadata.email}`;
    case "milestone.completed":
      return `completed milestone "${metadata.title}"`;
    default:
      return "performed an action";
  }
}

function dateHeaderLabel(day: Date): string {
  if (isToday(day)) return "Today";
  if (isYesterday(day)) return "Yesterday";
  return format(day, "MMMM d, yyyy");
}

function initials(nameOrEmail: string | undefined): string {
  if (!nameOrEmail) return "U";
  const chunks = nameOrEmail.trim().split(/\s+/).slice(0, 2);
  const chars = chunks.map((c) => c.charAt(0).toUpperCase()).join("");
  return chars || "U";
}

export function ActivityTimeline({
  items,
  showProject = false,
  maxHeight = "420px",
}: ActivityTimelineProps) {
  if (!items.length) {
    return (
      <div className="text-muted-foreground bg-card rounded-xl border p-6 text-sm">
        No activity yet - events will appear here as work progresses.
      </div>
    );
  }

  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const groups = new Map<string, { day: Date; rows: ActivityRow[] }>();
  for (const item of sorted) {
    const day = startOfDay(new Date(item.createdAt));
    const key = day.toISOString();
    if (!groups.has(key)) {
      groups.set(key, { day, rows: [] });
    }
    groups.get(key)!.rows.push(item);
  }

  return (
    <div className="bg-card rounded-xl border">
      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-6 p-4">
          {Array.from(groups.values()).map((group) => (
            <div key={group.day.toISOString()} className="space-y-3">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {dateHeaderLabel(group.day)}
              </h3>

              <ul className="space-y-3">
                {group.rows.map((item) => {
                  const actorName =
                    item.actor?.name ?? item.actor?.email ?? "Someone";
                  const label = toLabel(item.metadata);
                  const isClientActor =
                    item.actor?.role === "client" ||
                    item.actorRole === "client";

                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        {item.actor?.avatarUrl ? (
                          <AvatarImage
                            src={item.actor.avatarUrl}
                            alt={actorName}
                          />
                        ) : null}
                        <AvatarFallback>{initials(actorName)}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {actorName}
                          </span>
                          {isClientActor ? (
                            <Badge variant="outline" size="sm">
                              Client
                            </Badge>
                          ) : null}
                          <span className="text-muted-foreground text-sm">
                            {label}
                          </span>
                        </div>

                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                          <span>
                            {format(new Date(item.createdAt), "h:mm a")}
                          </span>
                          {showProject && item.project?.name ? (
                            <>
                              <span>-</span>
                              <span>{item.project.name}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
