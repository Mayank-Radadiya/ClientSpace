// src/features/dashboard/components/ActivityFeedCard.tsx
// Displays recent activity feed with avatar, event description, and timestamp

"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ChevronRight, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityEventMetadata } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  eventType: string;
  metadata: ActivityEventMetadata;
  createdAt: Date;
  actorId: string;
  projectId: string | null;
}

interface ActivityFeedCardProps {
  activities: ActivityItem[];
  loading?: boolean;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getActivityDescription(metadata: ActivityEventMetadata): string {
  switch (metadata.event) {
    case "project.created":
      return `Created project "${metadata.projectName}"`;
    case "project.status_changed":
      return `Changed status from ${metadata.from} to ${metadata.to}`;
    case "asset.uploaded":
      return `Uploaded file "${metadata.assetName}" (v${metadata.versionNumber})`;
    case "asset.approved":
      return `Approved "${metadata.assetName}"`;
    case "asset.changes_requested":
      return `Requested changes on "${metadata.assetName}"`;
    case "invoice.sent":
      return `Sent invoice #${metadata.invoiceNumber} ($${(metadata.amountCents / 100).toFixed(2)})`;
    case "invoice.paid":
      return `Invoice #${metadata.invoiceNumber} marked as paid`;
    case "comment.created":
      return `Added a comment: "${metadata.bodySnippet}"`;
    case "client.invited":
      return `Invited client ${metadata.email}`;
    case "milestone.completed":
      return `Completed milestone "${metadata.title}"`;
    default:
      return "Unknown activity";
  }
}

function getActivityIcon(metadata: ActivityEventMetadata): string {
  switch (metadata.event) {
    case "project.created":
    case "project.status_changed":
      return "📁";
    case "asset.uploaded":
    case "asset.approved":
    case "asset.changes_requested":
      return "📄";
    case "invoice.sent":
    case "invoice.paid":
      return "💰";
    case "comment.created":
      return "💬";
    case "client.invited":
      return "👤";
    case "milestone.completed":
      return "✅";
    default:
      return "🔔";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityFeedCard({
  activities,
  loading = false,
}: ActivityFeedCardProps) {
  if (loading) {
    return <ActivityFeedCardSkeleton />;
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-heading mb-4 text-lg font-semibold">
          Recent Activity
        </h3>
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
          <Activity className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No recent activity</p>
          <p className="mt-1 text-xs">Activity will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
    >
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">
            Recent Activity
          </h3>
          <Link
            href="/activity"
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: index * 0.04 }}
              className="flex items-start gap-3"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getActivityIcon(activity.metadata)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm">
                  {getActivityDescription(activity.metadata)}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ActivityFeedCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
