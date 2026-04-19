"use client";

import type React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCircle2,
  FileText,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType =
  | "comment_added"
  | "file_approved"
  | "file_rejected"
  | "file_uploaded"
  | "changes_requested"
  | (string & {});

const iconMap: Record<
  string,
  { Icon: React.ComponentType<{ className?: string }>; iconClass: string }
> = {
  comment_added: { Icon: MessageSquare, iconClass: "text-blue-600" },
  file_approved: { Icon: CheckCircle2, iconClass: "text-emerald-600" },
  file_rejected: { Icon: XCircle, iconClass: "text-red-600" },
  changes_requested: { Icon: XCircle, iconClass: "text-red-600" },
  file_uploaded: { Icon: FileText, iconClass: "text-violet-600" },
};

type NotificationItemProps = {
  id: string;
  type: NotificationType;
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
  const mapped = iconMap[type] ?? { Icon: Bell, iconClass: "text-neutral-500" };
  const relative = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "hover:bg-accent/70 flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        !isRead && "bg-blue-50/50",
      )}
    >
      <mapped.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", mapped.iconClass)} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            !isRead ? "font-semibold" : "text-muted-foreground",
          )}
        >
          {title}
        </p>
        {body ? (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
            {body}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-1 text-xs">{relative}</p>
      </div>
      {!isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" /> : null}
    </button>
  );
}
