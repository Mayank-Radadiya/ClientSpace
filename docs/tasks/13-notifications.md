# Task 13 — In-App Notification Bell & Notification Centre

## Goal

Surface the notifications written to the `notifications` table (by Task 11's `sendNotification` engine and Task 12's comment actions) through a **Bell Icon in the header** with an unread-count badge, a **Popover quick-list**, and a **/dashboard/notifications** full-history page.

This task implements **PRD Section 6.8 (In-App Notifications UI)**.

---

## Description

The notification surface consists of three layers:

1. **`NotificationBell`** — A header icon that polls `activityRouter.getNotifications` for the unread count. A red `Badge` is shown when `unreadCount > 0`. Clicking the icon opens a `Popover` containing `NotificationList`.

2. **`NotificationList`** — Renders up to 10 recent notifications inside the Popover. Each item shows a contextual icon (💬 for comments, 📄 for file events), the notification title, a relative timestamp, and a dimmed style for already-read items. Clicking an item calls `markReadMutation` optimistically, then navigates to `notification.link`.

3. **`/dashboard/notifications` page** — Full-history view showing all notifications with pagination, accessible via a "View all" link at the bottom of the Popover. Also the canonical landing page for users arriving from email CTAs.

### Data model (already in schema from Task 11)

| Column      | Type          | Notes                                                        |
| :---------- | :------------ | :----------------------------------------------------------- |
| `id`        | `uuid`        | PK                                                           |
| `userId`    | `uuid`        | FK → `users.id` — recipient                                  |
| `orgId`     | `uuid`        | FK → `organizations.id`                                      |
| `type`      | `text`        | e.g. `"comment_added"`, `"file_approved"`, `"file_rejected"` |
| `title`     | `text`        | Short human-readable title shown in the UI                   |
| `body`      | `text?`       | Optional secondary line                                      |
| `link`      | `text?`       | Deep-link URL the notification routes to                     |
| `isRead`    | `boolean`     | `false` by default; set `true` on click                      |
| `createdAt` | `timestamptz` | Auto-set by DB default                                       |

### Icon mapping by notification type

| `type`          | Icon component  | Color class             |
| :-------------- | :-------------- | :---------------------- |
| `comment_added` | `MessageSquare` | `text-blue-500`         |
| `file_approved` | `CheckCircle2`  | `text-green-500`        |
| `file_rejected` | `XCircle`       | `text-red-500`          |
| `file_uploaded` | `FileText`      | `text-violet-500`       |
| _(default)_     | `Bell`          | `text-muted-foreground` |

### Components delivered in this task

| Artifact           | Path                                                         | Purpose                                       |
| :----------------- | :----------------------------------------------------------- | :-------------------------------------------- |
| tRPC procedures    | `src/server/routers/activity.ts` (extended)                  | `getNotifications`, `markRead`, `markAllRead` |
| `NotificationBell` | `src/features/notifications/components/NotificationBell.tsx` | Header icon + Popover trigger                 |
| `NotificationList` | `src/features/notifications/components/NotificationList.tsx` | List of recent notifications                  |
| `NotificationItem` | `src/features/notifications/components/NotificationItem.tsx` | Single row with icon, text, timestamp         |
| Full-history page  | `src/app/(dashboard)/notifications/page.tsx`                 | Paginated notification history                |
| Header integration | `src/components/layout/ClientHeader.tsx` (updated)           | Mount `NotificationBell`                      |

---

## Tech Stack

| Concern            | Library / Pattern                                                                                      |
| :----------------- | :----------------------------------------------------------------------------------------------------- |
| Data fetching      | tRPC `protectedProcedure` + TanStack Query (`useQuery`)                                                |
| Optimistic updates | TanStack Query `useMutation` with `onMutate` / `onError` rollback                                      |
| Polling            | `useQuery` `refetchInterval: 30_000` (30-second poll in Popover)                                       |
| UI primitives      | `shadcn/ui` — `Popover`, `ScrollArea`, `Button`, `Badge`                                               |
| Icons              | `lucide-react` — `Bell`, `Check`, `CheckCheck`, `MessageSquare`, `FileText`, `CheckCircle2`, `XCircle` |
| Date formatting    | `date-fns` (`formatDistanceToNow`)                                                                     |
| Navigation         | `next/navigation` (`useRouter`)                                                                        |

