"use client";

import type React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCircle2,
  DollarSign,
  FileCheck,
  FileText,
  MessageSquare,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationEventType } from "@/features/notifications/events";

const iconMap: Record<
  string,
  { Icon: React.ComponentType<{ className?: string }>; iconClass: string; bgClass: string }
> = {
  // Asset / file events
  "comment.added":           { Icon: MessageSquare, iconClass: "text-blue-600",    bgClass: "bg-blue-50 dark:bg-blue-950/40" },
  "annotation.resolved":     { Icon: CheckCircle2,  iconClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/40" },
  "asset.approved":          { Icon: FileCheck,     iconClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/40" },
  "asset.changes_requested": { Icon: XCircle,       iconClass: "text-amber-600",   bgClass: "bg-amber-50 dark:bg-amber-950/40" },
  "asset.uploaded":          { Icon: FileText,      iconClass: "text-violet-600",  bgClass: "bg-violet-50 dark:bg-violet-950/40" },
  // Invoice events
  "invoice.paid":            { Icon: DollarSign,    iconClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/40" },
  "invoice.overdue":         { Icon: DollarSign,    iconClass: "text-red-600",     bgClass: "bg-red-50 dark:bg-red-950/40" },
  "invoice.sent":            { Icon: DollarSign,    iconClass: "text-blue-600",    bgClass: "bg-blue-50 dark:bg-blue-950/40" },
  // Contract events
  "contract.signed":         { Icon: FileCheck,     iconClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/40" },
  "contract.sent":           { Icon: FileText,      iconClass: "text-violet-600",  bgClass: "bg-violet-50 dark:bg-violet-950/40" },
  // Milestone events
  "milestone.completed":     { Icon: CheckCircle2,  iconClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/40" },
  "milestone.overdue":       { Icon: XCircle,       iconClass: "text-red-600",     bgClass: "bg-red-50 dark:bg-red-950/40" },
  // Project / team events
  "project.health_critical": { Icon: XCircle,       iconClass: "text-red-600",     bgClass: "bg-red-50 dark:bg-red-950/40" },
  "member.invited":          { Icon: Users,         iconClass: "text-blue-600",    bgClass: "bg-blue-50 dark:bg-blue-950/40" },
  "client.portal_viewed":    { Icon: Users,         iconClass: "text-neutral-500", bgClass: "bg-neutral-50 dark:bg-neutral-900" },
  // Legacy event types (before typed catalogue)
  comment_added:             { Icon: MessageSquare, iconClass: "text-blue-600",    bgClass: "bg-blue-50 dark:bg-blue-950/40" },
  file_approved:             { Icon: CheckCircle2,  iconClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/40" },
  file_rejected:             { Icon: XCircle,       iconClass: "text-red-600",     bgClass: "bg-red-50 dark:bg-red-950/40" },
  changes_requested:         { Icon: XCircle,       iconClass: "text-amber-600",   bgClass: "bg-amber-50 dark:bg-amber-950/40" },
  file_uploaded:             { Icon: FileText,      iconClass: "text-violet-600",  bgClass: "bg-violet-50 dark:bg-violet-950/40" },
};

type NotificationItemProps = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: Date | string;
  onClick: (id: string) => void;
};

export function NotificationItem({
  id,
  type,
  title,
  body,
  isRead,
  createdAt,
  onClick,
}: NotificationItemProps) {
  const mapped = iconMap[type] ?? { Icon: Bell, iconClass: "text-neutral-500", bgClass: "bg-neutral-50 dark:bg-neutral-900" };
  const relative = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <button
      type="button"
      id={`notification-item-${id}`}
      onClick={() => onClick(id)}
      className={cn(
        "hover:bg-accent/70 flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        !isRead && "bg-blue-50/60 dark:bg-blue-950/20 border-l-2 border-l-blue-500 pl-[10px]",
      )}
    >
      {/* Icon container */}
      <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", mapped.bgClass)}>
        <mapped.Icon className={cn("h-3.5 w-3.5", mapped.iconClass)} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm leading-snug",
            !isRead ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </p>
        {body ? (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
            {body}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-1 text-[11px]">{relative}</p>
      </div>

      {/* Unread dot */}
      {!isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" /> : null}
    </button>
  );
}
