# Task 14 — Admin Dashboard Analytics Overview

## Goal

Transform the currently-empty `/dashboard` page into a **data-rich business overview** for the organisation Admin: four KPI stat cards, a monthly-revenue bar chart, and a scoped recent-activity feed — all driven by efficient SQL aggregation queries exposed through a dedicated tRPC router.

This task implements **PRD Section 6.1 (Admin Dashboard Overview)**.

---

## Description

The dashboard is the first screen an Admin sees after sign-in. It must answer four questions at a glance:

1. **How much have I earned?** — Total revenue from paid invoices.
2. **What's outstanding?** — Sum of unpaid invoice amounts.
3. **How active am I?** — Count of active (non-archived) projects.
4. **Who am I working with?** — Count of active clients in the org.

Below the stat cards, a **Revenue Over Time** bar chart plots monthly income (paid invoices grouped by `paid_at` month), and a **Recent Activity Feed** recycles the `ActivityTimeline` component from Task 11 to show the last 10 org-wide events.

### Data sources

| Metric              | Table           | Column aggregated   | Filter condition                    |
| :------------------ | :-------------- | :------------------ | :---------------------------------- |
| Total Revenue       | `invoices`      | `SUM(amount_cents)` | `status = 'paid'`                   |
| Outstanding Revenue | `invoices`      | `SUM(amount_cents)` | `status IN ('draft', 'sent')`       |
| Active Projects     | `projects`      | `COUNT(*)`          | `status != 'archived'`              |
| Active Clients      | `clients`       | `COUNT(*)`          | `org_id = ctx.orgId`                |
| Revenue chart       | `invoices`      | `SUM(amount_cents)` | `status = 'paid'`, grouped by month |
| Recent activity     | `activity_logs` | rows                | `org_id = ctx.orgId`, last 10, desc |

> **Performance rule (PRD constraint):** All aggregations **must** use SQL `SUM()` / `COUNT()` via Drizzle — never fetch all rows and reduce in JavaScript.

### Components delivered in this task

| Artifact             | Path                                                       | Purpose                                    |
| :------------------- | :--------------------------------------------------------- | :----------------------------------------- |
| tRPC router          | `src/server/routers/analytics.ts`                          | `getDashboardStats`, `getRevenueChart`     |
| Root router update   | `src/server/routers/_app.ts`                               | Mount `analyticsRouter` at `analytics` key |
| `StatsCards`         | `src/features/analytics/components/StatsCards.tsx`         | Four KPI cards                             |
| `RevenueChart`       | `src/features/analytics/components/RevenueChart.tsx`       | Recharts `BarChart`                        |
| `RecentActivityFeed` | `src/features/analytics/components/RecentActivityFeed.tsx` | Thin wrapper re-using `ActivityTimeline`   |
| Dashboard page       | `src/app/(dashboard)/page.tsx`                             | Composes all three sections                |

---

## Tech Stack

| Concern           | Library / Pattern                                                                                   |
| :---------------- | :-------------------------------------------------------------------------------------------------- |
| Charts            | `recharts` — `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer` |
| Data fetching     | tRPC `protectedProcedure` + `useQuery` (client) / `api` server caller (RSC prefetch)                |
| SQL aggregation   | Drizzle ORM — `sum()`, `count()`, `sql\`DATE_TRUNC\`` raw fragment                                  |
| UI primitives     | `shadcn/ui` — `Card`, `CardHeader`, `CardContent`, `CardTitle`, `Skeleton`                          |
| Icons             | `lucide-react` — `DollarSign`, `FileText`, `FolderKanban`, `Users`                                  |
| Date formatting   | `date-fns` — `format`, `parseISO`                                                                   |
| Activity Timeline | `ActivityTimeline` from Task 11 (`src/features/activity/components/ActivityTimeline.tsx`)           |

Install recharts if not already present:

```bash
npm install recharts
```

---

## Instructions

### Step 1 — Create `analyticsRouter`