---

## Instructions

### Step 1 — Extend `activityRouter` with Notification Procedures

Open `src/server/routers/activity.ts` and add three new procedures to the existing router object.

```typescript
// src/server/routers/activity.ts  (additions only — do not replace existing procedures)
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
// ✅ No bare `db` import — all DB access uses ctx.db from the
// protectedProcedure context, which is RLS-scoped via createDrizzleClient.
import { notifications } from "@/db/schema";
import { and, eq, desc, count } from "drizzle-orm";

// Add these to the existing activityRouter:
export const activityRouter = router({
  // … existing procedures (getActivityLogs, etc.) …

  /**
   * Returns the N most-recent notifications for the current user,
   * scoped to the current organization (ctx.orgId).
   *
   * Used by both the Popover quick-list and the full-history page.
   *
   * ✅ Uses ctx.db (RLS-scoped via createDrizzleClient).
   * ✅ Scoped to ctx.orgId — prevents cross-org data bleed (PRD §5).
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const orgId = ctx.orgId;

      const rows = await ctx.db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, userId),
          eq(notifications.orgId, orgId),
        ),
        orderBy: [desc(notifications.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      // Total count across ALL pages (for pagination controls)
      const [{ value: total }] = await ctx.db
        .select({ value: count() })
        .from(notifications)
        .where(
          and(eq(notifications.userId, userId), eq(notifications.orgId, orgId)),
        );

      // Unread count across ALL notifications (not just this page)
      // — drives the bell badge regardless of pagination offset.
      const [{ value: unread }] = await ctx.db
        .select({ value: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.orgId, orgId),
            eq(notifications.isRead, false),
          ),
        );

      return {
        notifications: rows,
        total: Number(total),
        unreadCount: Number(unread),
      };
    }),

  /**
   * Marks a single notification as read.
   * The client calls this optimistically before navigating.
   *
   * ✅ Uses ctx.db — RLS-scoped.
   * ✅ Scoped to ctx.orgId — prevents marking another org's notification.
   */
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, userId),
            eq(notifications.orgId, ctx.orgId), // org-scoped ownership guard
          ),
        );
      return { success: true };
    }),

  /**
   * Marks ALL unread notifications as read for the current org.
   * Bound to the "Mark all as read" button in the Popover header.
   *
   * ✅ Uses ctx.db — RLS-scoped.
   * ✅ Scoped to ctx.orgId — "Mark all read" in Org A will NOT
   *    clear unread notifications in Org B (PRD §5).
   */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.orgId, ctx.orgId),
          eq(notifications.isRead, false),
        ),
      );
    return { success: true };
  }),
});
```

> **Note:** If the existing `activityRouter` uses a named export, append these procedures to the same `router({…})` call. Do **not** create a separate router — the client must access them at `trpc.activity.getNotifications`, etc.

---

### Step 2 — `NotificationItem.tsx`

```tsx
// src/features/notifications/components/NotificationItem.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType =
  | "comment_added"
  | "file_approved"
  | "file_rejected"
  | "file_uploaded"
  | string;

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: Date | string;
  onClick: () => void;
}

const iconMap: Record<
  string,
  { Icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  comment_added: { Icon: MessageSquare, className: "text-blue-500" },
  file_approved: { Icon: CheckCircle2, className: "text-green-500" },
  file_rejected: { Icon: XCircle, className: "text-red-500" },
  file_uploaded: { Icon: FileText, className: "text-violet-500" },
};

export function NotificationItem({
  type,
  title,
  body,
  isRead,
  createdAt,
  onClick,
}: NotificationItemProps) {
  const { Icon, className: iconClass } = iconMap[type] ?? {
    Icon: Bell,
    className: "text-muted-foreground",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60",
        !isRead && "bg-blue-50/50 dark:bg-blue-950/20",
      )}
    >
      {/* Type icon */}
      <span className="mt-0.5 shrink-0">
        <Icon className={cn("h-4 w-4", iconClass)} />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug truncate",
            isRead
              ? "text-muted-foreground font-normal"
              : "text-foreground font-medium",
          )}
        >
          {title}
        </p>
        {body && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {body}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot */}
      {!isRead && (
        <span className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </button>
  );
}
```

---

