"use client";

// NotificationBell
// ─────────────────────────────────────────────────────────────────────────────
// The bell icon in the dashboard header that shows the unread count and
// opens the notification list popover.
//
// Realtime strategy:
//   - The Inngest worker broadcasts to `notifications:{userId}` after inserting
//     each in-app notification (server-side, admin client).
//   - This component subscribes to that channel and immediately invalidates the
//     tRPC query, eliminating the 30s polling delay for in-app notifications.
//   - Supabase Realtime does not enforce Row-Level Security on broadcast channels,
//     so we only subscribe to the user's own channel (keyed by userId).
//
// Badge displays "9+" when unread count is ≥ 10.

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { NotificationList } from "./NotificationList";

const QUERY_INPUT = { limit: 10 } as const;

export function NotificationBell() {
  const utils = trpc.useUtils();

  const { data } = trpc.activity.getNotifications.useQuery(QUERY_INPUT, {
    // Reduce polling interval — Realtime will catch most updates instantly.
    // Keep a slow fallback poll for environments where Realtime is not configured.
    refetchInterval: 60_000,
  });

  // Realtime subscription — broadcasts fired by the Inngest worker
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // We can't read the userId directly here without an extra fetch.
    // Retrieve it from the auth session (cached from Supabase SSR).
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.user?.id) return;

      const userId = session.user.id;
      const channelName = `notifications:${userId}`;

      const channel = supabase
        .channel(channelName)
        .on("broadcast", { event: "new_notification" }, () => {
          // Immediately invalidate so the bell count and list refresh
          void utils.activity.getNotifications.invalidate();
          void utils.activity.unreadCount.invalidate();
        })
        .subscribe();

      channelRef.current = channel;
    });

    return () => {
      cancelled = true;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [utils]);

  const unread = data?.unreadCount ?? 0;
  const displayCount = unread > 9 ? "9+" : unread;
  const label = unread > 0 ? `${unread} unread notifications` : "Notifications";

  return (
    <Popover>
      <PopoverTrigger
        id="notification-bell-trigger"
        aria-label={label}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <Badge
            variant="destructive"
            size="sm"
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] tabular-nums"
          >
            {displayCount}
          </Badge>
        ) : null}
      </PopoverTrigger>

      <PopoverContent align="end" className="p-2">
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