```typescript
// src/server/routers/analytics.ts
import { router, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { invoices, projects, clients, activityLogs } from "@/db/schema";
import { and, eq, sum, count, desc, sql } from "drizzle-orm";

export const analyticsRouter = router({
  /**
   * Returns the four KPI values shown by StatsCards.
   * Every value is computed with a single SQL aggregate — no JS filtering.
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.session.user.orgId;

    // 1. Total revenue — sum of paid invoice amounts
    const [revenueRow] = await db
      .select({ value: sum(invoices.amountCents) })
      .from(invoices)
      .where(and(eq(invoices.orgId, orgId), eq(invoices.status, "paid")));

    // 2. Outstanding revenue — sum of draft + sent invoices
    const [outstandingRow] = await db
      .select({ value: sum(invoices.amountCents) })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          sql`${invoices.status} IN ('draft', 'sent')`,
        ),
      );

    // 3. Active projects — count where status is not archived
    const [projectsRow] = await db
      .select({ value: count() })
      .from(projects)
      .where(
        and(eq(projects.orgId, orgId), sql`${projects.status} != 'archived'`),
      );

    // 4. Active clients (all clients belonging to the org)
    const [clientsRow] = await db
      .select({ value: count() })
      .from(clients)
      .where(eq(clients.orgId, orgId));

    return {
      revenueTotalCents: Number(revenueRow?.value ?? 0),
      outstandingCents: Number(outstandingRow?.value ?? 0),
      activeProjects: Number(projectsRow?.value ?? 0),
      activeClients: Number(clientsRow?.value ?? 0),
    };
  }),

  /**
   * Returns monthly revenue for the last 12 months.
   * Each element: { month: "Jan 2025", amountCents: number }
   * Used by RevenueChart (Recharts BarChart).
   *
   * IMPORTANT: `monthTrunc` is extracted as a named const so that the
   * SELECT, GROUP BY, and ORDER BY clauses reference the **exact same**
   * Drizzle SQL fragment object. This prevents the query builder from
   * emitting two separate positional parameters ($1 vs $2) for what is
   * logically the same expression — a subtle bug that can cause PostgreSQL
   * to reject the GROUP BY or return incorrect groupings.
   */
  getRevenueChart: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.session.user.orgId;

    // Single source of truth for the truncated-date expression.
    const monthTrunc = sql`DATE_TRUNC('month', ${invoices.paidAt})`;

    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(${monthTrunc}, 'Mon YYYY')`,
        monthKey: sql<string>`TO_CHAR(${monthTrunc}, 'YYYY-MM')`,
        amountCents: sum(invoices.amountCents),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          eq(invoices.status, "paid"),
          sql`${invoices.paidAt} >= NOW() - INTERVAL '12 months'`,
        ),
      )
      .groupBy(monthTrunc) // same object → identical SQL fragment
      .orderBy(monthTrunc); // ASC is Drizzle's default

    return rows.map((r) => ({
      month: r.month,
      monthKey: r.monthKey,
      amountCents: Number(r.amountCents ?? 0),
    }));
  }),
});
```

> **Note on `paidAt`:** The `invoices` schema (Task 7) stores `paid_at` as a nullable `timestamptz`. The `getRevenueChart` query filters `status = 'paid'`, so `paidAt` is always non-null for the rows we select — no null issues in practice.

---

### Step 2 — Register the router

Open `src/server/routers/_app.ts` and add `analyticsRouter`:

```typescript
// src/server/routers/_app.ts
import { router } from "../trpc";
import { analyticsRouter } from "./analytics";
// … other routers …

export const appRouter = router({
  analytics: analyticsRouter,
  // … existing keys …
});

export type AppRouter = typeof appRouter;
```

---

### Step 3 — `StatsCards.tsx`

```tsx
// src/features/analytics/components/StatsCards.tsx
"use client";

import { DollarSign, FileText, FolderKanban, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc/client";

/**
 * Formats integer cents as a locale currency string.
 * e.g. 150000 → "$1,500.00"
 */
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mt-1" />
        <Skeleton className="h-3 w-40 mt-2" />
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const { data, isLoading } = api.analytics.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const stats = data ?? {
    revenueTotalCents: 0,
    outstandingCents: 0,
    activeProjects: 0,
    activeClients: 0,
  };

  const cards: StatCardProps[] = [
    {
      title: "Total Revenue",
      value:
        stats.revenueTotalCents > 0
          ? formatCurrency(stats.revenueTotalCents)
          : "No revenue yet",
      icon: <DollarSign className="h-4 w-4" />,
      description: "All time, from paid invoices",
    },
    {
      title: "Outstanding",
      value:
        stats.outstandingCents > 0
          ? formatCurrency(stats.outstandingCents)
          : "Nothing outstanding",
      icon: <FileText className="h-4 w-4" />,
      description: "Unpaid & draft invoices",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects.toString(),
      icon: <FolderKanban className="h-4 w-4" />,
      description: "Excluding archived",
    },
    {
      title: "Active Clients",
      value: stats.activeClients.toString(),
      icon: <Users className="h-4 w-4" />,
      description: "In your organisation",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <StatCard key={c.title} {...c} />
      ))}
    </div>
  );
}
```

> **Empty-state rule (PRD constraint):** When a value is zero, show a human label (`"No revenue yet"`, `"Nothing outstanding"`) instead of `"$0.00"`. This prevents "Day 1" dashboards from looking broken.

---

### Step 4 — `RevenueChart.tsx`

```tsx
// src/features/analytics/components/RevenueChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc/client";