### Step 3 — `NotificationList.tsx`

```tsx
// src/features/notifications/components/NotificationList.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc/client";
import { NotificationItem } from "./NotificationItem";

/**
 * Renders inside the Bell Popover.
 *
 * ✅ Cache alignment: Uses { limit: 10 } — the SAME input as
 * NotificationBell. When the Popover opens, TanStack Query hits
 * the hot cache and renders instantly (zero redundant network calls).
 */

const POPOVER_INPUT = { limit: 10 } as const;

export function NotificationList() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data, isLoading } = api.activity.getNotifications.useQuery(
    POPOVER_INPUT,
    { refetchInterval: 30_000 },
  );

  const markRead = api.activity.markRead.useMutation({
    // Optimistic: flip isRead = true in the cached list immediately
    onMutate: async ({ notificationId }) => {
      await utils.activity.getNotifications.cancel();
      const prev = utils.activity.getNotifications.getData(POPOVER_INPUT);

      utils.activity.getNotifications.setData(POPOVER_INPUT, (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: Math.max(0, old.unreadCount - 1),
          notifications: old.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n,
          ),
        };
      });

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back on server error
      if (ctx?.prev) {
        utils.activity.getNotifications.setData(POPOVER_INPUT, ctx.prev);
      }
    },
    onSettled: () => {
      // ✅ Wildcard invalidation — clears ALL getNotifications cache entries
      // regardless of input (limit/offset), keeping the history page and
      // bell badge in sync.
      utils.activity.getNotifications.invalidate();
    },
  });

  const markAllRead = api.activity.markAllRead.useMutation({
    onMutate: async () => {
      await utils.activity.getNotifications.cancel();
      const prev = utils.activity.getNotifications.getData(POPOVER_INPUT);

      utils.activity.getNotifications.setData(POPOVER_INPUT, (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: 0,
          notifications: old.notifications.map((n) => ({ ...n, isRead: true })),
        };
      });

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        utils.activity.getNotifications.setData(POPOVER_INPUT, ctx.prev);
      }
    },
    onSettled: () => {
      // ✅ Wildcard invalidation
      utils.activity.getNotifications.invalidate();
    },
  });

  function handleItemClick(notificationId: string, link?: string | null) {
    // Mark read before navigating — fire-and-forget is fine here
    markRead.mutate({ notificationId });
    if (link) {
      router.push(link);
    }
  }

  const notifications = data?.notifications ?? [];
  const hasUnread = (data?.unreadCount ?? 0) > 0;

  return (
    <div className="flex flex-col">
      {/* Popover header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="max-h-[360px]">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="py-10 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm font-medium text-foreground">
              You&apos;re all caught up!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No new notifications.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                type={n.type}
                title={n.title}
                body={n.body}
                isRead={n.isRead}
                createdAt={n.createdAt}
                onClick={() => handleItemClick(n.id, n.link)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer — View all */}
      <Separator />
      <div className="p-2 text-center">
        <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
          <Link href="/dashboard/notifications">View all notifications</Link>
        </Button>
      </div>
    </div>
  );
}
```

---

### Step 4 — `NotificationBell.tsx`

```tsx
// src/features/notifications/components/NotificationBell.tsx
"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/trpc/client";
import { NotificationList } from "./NotificationList";

export function NotificationBell() {
  /**
   * ✅ Cache alignment: Uses { limit: 10 } — the SAME input shape as
   * NotificationList. When the user clicks the bell and the Popover
   * opens, NotificationList instantly hits this hot cache entry and
   * renders without a redundant network request.
   *
   * The `unreadCount` returned by getNotifications is a server-side
   * COUNT(*) across ALL unread notifications (not limited to this page),
   * so 10 rows is sufficient to drive both the badge and the quick-list.
   */
  const { data } = api.activity.getNotifications.useQuery(
    { limit: 10 },
    { refetchInterval: 30_000 },
  );

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-lg" align="end" sideOffset={8}>
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
```

---

### Step 5 — Full-History Page

> **Architecture:** The page is a **Server Component** that prefetches notifications and passes them as `initialData` to `NotificationHistoryList` — a **Client Component** that owns the `markRead` mutation and navigation logic. This avoids the no-op `onClick` anti-pattern and keeps serialisation boundaries explicit.

