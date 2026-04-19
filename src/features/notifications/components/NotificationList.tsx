"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./NotificationItem";

const QUERY_INPUT = { limit: 10 } as const;

export function NotificationList() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.activity.getNotifications.useQuery(QUERY_INPUT, {
    refetchInterval: 30_000,
  });

  const markRead = trpc.activity.markRead.useMutation({
    onMutate: async ({ notificationId }) => {
      await utils.activity.getNotifications.cancel(QUERY_INPUT);
      const previous = utils.activity.getNotifications.getData(QUERY_INPUT);

      utils.activity.getNotifications.setData(QUERY_INPUT, (old) => {
        if (!old) return old;
        const wasUnread =
          old.notifications.find((n) => n.id === notificationId)?.read === false;

        return {
          ...old,
          notifications: old.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n,
          ),
          unreadCount: wasUnread ? Math.max(old.unreadCount - 1, 0) : old.unreadCount,
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        utils.activity.getNotifications.setData(QUERY_INPUT, ctx.previous);
      }
    },
    onSettled: async () => {
      await utils.activity.getNotifications.invalidate();
    },
  });

  const markAllRead = trpc.activity.markAllRead.useMutation({
    onMutate: async () => {
      await utils.activity.getNotifications.cancel(QUERY_INPUT);
      const previous = utils.activity.getNotifications.getData(QUERY_INPUT);

      utils.activity.getNotifications.setData(QUERY_INPUT, (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        utils.activity.getNotifications.setData(QUERY_INPUT, ctx.previous);
      }
    },
    onSettled: async () => {
      await utils.activity.getNotifications.invalidate();
    },
  });

  function handleItemClick(notificationId: string, link?: string | null) {
    markRead.mutate({ notificationId });
    if (link) {
      router.push(link);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground p-3 text-sm">Loading notifications...</p>;
  }

  const rows = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="w-[360px]">
      <div className="flex items-center justify-between px-3 pb-2">
        <p className="text-sm font-semibold">Notifications</p>
        {unreadCount > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()}>
            Mark all read
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground px-3 py-6 text-center text-sm">
          You&apos;re all caught up! 🎉
        </p>
      ) : (
        <div className="space-y-1">
          {rows.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              type={n.type}
              title={n.title}
              body={n.body}
              isRead={n.read}
              createdAt={n.createdAt}
              onClick={() => handleItemClick(n.id, n.link)}
            />
          ))}
        </div>
      )}

      <div className="border-border mt-2 border-t px-3 pt-2">
        <Link href="/notifications" className="text-primary text-sm hover:underline">
          View all notifications
        </Link>
      </div>
    </div>
  );
}
