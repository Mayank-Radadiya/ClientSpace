"use client";
// src/features/projects/components/tabs/ActivityTab.tsx
// Project activity feed with categorized events.

import { motion } from "framer-motion";
import { Loader2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { ActivityEventMetadata } from "@/db/schema";

const CATEGORY_STYLES = {
  project:   { dot: "bg-primary", ring: "ring-primary/20" },
  milestone: { dot: "bg-green-500", ring: "ring-green-500/20" },
  file:      { dot: "bg-purple-500", ring: "ring-purple-500/20" },
  invoice:   { dot: "bg-amber-500", ring: "ring-amber-500/20" },
  comment:   { dot: "bg-sky-500", ring: "ring-sky-500/20" },
} as const;

function categoryFromEventType(eventType: string): keyof typeof CATEGORY_STYLES {
  if (eventType.startsWith("project")) return "project";
  if (eventType.startsWith("milestone") || eventType.startsWith("asset.approved")) return "milestone";
  if (eventType.startsWith("asset") || eventType.startsWith("file")) return "file";
  if (eventType.startsWith("invoice")) return "invoice";
  if (eventType.startsWith("comment")) return "comment";
  return "project";
}

function getActivityDescription(metadata: ActivityEventMetadata): string {
  switch (metadata.event) {
    case "project.created":
      return `created project "${metadata.projectName}"`;
    case "project.status_changed":
      return `changed status from ${metadata.from} to ${metadata.to}`;
    case "asset.uploaded":
      return `uploaded file "${metadata.assetName}" (v${metadata.versionNumber})`;
    case "asset.approved":
      return `approved "${metadata.assetName}"`;
    case "asset.changes_requested":
      return `requested changes on "${metadata.assetName}"`;
    case "invoice.sent":
      return `sent invoice #${metadata.invoiceNumber} ($${(metadata.amountCents / 100).toFixed(2)})`;
    case "invoice.paid":
      return `marked invoice #${metadata.invoiceNumber} as paid`;
    case "comment.created":
      return `added a comment: "${metadata.bodySnippet}"`;
    case "client.invited":
      return `invited client ${metadata.email}`;
    case "milestone.completed":
      return `completed milestone "${metadata.title}"`;
    default:
      return "performed an action";
  }
}

interface ActivityTabProps {
  projectId: string;
}

export function ActivityTab({ projectId }: ActivityTabProps) {
  const { data, isLoading } = trpc.activity.byProject.useQuery(
    { projectId },
    { staleTime: Infinity, gcTime: 10 * 60 * 1000 },
  );

  const entries = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="py-2">
      <ol className="relative flex flex-col gap-0" aria-label="Project activity feed">
        {entries.map((entry, i) => {
          const category = categoryFromEventType(entry.eventType);
          const { dot, ring } = CATEGORY_STYLES[category];

          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="group relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Timeline connector */}
              {i < entries.length - 1 && (
                <div
                  className="absolute left-[11px] top-6 h-[calc(100%-6px)] w-px bg-border"
                  aria-hidden
                />
              )}

              {/* Dot */}
              <div
                className={cn(
                  "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4",
                  dot,
                  ring,
                )}
                aria-hidden
              >
                <User size={11} className="text-white" />
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{entry.actor?.name ?? "System"}</span>{" "}
                  {getActivityDescription(entry.metadata as ActivityEventMetadata)}
                </p>
                <time
                  dateTime={entry.createdAt.toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </time>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