#### Step 5a — `NotificationHistoryList.tsx` (Client Component)

> **Architecture change (Audit Fix):** The original implementation used `useState(initialData)` with a hardcoded `limit: 100`, making the 101st notification permanently inaccessible. The new version uses `useQuery` with client-driven `page` state and **Previous/Next** pagination controls. The server still prefetches page 1 via `initialData` to avoid the loading spinner on first paint.

```tsx
// src/features/notifications/components/NotificationHistoryList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc/client";
import { NotificationItem } from "./NotificationItem";
import type { RouterOutputs } from "@/lib/trpc/client";

type GetNotificationsOutput = RouterOutputs["activity"]["getNotifications"];
type NotificationRow = GetNotificationsOutput["notifications"][number];

const PAGE_SIZE = 20;

interface NotificationHistoryListProps {
  /** SSR-prefetched first page — avoids loading spinner on initial paint. */
  initialData: GetNotificationsOutput;
}

export function NotificationHistoryList({
  initialData,
}: NotificationHistoryListProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [page, setPage] = useState(0);

  // ✅ Real pagination via useQuery — fetches the correct page of
  // notifications with limit/offset. Page 0 uses SSR initialData;
  // subsequent pages are fetched client-side.
  const { data, isLoading, isFetching } =
    api.activity.getNotifications.useQuery(
      { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      {
        initialData: page === 0 ? initialData : undefined,
        keepPreviousData: true,
      },
    );

  const items = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasUnread = items.some((n) => !n.isRead);

  const markRead = api.activity.markRead.useMutation({
    onSettled: () => {
      // ✅ Wildcard invalidation — keeps bell badge + all pages in sync
      utils.activity.getNotifications.invalidate();
    },
  });

  const markAllRead = api.activity.markAllRead.useMutation({
    onSettled: () => {
      utils.activity.getNotifications.invalidate();
    },
  });

  function handleClick(id: string, link?: string | null) {
    markRead.mutate({ notificationId: id });
    if (link) router.push(link);
  }

  return (
    <div className="space-y-4">
      {/* Page-level "Mark all read" button — mirrors the Popover header action */}
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🎉</p>
          <p className="text-base font-medium">You&apos;re all caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">
            No new notifications.
          </p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "rounded-lg border divide-y divide-border overflow-hidden transition-opacity",
              isFetching && "opacity-60",
            )}
          >
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                type={n.type}
                title={n.title}
                body={n.body}
                isRead={n.isRead}
                createdAt={n.createdAt}
                onClick={() => handleClick(n.id, n.link)}
              />
            ))}
          </div>

          {/* ✅ Pagination controls — Previous / Page X of Y / Next */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                disabled={page === 0 || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>

              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                disabled={page >= totalPages - 1 || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

#### Step 5b — `page.tsx` (Server Component)

> **Audit Fix:** The server now prefetches a standard page (20 items) and passes the **full response** (including `total` and `unreadCount`) to the Client Component, enabling it to render pagination controls on first paint.

```tsx
// src/app/(dashboard)/notifications/page.tsx
import { Bell } from "lucide-react";
import { api } from "@/lib/trpc/server";
import { NotificationHistoryList } from "@/features/notifications/components/NotificationHistoryList";

export const metadata = { title: "Notifications — ClientSpace" };

