"use client";

import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationList } from "./NotificationList";

const QUERY_INPUT = { limit: 10 } as const;

export function NotificationBell() {
  const { data } = trpc.activity.getNotifications.useQuery(QUERY_INPUT, {
    refetchInterval: 30_000,
  });

  const unread = data?.unreadCount ?? 0;
  const label = unread > 0 ? `${unread} unread notifications` : "Notifications";

  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <Badge
            variant="destructive"
            size="sm"
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px]"
          >
            {unread > 99 ? "99+" : unread}
          </Badge>
        ) : null}
      </PopoverTrigger>

      <PopoverContent align="end" className="p-2">
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