/** Formats a Y-axis tick from cents → compact USD (e.g. $1.5k). */
function formatYAxis(cents: number): string {
  if (cents === 0) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return `$${dollars.toFixed(0)}`;
}

/** Custom tooltip shown on bar hover. */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const dollars = (payload[0].value / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Revenue:{" "}
        <span className="text-foreground font-semibold">{dollars}</span>
      </p>
    </div>
  );
}

export function RevenueChart() {
  const { data, isLoading } = api.analytics.getRevenueChart.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue Over Time</CardTitle>
        <CardDescription>
          Monthly income from paid invoices (last 12 months)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 w-full rounded-md" />
        ) : !data || data.length === 0 ? (
          /* Empty state — no paid invoices exist yet */
          <div className="h-56 flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
            <p className="text-3xl">📊</p>
            <p className="text-sm font-medium">No revenue data yet</p>
            <p className="text-xs">
              Revenue will appear here once you mark an invoice as paid.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.1 }} />
              <Bar
                dataKey="amountCents"
                name="Revenue"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

> **Styling note:** The `Bar` uses `className="fill-primary"` which resolves to the design system's primary color automatically in both light and dark mode — no hardcoded hex values needed.

---

### Step 5 — `RecentActivityFeed.tsx`

This is a thin wrapper around the `ActivityTimeline` component built in Task 11. It provides the dashboard-specific heading and error boundary, keeping the timeline component itself reusable.

```tsx
// src/features/analytics/components/RecentActivityFeed.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc/client";
import { ActivityTimeline } from "@/features/activity/components/ActivityTimeline";
import type { RouterOutputs } from "@/lib/trpc/client";

type ActivityRow = RouterOutputs["activity"]["getActivityLogs"]["logs"][number];

interface RecentActivityFeedProps {
  /** SSR-prefetched snapshot from the Server Component page. */
  initialLogs: ActivityRow[];
}

/**
 * Fetches and renders the 10 most-recent org-wide activity log entries.
 *
 * `orgId` is NOT passed as a prop — the `protectedProcedure` on the server
 * already scopes the query to `ctx.session.user.orgId`, so the client only
 * needs to supply `limit`. The Server Component parent prefetches this query
 * and passes `initialLogs` so the card renders without a loading flash.
 */
export function RecentActivityFeed({ initialLogs }: RecentActivityFeedProps) {
  const { data, isLoading } = api.activity.getActivityLogs.useQuery(
    { limit: 10 },
    {
      // Use the SSR-prefetched data as the initial cache value.
      initialData: { logs: initialLogs, total: initialLogs.length },
      staleTime: 30_000, // re-fetch after 30 s
    },
  );

  const logs = data?.logs ?? initialLogs;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading && logs.length === 0 ? (
          <div className="space-y-3 px-4 pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : (
          /*
           * Pass the fetched `logs` array directly to ActivityTimeline.
           * This keeps ActivityTimeline a pure presentational component
           * and avoids a redundant second tRPC call inside the timeline.
           */
          <ActivityTimeline logs={logs} />
        )}
      </CardContent>
    </Card>
  );
}
```

> **If `ActivityTimeline` in Task 11 fetches its own data internally** (i.e. it calls `useQuery` rather than accepting a `logs` prop), refactor it to accept `logs: ActivityLog[]` as a prop and move the `useQuery` call up to the parent. This is the correct separation: one component fetches, the other renders. `RecentActivityFeed` owns the data for the org-scoped dashboard case, and the Project Detail page passes its own project-scoped logs to the same `ActivityTimeline` — no duplication.

---

### Step 6 — Compose the Dashboard Page

Replace the current empty page with the composed layout. This is a **Server Component** that prefetches both analytics queries so the initial render has no loading flash for the stat cards.

```tsx
// src/app/(dashboard)/page.tsx
import { api } from "@/lib/trpc/server";
import { StatsCards } from "@/features/analytics/components/StatsCards";
import { RevenueChart } from "@/features/analytics/components/RevenueChart";
import { RecentActivityFeed } from "@/features/analytics/components/RecentActivityFeed";

export const metadata = { title: "Dashboard — ClientSpace" };

/**
 * Admin dashboard overview — PRD Section 6.1.
 *
 * Prefetches all three data sources in parallel so the initial HTML
 * renders without loading spinners. `initialLogs` is threaded down
 * to `RecentActivityFeed` as a prop so it can seed useQuery's cache.
 */
export default async function DashboardPage() {
  // All three queries fire in parallel — no waterfall.
  const [, , { logs: initialLogs }] = await Promise.all([
    api.analytics.getDashboardStats(),
    api.analytics.getRevenueChart(),
    api.activity.getActivityLogs({ limit: 10 }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your business at a glance.
        </p>
      </div>

      {/* Row 1 — KPI stat cards */}
      <StatsCards />

      {/* Row 2 — Chart + Activity side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        {/* initialLogs seeds useQuery's cache — no client loading flash */}
        <RecentActivityFeed initialLogs={initialLogs} />
      </div>
    </div>
  );
}
```