export default async function NotificationsPage() {
  // Prefetch page 1 — the Client Component uses this as initialData
  // for the first page, then fetches subsequent pages client-side.
  const initialData = await api.activity.getNotifications({
    limit: 20,
    offset: 0,
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Notifications</h1>
      </div>

      {/*
        NotificationHistoryList is a Client Component that owns all
        mutation and pagination logic. initialData is the SSR-prefetched
        first page; useQuery drives subsequent pages client-side.
      */}
      <NotificationHistoryList initialData={initialData} />
    </div>
  );
}
```

> **Why `initialData` instead of full client-side fetching?**
> Prefetching page 1 on the server means the page renders without a loading spinner, which is important since users often land here from an email CTA. The Client Component uses `useQuery` with `page` state for subsequent pages, and `keepPreviousData: true` ensures smooth transitions between pages.

---

### Step 6 — Integrate `NotificationBell` into Headers

#### 6a. Client Header (Task 10)

Open `src/components/layout/ClientHeader.tsx` and add the bell to the right-side actions cluster:

```tsx
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

// Inside the header JSX, alongside the user avatar / sign-out button:
<div className="flex items-center gap-2">
  <NotificationBell />
  {/* … existing user menu … */}
</div>;
```

#### 6b. Admin Header

Locate your admin header component (commonly `src/components/layout/DashboardHeader.tsx` or `src/app/(dashboard)/layout.tsx`). Apply the same import and placement pattern as 6a.

```tsx
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

// In the header's right-side actions:
<div className="flex items-center gap-2">
  <NotificationBell />
  {/* … org switcher, avatar, etc. … */}
</div>;
```

> Both portals (admin and client) share the same `NotificationBell` component. Because the bell queries the `notifications` table filtered by `ctx.session.user.id` **and `ctx.orgId`**, the data is always scoped to the logged-in user within the current organization.

---

### Step 6c — `NotificationToastListener.tsx` (PRD §6.8 — Sonner Toasts)

> **Audit Fix:** PRD §6.8 explicitly mandates: "In-App Notifications: Uses sonner for modern toast notifications... with swipe-to-dismiss." This component detects new unread notifications and fires sonner toasts in real-time.

```tsx
// src/features/notifications/components/NotificationToastListener.tsx
"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc/client";

/**
 * Listens for new unread notifications via polling and fires
 * sonner toasts when the unread count increases.
 *
 * Mount once in the dashboard layout (alongside <Toaster />).
 * Does NOT render any visible UI.
 *
 * ✅ PRD §6.8: "Uses sonner for modern toast notifications...
 *    with swipe-to-dismiss."
 */
export function NotificationToastListener() {
  const prevUnreadRef = useRef<number | null>(null);

  const { data } = api.activity.getNotifications.useQuery(
    { limit: 10 },
    { refetchInterval: 30_000 },
  );

  useEffect(() => {
    if (!data) return;

    const currentUnread = data.unreadCount;

    // On first render, seed the ref without firing a toast
    if (prevUnreadRef.current === null) {
      prevUnreadRef.current = currentUnread;
      return;
    }

    // Fire a toast when new unread notifications arrive
    if (currentUnread > prevUnreadRef.current) {
      const newest = data.notifications.find((n) => !n.isRead);
      const diff = currentUnread - prevUnreadRef.current;

      if (newest) {
        toast(newest.title, {
          description: newest.body ?? undefined,
          action: newest.link
            ? {
                label: "View",
                onClick: () => {
                  window.location.href = newest.link!;
                },
              }
            : undefined,
        });
      } else {
        toast(`${diff} new notification${diff > 1 ? "s" : ""}`);
      }
    }

    prevUnreadRef.current = currentUnread;
  }, [data]);

  return null; // No visible UI
}
```

#### Mounting in the Dashboard Layout

Add `NotificationToastListener` to your dashboard layout alongside the existing `<Toaster />` from sonner:

```tsx
// src/app/(dashboard)/layout.tsx  (additions)
import { Toaster } from "@/components/ui/sonner";
import { NotificationToastListener } from "@/features/notifications/components/NotificationToastListener";

// In the layout JSX:
<Toaster richColors closeButton />
<NotificationToastListener />
```

---

### Step 7 — Drizzle Relations (if missing)

Ensure `src/db/schema.ts` (or `src/db/relations.ts`) includes:

```typescript
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  org: one(organizations, {
    fields: [notifications.orgId],
    references: [organizations.id],
  }),
}));
```

---

## Validation Checklist

Work through these steps after implementation to confirm end-to-end correctness.

### Pre-condition

- Task 11 (`sendNotification` engine) and Task 12 (Comment actions) must be fully deployed. The `notifications` table must exist with at least the schema columns listed in the Description section.

### Security — No Bare `db` Import

- [ ] **Grep audit:** `grep -rn 'from "@/db"' src/server/routers/activity.ts src/features/notifications/` returns **zero results**. All DB access uses `ctx.db` (tRPC) or `getSessionContext` (server actions).
- [ ] **Org scoping:** `grep -n 'ctx.orgId' src/server/routers/activity.ts` shows `orgId` in `getNotifications`, `markRead`, and `markAllRead` WHERE clauses.

### Multi-Tenant Isolation (PRD §5)

- [ ] **Setup:** Create User X who belongs to **both** Org A and Org B. Trigger a notification in Org A and a different notification in Org B.
- [ ] **Verify:** When User X views the bell in Org A's workspace, they see **only** Org A notifications. Switching to Org B's workspace shows **only** Org B notifications.
- [ ] **Mark All Read test:** Click "Mark all read" in Org A. Switch to Org B. Confirm Org B notifications are **still unread**.

### Bell Badge — Unread Count

- [ ] **Setup:** Log in as User A (Admin). Log in as User B (Client) in a separate browser session. Ensure User B has an active project with at least one asset.
- [ ] **Trigger:** As User B (Client), post a new comment on an asset. Verify the Server Action completes without error.
- [ ] **Observe (Admin view):** In User A's session, the Bell icon in the header shows a **red badge with `"1"`** within 30 seconds (next poll cycle) without a page reload.
- [ ] **Persistence:** Reload User A's page. The badge must still show `"1"` (count is server-side, not local state).

### Popover — Quick List (Cache Alignment)

- [ ] User A clicks the Bell icon. A Popover opens containing a `NotificationList`.
- [ ] **No loading spinner:** Because both `NotificationBell` and `NotificationList` use `{ limit: 10 }`, the Popover renders instantly from the hot TanStack Query cache.
- [ ] The notification from User B appears with a **blue `MessageSquare` icon**, the correct title (`"💬 [User B] commented on [Asset Name]"`), a relative timestamp (e.g., "2 minutes ago"), and an **unread dot** on the right.
- [ ] The item background is subtly highlighted (e.g., `bg-blue-50`), distinguishing it from read items.
- [ ] Clicking the notification item: the **unread dot disappears immediately** (optimistic update), the badge count decrements, and the browser navigates to the correct asset deep-link.
- [ ] Reopening the Popover confirms the item is now shown with `text-muted-foreground` (read style) and no dot.

### Mark All Read

- [ ] With two or more unread notifications, open the Popover. A **"Mark all read"** button appears in the header row.
- [ ] Clicking it: all items immediately switch to read style, the badge disappears, and the button itself disappears — all without a page reload.
- [ ] Refreshing the page confirms the server state is persisted (badge stays gone).

### Empty State

- [ ] When all notifications are read (or none exist), the Popover body shows the **"You're all caught up! 🎉"** empty state instead of a list.

### Full-History Page — Pagination

- [ ] Navigate to `/dashboard/notifications`. The first page of notifications (20 items) is shown without a loading spinner (SSR prefetch).
- [ ] If > 20 notifications exist, **Previous/Next** buttons and a **"Page X of Y"** indicator are visible.
- [ ] Clicking **Next** fetches page 2. The list updates (with a subtle opacity transition during fetch).
- [ ] Clicking **Previous** returns to page 1.
- [ ] **Previous** is disabled on page 1; **Next** is disabled on the last page.
- [ ] Clicking an item on any page marks it as read and navigates to the correct link.
- [ ] The page title in the browser tab reads **"Notifications — ClientSpace"**.

### Sonner Toast Notifications (PRD §6.8)

- [ ] With the dashboard open as User A, trigger a new notification (e.g., User B posts a comment).
- [ ] Within 30 seconds, a **sonner toast** appears in User A's browser with the notification title and a "View" action button.
- [ ] Clicking the toast's "View" button navigates to the correct deep-link.
- [ ] Swiping the toast dismisses it (sonner built-in behavior).
- [ ] Refreshing the page does **not** re-fire the toast (the `prevUnreadRef` resets).

### Icon Variants (PRD Visual Constraint)

- [ ] Trigger a file approval (`updateAssetStatusAction` from Task 11). Confirm the resulting notification in the Popover shows a **green `CheckCircle2` icon**.
- [ ] Trigger a file rejection. Confirm a **red `XCircle` icon**.
- [ ] Confirm comment notifications show a **blue `MessageSquare` icon**.

### Concurrent Sessions / Stale Data

- [ ] With two browser tabs open as User A, post a comment as User B. Within 30 seconds, **both** tabs should show the badge update (each runs its own polling interval independently).

### Role Isolation

- [ ] Confirm that User B (Client) does **not** see User A's notifications, and vice versa, by inspecting the Popover content in each session.
