"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./NotificationItem";

const PAGE_SIZE = 20;

type GetNotificationsOutput = RouterOutputs["activity"]["getNotifications"];

export function NotificationHistoryList({
  initialData,
}: {
  initialData: GetNotificationsOutput;
}) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const utils = trpc.useUtils();

  const queryInput = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };

  const { data, isLoading, isFetching } = trpc.activity.getNotifications.useQuery(
    queryInput,
    {
      initialData: page === 0 ? initialData : undefined,
      placeholderData: keepPreviousData,
    },
  );

  const markRead = trpc.activity.markRead.useMutation({
    onSettled: async () => {
      await utils.activity.getNotifications.invalidate();
    },
  });

  const markAllRead = trpc.activity.markAllRead.useMutation({
    onSettled: async () => {
      await utils.activity.getNotifications.invalidate();
    },
  });

  if (isLoading && !data) {
    return <p className="text-muted-foreground text-sm">Loading notifications...</p>;
  }

  const notifications = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unreadCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {unreadCount > 0 ? (
          <Button variant="outline" onClick={() => markAllRead.mutate()}>
            Mark all as read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-6 text-sm">
          You&apos;re all caught up! 🎉
        </p>
      ) : (
        <div
          className={cn(
            "space-y-1 rounded-lg border p-2 transition-opacity",
            isFetching && "opacity-60",
          )}
        >
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              type={n.type}
              title={n.title}
              body={n.body}
              isRead={n.read}
              createdAt={n.createdAt}
              onClick={() => {
                markRead.mutate({ notificationId: n.id });
                if (n.link) {
                  router.push(n.link);
                }
              }}
            />
          ))}
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            Previous
          </Button>
          <p className="text-muted-foreground text-sm">
            Page {page + 1} of {totalPages}
          </p>
          <Button
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