> **RSC prefetch pattern:** The `await api.analytics.*()` calls in the Server Component populate Next.js's data cache. When the Client Components mount and call `api.analytics.getDashboardStats.useQuery()`, the TanStack Query cache is already warm — they render immediately without a loading state. This is the same pattern used in Tasks 10 and 13.

---

### Step 7 — Wire tRPC server caller (if not already done)

Confirm `src/lib/trpc/server.ts` exports a server-side `api` caller. If it doesn't exist yet, add it:

```typescript
// src/lib/trpc/server.ts
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/context";
import { cache } from "react";

// cache() makes this a per-request singleton in RSCs
const createCaller = createCallerFactory(appRouter);

export const api = cache(async () => {
  const ctx = await createContext();
  return createCaller(ctx);
})();
```

---

## Validation Checklist

Work through these steps after implementation to confirm end-to-end correctness.

### Pre-conditions

- Tasks 5 (Projects), 7 (Invoicing), and 11 (Activity) must be deployed.
- At least one organisation exists with an Admin session available.

---

### Stat Cards — initial render

- [ ] Navigate to `/dashboard` as an Admin. The page title in the browser tab reads **"Dashboard — ClientSpace"**.
- [ ] Four stat cards are visible: **Total Revenue**, **Outstanding**, **Active Projects**, **Active Clients**.
- [ ] On a brand-new org with no data, the Revenue card shows **"No revenue yet"** and Outstanding shows **"Nothing outstanding"** — not `"$0.00"`.
- [ ] Skeleton loaders appear for at most a brief moment (or not at all if SSR prefetch works) before real values render.

---

### Invoice → Dashboard reactivity (core validation)

> This is the primary correctness test described in the task requirements.

- [ ] **Setup:** Ensure at least one draft invoice exists. Note the current "Outstanding" value on the dashboard.
- [ ] **Action:** Create a new invoice via `/dashboard/invoices/new`. Set `amount = $500`, save it (status becomes `"sent"`).
- [ ] **Expected:** Navigate back to `/dashboard`. The **"Outstanding"** card must now show the previous value **+ $500**.
- [ ] **Mark as paid:** Change the invoice status to `"paid"` (mark-paid action from Task 7).
- [ ] **Expected:** Refresh `/dashboard`. The **"Total Revenue"** card increases by $500 and **"Outstanding"** decreases by $500.
- [ ] **Confirm SQL path:** Open the Drizzle query log (or Supabase logs) and verify the revenue update uses `SUM(amount_cents)` — confirming the aggregate query is used, not a JS array filter.

---

### Revenue Chart

- [ ] With at least one paid invoice, the **"Revenue Over Time"** bar chart displays at least one bar for the current month.
- [ ] Hovering a bar shows a tooltip: the month label and a formatted dollar amount (e.g., `"$500.00"`).
- [ ] On a new org with no paid invoices the chart area shows the **"No revenue data yet 📊"** empty state.
- [ ] The chart is responsive: resize the browser window to a narrow width — bars re-scale without overflow.

---

### Recent Activity Feed

- [ ] The activity feed beneath the chart shows entries from Task 11's activity log (file events, status changes).
- [ ] At most **10 entries** appear in the feed — it is not unbounded.
- [ ] The feed correctly attributes events to the **current org only** — switch to a different org (if multi-tenancy is implemented) and confirm a different feed appears.
- [ ] If no activity logs exist yet, the `ActivityTimeline` empty state from Task 11 is shown (not a blank card).

---

### Layout & Responsiveness

- [ ] On screens ≥ `lg` breakpoint: Revenue Chart and Activity Feed appear **side by side** (two columns).
- [ ] On screens `< lg`: they stack **vertically** (single column).
- [ ] Stat cards: 4-column grid on `lg+`, 2-column on `sm`, single column on `xs`.

---

### Performance (PRD constraint)

- [ ] Open the Supabase Dashboard → SQL editor. Run the query below and confirm it uses an index scan and does **not** do a sequential table scan returning all rows:

```sql
EXPLAIN ANALYZE
SELECT SUM(amount_cents)
FROM invoices
WHERE org_id = '<your-org-id>'
  AND status = 'paid';
```

- [ ] Confirm `invoices(org_id, status)` has a composite index. If it doesn't, add a migration:

```sql
CREATE INDEX IF NOT EXISTS invoices_org_status_idx ON invoices(org_id, status);
```
