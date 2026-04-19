"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

const QUERY_INPUT = { limit: 10 } as const;

export function NotificationToastListener() {
  const router = useRouter();
  const prevUnreadRef = useRef<number | null>(null);

  const { data } = trpc.activity.getNotifications.useQuery(QUERY_INPUT, {
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!data) return;

    const currentUnread = data.unreadCount;
    const prevUnread = prevUnreadRef.current;

    if (prevUnread === null) {
      prevUnreadRef.current = currentUnread;
      return;
    }

    if (currentUnread > prevUnread) {
      const newest = data.notifications.find((n) => !n.read) ?? data.notifications[0];

      if (newest) {
        toast(newest.title, {
          description: newest.body ?? "You have a new notification.",
          action: newest.link
            ? {
                label: "View",
                onClick: () => {
                  if (newest.link) {
                    router.push(newest.link);
                  }
                },
              }
            : undefined,
        });
      }
    }

    prevUnreadRef.current = currentUnread;
  }, [data, router]);

  return null;
}
