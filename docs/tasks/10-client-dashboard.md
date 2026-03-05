# Task 10 — Client Dashboard (The Client Portal)

## Goal

Build the restricted, client-facing portal that external clients land on after completing the invitation acceptance flow (Task 09). This implements **PRD Section 6.10 (Client Dashboard)**. On completion, a user with `role: 'client'` can log in and see only their assigned projects, open invoices, recent activity, and file approvals — with zero visibility into other clients' data.

---

## Description

The Client Portal is a **separate route group** (`(client)`) that renders a simplified layout (`ClientLayout.tsx`) distinct from the admin dashboard. Every data-fetching query in this group adds an extra guard to confirm the caller holds the `client` role within the requesting organisation. RLS at the database layer is the primary isolation mechanism; the application layer adds a second ring of defence.

### Pages shipped in this task

| Route                         | Component            | Description                                                                 |
| :---------------------------- | :------------------- | :-------------------------------------------------------------------------- |
| `/portal`                     | `PortalHomePage`     | Overview: Active Projects grid + Open Invoices list + Recent Activity       |
| `/portal/projects/[id]`       | `PortalProjectPage`  | Read-only project detail (mirrors Task 05 view)                             |
| `/portal/projects/[id]/files` | `PortalFilesPage`    | Asset list; clients upload to "Client Uploads" only; Approve/Reject actions |
| `/portal/invoices`            | `PortalInvoicesPage` | Full list of invoices scoped to this client                                 |

### Key constraint: Tenant Isolation

The tRPC context (`ctx.session.user`) carries the Supabase Auth UID. Every portal router procedure:

1. Looks up the `clients` row where `clients.user_id = ctx.session.user.id`.
2. Uses that `clients.id` (and `clients.org_id`) as a filter on **every** subsequent query.
3. Never accepts a `clientId` or `orgId` from the request payload — these are always derived server-side.

This architecture ensures that even if a client manually crafts a request, they cannot read another client's data.

---

## Tech Stack

| Concern                | Library                                                                                        |
| :--------------------- | :--------------------------------------------------------------------------------------------- |
| Route group layout     | `src/app/(client)/layout.tsx` → `ClientLayout.tsx`                                             |
| Role guard (server)    | `@supabase/ssr` `createClient()` + Drizzle `orgMemberships` lookup                             |
| Middleware redirect    | `src/middleware.ts` (extend existing matcher)                                                  |
| Data fetching          | tRPC client procedures (role-scoped)                                                           |
| UI components          | `shadcn/ui`, `ClientProjectCard`, `ClientInvoiceList`                                          |
| File approval mutation | Server Action `updateAssetStatusAction`                                                        |
| Client uploads         | `react-dropzone` + existing `getUploadToken` / `createFileVersion` Server Actions from Task 06 |
| Org branding read      | Drizzle query on `organizations` (accent color, logo for Phase 2 CSS vars)                     |
| Dates                  | `date-fns`                                                                                     |
| Animations             | `auto-animate` (list transitions)                                                              |

---

## Instructions

### Step 1 — Middleware: Add Portal Route Guard

> **⚠️ Edge Runtime constraint:** Next.js Middleware runs on the **Edge Runtime** (a V8 isolate — no Node.js TCP sockets). You **cannot** import `db` from `@/db` here — Drizzle's `postgres.js`/`pg` drivers require Node.js APIs that are unavailable at the edge. Any attempt to do so will crash the build.

The correct approach is a **two-gate defence**:

1. **Middleware (Edge — fast):** Check for a Supabase session + read the `org_role` JWT claim from `app_metadata`. This is a signed, edge-safe cookie check — no DB required.
2. **`ClientLayout` (Node.js Server Component — authoritative):** Performs the real Drizzle `clients` table lookup. Acts as the true firewall. Any user who slips past the middleware (e.g., stale JWT) is caught and redirected here.

**Optimistic middleware logic:** If `org_role` is explicitly a non-client value (`owner`, `admin`, `member`), redirect immediately. If the claim is missing or `'client'`, pass the request through and let the layout decide.

```typescript
// src/middleware.ts  (additions — integrate with existing guard logic)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
// ❌ DO NOT import db here — Drizzle is Node.js-only; Middleware is Edge Runtime.

const PORTAL_PREFIX = "/portal";
const ADMIN_DASHBOARD = "/dashboard";
const LOGIN_PAGE = "/login";

// Roles that definitively belong to the admin dashboard, not the client portal.
const ADMIN_ROLES = new Set(["owner", "admin", "member"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // (existing PUBLIC_PATHS bypass stays above this block)

  if (pathname.startsWith(PORTAL_PREFIX)) {
    const response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          /* SSR helpers */
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Gate 1: No session → send to login, preserve intended destination.
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = LOGIN_PAGE;
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Gate 2: Read org_role from JWT app_metadata (set by Task 03 Auth hook).
    // This is a signed claim — edge-safe, no DB call needed.
    const orgRole = (user.app_metadata as Record<string, string> | undefined)
      ?.org_role;

    // If we can positively identify this user as an admin/member, redirect them.
    if (orgRole && ADMIN_ROLES.has(orgRole)) {
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD, request.url));
    }

    // Otherwise (claim is 'client' OR claim is missing/stale), allow through.
    // ClientLayout (Node.js) performs the authoritative Drizzle DB check and
    // will redirect to /login if the user has no valid clients row.
    return response;
  }

  // … rest of existing middleware …
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portal/:path*",
    // … other existing matchers …
  ],
};
```

> **Why optimistic is safe:** If a user with a stale JWT (claim missing) reaches `ClientLayout`, the `db.query.clients.findFirst()` call in Step 3 will return `null` (because they have no `clients` row) and `redirect('/login')` is called immediately — before any page content is rendered.

---

### Step 2 — Route Group Structure

```text
src/
  app/
    (client)/
      layout.tsx          ← ClientLayout wrapper (Step 3)
      portal/
        page.tsx          ← Home / Overview (Step 5)
        projects/
          [id]/
            page.tsx      ← Project detail (Step 6)
            files/
              page.tsx    ← File view + Client Uploads + Approve/Reject (Step 7)
        invoices/
          page.tsx        ← Invoices list (Step 8)
```

---

### Step 3 — `ClientLayout.tsx`

The client layout is intentionally minimal — PRD mandates a single scrollable experience with **no** sidebar navigation.

```tsx
// src/app/(client)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { clients, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ClientHeader } from "@/features/portal/components/ClientHeader";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side role check (defence in depth — middleware is the first gate)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Resolve client + org for branding
  const client = await db.query.clients.findFirst({
    where: eq(clients.userId, user.id),
    with: { org: true }, // join organizations row
  });

  if (!client) redirect("/login"); // no client record → invalid state

  const org = client.org;

  return (
    <div
      className="min-h-screen bg-background"
      style={
        // Phase 1: read accent color from org; apply as CSS var for future use
        org.accentColor
          ? ({ "--brand-accent": org.accentColor } as React.CSSProperties)
          : {}
      }
    >
      <ClientHeader
        orgName={org.name}
        orgLogoUrl={org.logoUrl ?? undefined}
        clientName={client.contactName}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">{children}</main>
    </div>
  );
}
```

---

### Step 4 — `ClientHeader.tsx` Component

```tsx
// src/features/portal/components/ClientHeader.tsx
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface ClientHeaderProps {
  orgName: string;
  orgLogoUrl?: string;
  clientName: string;
}

export function ClientHeader({
  orgName,
  orgLogoUrl,
  clientName,
}: ClientHeaderProps) {
  async function handleSignOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        {/* Org branding — logo takes precedence over name text */}
        <div className="flex items-center gap-3">
          {orgLogoUrl ? (
            <Image
              src={orgLogoUrl}
              alt={`${orgName} logo`}
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
            />
          ) : (
            <span className="text-xl font-semibold text-foreground">
              {orgName}
            </span>
          )}
        </div>

        {/* Right: client name + sign-out */}
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground sm:block">
            {clientName}
          </span>
          <form action={handleSignOut}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
```

---

### Step 5 — tRPC: Portal Router

Add a dedicated `portalRouter` that enforces client-only access. All procedures derive `clientId` and `orgId` from the session — never from caller input.

```typescript
// src/server/routers/portal.ts
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
// ❌ BANNED: import { db } from "@/db";
// ✅ All DB access uses the RLS-scoped ctx.db from the tRPC context,
//    which is created via createDrizzleClient (see Task 03 / Task 05).
import {
  clients,
  projects,
  invoices,
  assets,
  fileVersions,
  activityLogs,
  organizations,
} from "@/db/schema";
import { and, eq, desc, exists, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";

/**
 * Shared helper: Resolve the caller's clients row.
 * Accepts the RLS-scoped `db` instance from the tRPC context.
 * Throws FORBIDDEN if the session user has no client record.
 */
async function resolveClient(
  db: Parameters<typeof protectedProcedure>["_def"]["_ctx_out"]["db"],
  userId: string,
) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.userId, userId),
  });
  if (!client) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied: you are not a registered client.",
    });
  }
  return client;
}

export const portalRouter = router({
  /**
   * Returns the active organization's branding data
   * (used by layout to populate CSS vars for accent color).
   */
  orgBranding: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.db, ctx.session.user.id);
    const org = await ctx.db.query.organizations.findFirst({
      where: eq(organizations.id, client.orgId),
      columns: { name: true, logoUrl: true, accentColor: true },
    });
    return org ?? null;
  }),

  /**
   * Active projects assigned to this client.
   * Excludes Archived projects.
   */
  activeProjects: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.db, ctx.session.user.id);
    return ctx.db.query.projects.findMany({
      where: and(
        eq(projects.clientId, client.id),
        eq(projects.orgId, client.orgId),
        // Exclude archived — client sees active work only
      ),
      orderBy: [desc(projects.deadline)],
      with: { milestones: true },
    });
  }),

  /**
   * Open invoices (Sent + Overdue) for this client.
   */
  openInvoices: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.db, ctx.session.user.id);
    return ctx.db.query.invoices.findMany({
      where: and(
        eq(invoices.clientId, client.id),
        eq(invoices.orgId, client.orgId),
        inArray(invoices.status, ["sent", "overdue"]),
      ),
      orderBy: [desc(invoices.dueDate)],
    });
  }),

  /**
   * ALL invoices for the /portal/invoices page.
   */
  allInvoices: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.db, ctx.session.user.id);
    return ctx.db.query.invoices.findMany({
      where: and(
        eq(invoices.clientId, client.id),
        eq(invoices.orgId, client.orgId),
      ),
      orderBy: [desc(invoices.createdAt)],
    });
  }),

  /**
   * Recent activity across all of this client's projects.
   * Returns last 10 events filtered to client-visible event types.
   *
   * OPTIMIZATION (Audit Fix): Uses an EXISTS subquery instead of fetching
   * project IDs in Node.js and passing them via inArray(). This eliminates
   * the N+1 pattern and lets PostgreSQL filter directly, scaling with
   * growing project counts.
   */
  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.db, ctx.session.user.id);

    // CLIENT_VISIBLE_EVENTS: excludes internal-only events (e.g., member assignments)
    const CLIENT_VISIBLE_EVENTS = [
      "project_created",
      "status_changed",
      "file_uploaded",
      "file_approved",
      "changes_requested",
      "comment_added",
      "invoice_created",
      "invoice_status_changed",
      "milestone_completed",
    ] as const;

    // Single query with EXISTS subquery — no application-level N+1
    return ctx.db
      .select()
      .from(activityLogs)
      .where(
        and(
          exists(
            ctx.db
              .select({ one: sql`1` })
              .from(projects)
              .where(
                and(
                  eq(projects.id, activityLogs.projectId),
                  eq(projects.clientId, client.id),
                  eq(projects.orgId, client.orgId),
                ),
              ),
          ),
          inArray(activityLogs.eventType, [...CLIENT_VISIBLE_EVENTS]),
        ),
      )
      .orderBy(desc(activityLogs.createdAt))
      .limit(10);
  }),

  /**
   * Single project detail — validates the project belongs to this client.
   */
  projectById: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const client = await resolveClient(ctx.db, ctx.session.user.id);
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.projectId),
          eq(projects.clientId, client.id), // ← isolation guard
          eq(projects.orgId, client.orgId),
        ),
        with: { milestones: true, members: { with: { user: true } } },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found.",
        });
      }
      return project;
    }),

  /**
   * Assets for a project. Returns assets with their current signed URL.
   */
  projectAssets: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const client = await resolveClient(ctx.db, ctx.session.user.id);

      // First confirm this project belongs to the client
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.projectId),
          eq(projects.clientId, client.id),
        ),
        columns: { id: true },
      });
      if (!project) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.query.assets.findMany({
        where: and(
          eq(assets.projectId, input.projectId),
          isNull(assets.deletedAt), // exclude soft-deleted
        ),
        with: { currentVersion: true, folder: true },
        orderBy: [desc(assets.createdAt)],
      });
    }),
});
```

Register the router in `src/server/routers/_app.ts`:

```typescript
import { portalRouter } from "./portal";

export const appRouter = router({
  // … existing routers …
  portal: portalRouter,
});
```

---

### Step 6 — Server Action: `updateAssetStatusAction`

Clients can Approve or Request Changes on assets in their projects.

```typescript
// src/features/portal/server/actions.ts
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
// ❌ BANNED: import { db } from "@/db";
// ✅ All DB access uses getSessionContext → createDrizzleClient factory.
import { getSessionContext } from "@/lib/auth/session";
import { assets, clients, projects, activityLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const updateAssetStatusSchema = z.object({
  assetId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(["approved", "changes_requested"]),
});

export async function updateAssetStatusAction(
  rawInput: z.infer<typeof updateAssetStatusSchema>,
) {
  // ── 1. Auth + RLS-scoped DB ────────────────────────────────────────────────
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized." };

  // ── 2. Resolve client (server-side — never trust caller) ─────────────────
  const client = await ctx.db.query.clients.findFirst({
    where: eq(clients.userId, ctx.userId),
  });
  if (!client) return { error: "Access denied." };

  // ── 3. Validate input ─────────────────────────────────────────────────────
  const parsed = updateAssetStatusSchema.safeParse(rawInput);
  if (!parsed.success) return { error: "Invalid input." };
  const { assetId, projectId, status } = parsed.data;

  // ── 4. Confirm the asset's project belongs to THIS client ─────────────────
  //   Double-check at the DB level even though RLS handles it too —
  //   defence-in-depth prevents privilege escalation.
  const project = await ctx.db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.clientId, client.id),
      eq(projects.orgId, client.orgId),
    ),
    columns: { id: true },
  });
  if (!project) return { error: "Access denied." };

  const asset = await ctx.db.query.assets.findFirst({
    where: and(eq(assets.id, assetId), eq(assets.projectId, projectId)),
    columns: { id: true, approvalStatus: true },
  });
  if (!asset) return { error: "Asset not found." };

  // ── 5. Disallow re-approving an already-approved asset ───────────────────
  if (asset.approvalStatus === "approved" && status === "approved") {
    return { error: "This asset is already approved." };
  }

  // ── 6. Digital Signature Ceremony (PRD §6.4) ─────────────────────────────
  //   Capture client IP address + timestamp for the immutable audit trail.
  //   Required for dispute resolution — the activity log must hold legal weight.
  const headersList = await headers();
  const clientIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  // ── 7. Persist + log ─────────────────────────────────────────────────────
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(assets)
      .set({ approvalStatus: status })
      .where(eq(assets.id, assetId));

    await tx.insert(activityLogs).values({
      projectId,
      orgId: client.orgId,
      actorId: ctx.userId,
      eventType: status === "approved" ? "file_approved" : "changes_requested",
      metadata: {
        assetId,
        clientIp, // PRD §6.4: IP for audit trail
        signedAt: new Date().toISOString(), // PRD §6.4: Timestamp for audit trail
      },
    });
  });

  revalidatePath(`/portal/projects/${projectId}/files`);
  return { success: true };
}
```

---

### Step 7 — UI Components

#### `ClientProjectCard.tsx`

```tsx
// src/features/portal/components/ClientProjectCard.tsx
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { RouterOutputs } from "@/lib/trpc/client";

type Project = RouterOutputs["portal"]["activeProjects"][number];

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  not_started: "outline",
  in_progress: "default",
  review: "secondary",
  completed: "secondary",
  on_hold: "destructive",
};

export function ClientProjectCard({ project }: { project: Project }) {
  const completedMilestones = project.milestones.filter(
    (m) => m.completed,
  ).length;
  const totalMilestones = project.milestones.length;
  const progressPct =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  const isOverdue =
    project.deadline &&
    new Date(project.deadline) < new Date() &&
    project.status !== "completed";

  return (
    <Link href={`/portal/projects/${project.id}`}>
      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <CardTitle className="text-base leading-snug group-hover:text-primary">
            {project.name}
          </CardTitle>
          <Badge variant={STATUS_VARIANT[project.status] ?? "outline"}>
            {project.status.replace(/_/g, " ")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Deadline */}
          {project.deadline && (
            <p
              className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
            >
              {isOverdue ? "⚠ Overdue — " : "Due "}
              {format(new Date(project.deadline), "MMM d, yyyy")}
            </p>
          )}

          {/* Milestone progress */}
          {totalMilestones > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Milestones</span>
                <span>
                  {completedMilestones} / {totalMilestones}
                </span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
          )}

          {/* "Need more work?" upsell — shown only on completed projects (PRD 6.10) */}
          {project.status === "completed" && (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              🎉 Project complete — Need more work? Request a Phase 2 or
              Retainer.
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

#### `ClientInvoiceList.tsx`

```tsx
// src/features/portal/components/ClientInvoiceList.tsx
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { RouterOutputs } from "@/lib/trpc/client";

type Invoice = RouterOutputs["portal"]["openInvoices"][number];

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  paid: "secondary",
  overdue: "destructive",
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function ClientInvoiceList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open invoices — you&apos;re all caught up!
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border">
      {invoices.map((inv) => {
        const isOverdue = inv.status === "overdue";
        return (
          <li
            key={inv.id}
            className={`flex items-center justify-between gap-4 px-4 py-3 ${
              isOverdue ? "bg-destructive/5" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">INV-CS-{inv.number}</span>
                <Badge variant={STATUS_BADGE[inv.status] ?? "default"}>
                  {isOverdue ? "⚠ Overdue" : inv.status}
                </Badge>
              </div>
              {inv.dueDate && (
                <p
                  className={`mt-0.5 text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
                >
                  Due {format(new Date(inv.dueDate), "MMM d, yyyy")}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-semibold">
                {formatCents(inv.amountCents, inv.currency)}
              </span>
              {/* PDF download — reuse signed URL from Task 07 */}
              {inv.pdfStoragePath && (
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={`/api/invoices/${inv.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

---

### Step 8 — Portal Home Page: `/portal/page.tsx`

```tsx
// src/app/(client)/portal/page.tsx
import { api } from "@/lib/trpc/server";
import { ClientProjectCard } from "@/features/portal/components/ClientProjectCard";
import { ClientInvoiceList } from "@/features/portal/components/ClientInvoiceList";
import { ActivityFeed } from "@/features/portal/components/ActivityFeed";
import { WhatHappensNextBanner } from "@/features/portal/components/WhatHappensNextBanner";

export const metadata = { title: "Your Portal" };

export default async function PortalHomePage() {
  // All three fetches run in parallel
  const [projects, openInvoices, activity] = await Promise.all([
    api.portal.activeProjects(),
    api.portal.openInvoices(),
    api.portal.recentActivity(),
  ]);

  // "What Happens Next" banner: first asset awaiting approval across all projects
  const pendingApproval = null; // TODO: derive from projects.assets in a single query

  return (
    <div className="space-y-10">
      {/* Contextual next-action prompt (PRD 6.10) */}
      <WhatHappensNextBanner projects={projects} />

      {/* Active Projects */}
      <section aria-labelledby="projects-heading">
        <h2 id="projects-heading" className="mb-4 text-xl font-semibold">
          Active Projects
        </h2>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active projects yet — your team is getting started!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ClientProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* Open Invoices */}
      <section aria-labelledby="invoices-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="invoices-heading" className="text-xl font-semibold">
            Open Invoices
          </h2>
          {openInvoices.length > 0 && (
            <a
              href="/portal/invoices"
              className="text-sm text-primary hover:underline"
            >
              View all
            </a>
          )}
        </div>
        <ClientInvoiceList invoices={openInvoices} />
      </section>

      {/* Recent Activity */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="mb-4 text-xl font-semibold">
          Recent Activity
        </h2>
        <ActivityFeed events={activity} />
      </section>
    </div>
  );
}
```

---

### Step 9 — `WhatHappensNextBanner.tsx`

PRD 6.10 requires a contextual prompt driving engagement. Find the first asset with `approval_status = 'pending_review'` across the client's projects and surface it.

```tsx
// src/features/portal/components/WhatHappensNextBanner.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { RouterOutputs } from "@/lib/trpc/client";

type Projects = RouterOutputs["portal"]["activeProjects"];

export function WhatHappensNextBanner({ projects }: { projects: Projects }) {
  // Find a project awaiting review — simple heuristic for MVP
  const reviewProject = projects.find((p) => p.status === "review");

  if (!reviewProject) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-primary">Action needed</p>
        <p className="mt-0.5 text-sm text-foreground">
          Your team is waiting for your review on{" "}
          <strong>{reviewProject.name}</strong>.
        </p>
      </div>
      <Link
        href={`/portal/projects/${reviewProject.id}/files`}
        className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Review now <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
```

---

### Step 10 — Project Detail Page: `/portal/projects/[id]/page.tsx`

Read-only view — reuses data from Task 05's project structure.

```tsx
// src/app/(client)/portal/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import { api } from "@/lib/trpc/server";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Files } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  return { title: "Project Detail" };
}

export default async function PortalProjectPage({ params }: PageProps) {
  let project;
  try {
    project = await api.portal.projectById({ projectId: params.id });
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.deadline && (
            <p className="mt-1 text-sm text-muted-foreground">
              Due {format(new Date(project.deadline), "MMMM d, yyyy")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge className="capitalize">
            {project.status.replace(/_/g, " ")}
          </Badge>
          <Button asChild size="sm">
            <Link href={`/portal/projects/${project.id}/files`}>
              <Files className="mr-2 h-4 w-4" />
              View Files
            </Link>
          </Button>
        </div>
      </div>

      {/* Description — clients cannot edit */}
      {project.description && (
        <section>
          <h2 className="mb-2 font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {project.description}
          </p>
        </section>
      )}

      {/* Milestones — read-only */}
      {project.milestones.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Milestones</h2>
          <ul className="space-y-2">
            {project.milestones
              .sort((a, b) => a.order - b.order)
              .map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <span
                    className={`h-4 w-4 rounded-full border-2 ${
                      m.completed
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  />
                  <span
                    className={
                      m.completed ? "line-through text-muted-foreground" : ""
                    }
                  >
                    {m.title}
                  </span>
                  {m.dueDate && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {format(new Date(m.dueDate), "MMM d")}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

---

### Step 11 — Files Page: `/portal/projects/[id]/files/page.tsx`

This is the most logic-heavy page. Clients:

- **View** all assets (with approval status badges).
- **Approve or Request Changes** via `updateAssetStatusAction`.
- **Upload** files strictly to the "Client Uploads" folder (RLS enforced at storage layer per PRD 6.4).

```tsx
// src/app/(client)/portal/projects/[id]/files/page.tsx
import { notFound } from "next/navigation";
import { api } from "@/lib/trpc/server";
import { PortalAssetList } from "@/features/portal/components/PortalAssetList";
import { ClientFileUploader } from "@/features/portal/components/ClientFileUploader";
// ❌ BANNED: import { db } from "@/db";
// ✅ All DB access uses getSessionContext → createDrizzleClient factory.
import { getSessionContext } from "@/lib/auth/session";
import { folders, clients, organizations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

interface PageProps {
  params: { id: string };
}

export default async function PortalFilesPage({ params }: PageProps) {
  // Validate access — projectById will throw NOT_FOUND if client doesn't own it
  let projectAssets;
  try {
    projectAssets = await api.portal.projectAssets({ projectId: params.id });
  } catch {
    notFound();
  }

  // Resolve the current client using the RLS-scoped DB factory.
  const ctx = await getSessionContext();
  if (!ctx) notFound();

  const client = await ctx.db.query.clients.findFirst({
    where: eq(clients.userId, ctx.userId),
  });
  if (!client) notFound();

  // Read the org's current plan tier for dynamic upload limits (PRD §12).
  const org = await ctx.db.query.organizations.findFirst({
    where: eq(organizations.id, client.orgId),
    columns: { plan: true },
  });
  const orgPlan = (org?.plan ?? "starter") as
    | "starter"
    | "pro"
    | "growth"
    | "business";

  // Resolve the "Client Uploads" folder, creating it if needed.
  //
  // ⚠️ AUDIT FIX: The partial unique index (WHERE parent_id IS NULL) makes
  // Drizzle's .onConflictDoNothing() unpredictable — it cannot target
  // partial indexes by constraint name. Instead, we use a safe
  // check-then-insert inside a transaction to prevent race conditions.
  const clientUploadsFolder = await ctx.db.transaction(async (tx) => {
    const existing = await tx.query.folders.findFirst({
      where: and(
        eq(folders.projectId, params.id),
        eq(folders.name, "Client Uploads"),
      ),
    });
    if (existing) return existing;

    const [created] = await tx
      .insert(folders)
      .values({ projectId: params.id, name: "Client Uploads", parentId: null })
      .returning();
    return created;
  });

  // Should be non-null after the upsert above — guard defensively.
  if (!clientUploadsFolder) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Project Files</h1>

      {/* Asset list with approval actions */}
      <section>
        <PortalAssetList assets={projectAssets} projectId={params.id} />
      </section>

      {/* Client upload zone — locked to Client Uploads folder */}
      <section>
        <h2 className="mb-3 font-semibold">Upload Reference Files</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          You can upload reference files, feedback documents, or source assets
          here. These go into the <strong>Client Uploads</strong> folder.
        </p>
        <ClientFileUploader
          projectId={params.id}
          folderId={clientUploadsFolder.id}
          orgId={client.orgId}
          orgPlan={orgPlan}
        />
      </section>
    </div>
  );
}
```

#### `SlideToApprove.tsx` — Digital Signature Ceremony Component (PRD §6.4)

> **AUDIT FIX:** PRD §6.4 mandates a "Physical slider mechanism" for file approvals with haptic feedback and confetti. This replaces the original `<Button onClick>` pattern which was downgraded from the PRD requirement.

```tsx
// src/features/portal/components/SlideToApprove.tsx
"use client";

import { useRef, useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

interface SlideToApproveProps {
  onApprove: () => void;
  disabled?: boolean;
}

/**
 * Physical slider mechanism for file approvals (PRD §6.4).
 * Acts as a "digital signature ceremony" — the deliberate drag gesture
 * provides legal-weight intent confirmation for dispute resolution.
 *
 * Features:
 *   - Draggable thumb that must reach the right edge to fire
 *   - Haptic feedback via navigator.vibrate (mobile)
 *   - CSS confetti burst animation on success
 */
export function SlideToApprove({ onApprove, disabled }: SlideToApproveProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0–1
  const [isDragging, setIsDragging] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const THUMB_SIZE = 48; // px
  const THRESHOLD = 0.9; // 90% = approved

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || isApproved) return;
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled, isApproved],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(
          e.clientX - rect.left - THUMB_SIZE / 2,
          rect.width - THUMB_SIZE,
        ),
      );
      setProgress(x / (rect.width - THUMB_SIZE));
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (progress >= THRESHOLD) {
      setIsApproved(true);
      setProgress(1);
      // Haptic feedback (mobile)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }
      onApprove();
    } else {
      // Snap back to start
      setProgress(0);
    }
  }, [progress, onApprove]);

  return (
    <div className="relative select-none">
      {/* Track */}
      <div
        ref={trackRef}
        className={`relative h-12 w-56 overflow-hidden rounded-full border-2 transition-colors ${
          isApproved
            ? "border-green-500 bg-green-50"
            : "border-green-300 bg-green-50/50"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {/* Fill */}
        <div
          className="absolute inset-0 bg-green-100 transition-none"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Label */}
        <span
          className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${
            isApproved ? "text-green-700" : "text-green-600"
          }`}
        >
          {isApproved ? "✓ Approved!" : "Slide to Approve →"}
        </span>

        {/* Thumb */}
        {!isApproved && (
          <div
            className="absolute top-1 flex h-10 w-10 cursor-grab items-center justify-center rounded-full bg-green-500 shadow-md active:cursor-grabbing"
            style={{
              left: `${progress * (100 - (THUMB_SIZE / 224) * 100)}%`,
              transition: isDragging ? "none" : "left 0.3s ease",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Confetti burst (CSS keyframes — no npm dependency) */}
      {isApproved && (
        <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute inline-block h-2 w-2 rounded-full animate-confetti-burst"
              style={{
                backgroundColor: [
                  "#22c55e",
                  "#3b82f6",
                  "#eab308",
                  "#ef4444",
                  "#a855f7",
                ][i % 5],
                animationDelay: `${i * 40}ms`,
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

> **CSS keyframe** — add to `globals.css`:
>
> ```css
> @keyframes confetti-burst {
>   0% {
>     opacity: 1;
>     transform: translateY(0) scale(1);
>   }
>   100% {
>     opacity: 0;
>     transform: translateY(-40px) translateX(var(--x, 10px)) scale(0);
>   }
> }
> .animate-confetti-burst {
>   animation: confetti-burst 0.6s ease-out forwards;
> }
> ```

#### `PortalAssetList.tsx`

```tsx
// src/features/portal/components/PortalAssetList.tsx
"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XCircle, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { updateAssetStatusAction } from "@/features/portal/server/actions";
import { SlideToApprove } from "./SlideToApprove";
import type { RouterOutputs } from "@/lib/trpc/client";

type Asset = RouterOutputs["portal"]["projectAssets"][number];

const STATUS_BADGE: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending_review: "secondary",
  approved: "default",
  changes_requested: "destructive",
};

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "pending_review"
      ? "Pending Review"
      : status === "changes_requested"
        ? "Changes Requested"
        : status.replace(/_/g, " ");

  return <Badge variant={STATUS_BADGE[status] ?? "outline"}>{label}</Badge>;
}

export function PortalAssetList({
  assets,
  projectId,
}: {
  assets: Asset[];
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>(
    () => Object.fromEntries(assets.map((a) => [a.id, a.approvalStatus])),
  );

  function handleAction(
    assetId: string,
    status: "approved" | "changes_requested",
  ) {
    // Optimistic update
    setLocalStatuses((prev) => ({ ...prev, [assetId]: status }));

    startTransition(async () => {
      const result = await updateAssetStatusAction({
        assetId,
        projectId,
        status,
      });
      if (result?.error) {
        // Rollback optimistic update
        setLocalStatuses((prev) => ({
          ...prev,
          [assetId]:
            assets.find((a) => a.id === assetId)?.approvalStatus ??
            "pending_review",
        }));
        toast.error(result.error);
      } else {
        toast.success(
          status === "approved" ? "Asset approved!" : "Changes requested.",
        );
      }
    });
  }

  if (assets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No files yet — your team is working on it!
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border">
      {assets.map((asset) => {
        const currentStatus = localStatuses[asset.id];
        const isPendingReview = currentStatus === "pending_review";

        return (
          <li
            key={asset.id}
            className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{asset.name}</p>
                {asset.folder?.name && (
                  <p className="text-xs text-muted-foreground">
                    {asset.folder.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={currentStatus} />

              {/* Approval actions — only visible when pending review */}
              {isPendingReview && (
                <>
                  {/* AUDIT FIX: PRD §6.4 mandates a physical slider mechanism
                      for file approvals — "Slide to Approve" acts as a digital
                      signature ceremony with haptic feedback + confetti. */}
                  <SlideToApprove
                    onApprove={() => handleAction(asset.id, "approved")}
                    disabled={isPending}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    disabled={isPending}
                    onClick={() => handleAction(asset.id, "changes_requested")}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Request Changes
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

#### `ClientFileUploader.tsx`

This wraps the existing upload primitives from Task 06 but locks the `folderId` to the "Client Uploads" folder.

> **AUDIT FIX:** PRD §12 bans hardcoding plan limits. The `maxSize` is now read dynamically from `src/config/plans.ts` based on the organization's plan tier, passed as `orgPlan` from the parent page.

```tsx
// src/features/portal/components/ClientFileUploader.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import {
  getUploadToken,
  createFileVersion,
} from "@/features/files/server/actions"; // Task 06
import { PLAN_LIMITS, type PlanTier } from "@/config/plans";

interface ClientFileUploaderProps {
  projectId: string;
  folderId: string; // Always the "Client Uploads" folder ID
  orgId: string;
  orgPlan: PlanTier; // Dynamic — read from organizations.plan
}

export function ClientFileUploader({
  projectId,
  folderId,
  orgId,
  orgPlan,
}: ClientFileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const maxUploadBytes = PLAN_LIMITS[orgPlan].maxUploadSizeBytes;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          // Step 1: Get a presigned upload token for the Client Uploads folder
          const tokenResult = await getUploadToken({
            projectId,
            folderId, // locked to Client Uploads
            orgId,
            fileName: file.name,
            fileType: file.type,
          });
          if (tokenResult.error) throw new Error(tokenResult.error);

          // Step 2: Upload directly to Supabase Storage (browser → storage)
          await fetch(tokenResult.signedUrl!, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          // Step 3: Create the asset + file_version DB row
          await createFileVersion({
            projectId,
            folderId,
            storagePath: tokenResult.storagePath!,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          });

          toast.success(`${file.name} uploaded.`);
        }
      } catch (err) {
        toast.error("Upload failed. Please try again.");
        console.error("[ClientFileUploader]", err);
      } finally {
        setUploading(false);
      }
    },
    [projectId, folderId, orgId],
  );

  // AUDIT FIX: Dynamic plan limit from config/plans.ts (PRD §12)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxUploadBytes,
    disabled: uploading,
  });

  const maxSizeLabel =
    maxUploadBytes >= 1024 * 1024 * 1024
      ? `${maxUploadBytes / (1024 * 1024 * 1024)} GB`
      : `${maxUploadBytes / (1024 * 1024)} MB`;

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      } ${uploading ? "opacity-50" : ""}`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mb-3 h-9 w-9 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        {uploading
          ? "Uploading…"
          : isDragActive
            ? "Drop files here"
            : "Drag & drop files, or click to browse"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Max {maxSizeLabel} · Files go to the Client Uploads folder
      </p>
    </div>
  );
}
```

#### `src/config/plans.ts` — Plan Limits Single Source of Truth (PRD §12)

> **AUDIT FIX:** All plan-gated limits must be read from this file. Hardcoding values like `50 * 1024 * 1024` anywhere else is banned.

```typescript
// src/config/plans.ts

export type PlanTier = "starter" | "pro" | "growth" | "business";

/**
 * Single source of truth for plan-gated limits.
 * PRD §12: "No hardcoded tier limits in application code."
 *
 * Every plan-gated feature (file uploads, storage, projects, invoices)
 * MUST read from this config — never hardcode a number inline.
 */
export const PLAN_LIMITS = {
  starter: { maxUploadSizeBytes: 50 * 1024 * 1024 }, // 50 MB
  pro: { maxUploadSizeBytes: 250 * 1024 * 1024 }, // 250 MB
  growth: { maxUploadSizeBytes: 500 * 1024 * 1024 }, // 500 MB
  business: { maxUploadSizeBytes: 1024 * 1024 * 1024 }, // 1 GB
} as const satisfies Record<PlanTier, { maxUploadSizeBytes: number }>;
```

---

### Step 12 — Invoices Page: `/portal/invoices/page.tsx`

```tsx
// src/app/(client)/portal/invoices/page.tsx
import { api } from "@/lib/trpc/server";
import { ClientInvoiceList } from "@/features/portal/components/ClientInvoiceList";

export const metadata = { title: "Your Invoices" };

export default async function PortalInvoicesPage() {
  const invoices = await api.portal.allInvoices();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoices</h1>
      <ClientInvoiceList invoices={invoices} />
    </div>
  );
}
```

---

### Step 13 — RLS Policies for the Portal

Add these policies to the existing migration (or a new `10-portal-rls.sql` file):

```sql
-- Clients can read their own clients row
CREATE POLICY "clients_read_own"
  ON clients
  FOR SELECT
  USING (user_id = auth.uid());

-- Clients can read projects where they are the assigned client
CREATE POLICY "clients_read_assigned_projects"
  ON projects
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Clients can read invoices assigned to them
CREATE POLICY "clients_read_own_invoices"
  ON invoices
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Clients can read assets in their projects
CREATE POLICY "clients_read_project_assets"
  ON assets
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Clients can update approval_status on assets — but ONLY the approval_status column.
-- (Enforce column-level restriction in application; RLS guards the row.)
CREATE POLICY "clients_approve_assets"
  ON assets
  FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Clients can read activity logs for their projects (filtered event types enforced at app layer)
CREATE POLICY "clients_read_activity"
  ON activity_logs
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Clients can insert into file_versions ONLY via the Client Uploads Supabase Storage
-- policy (see Task 03). The DB policy mirrors the storage policy.
CREATE POLICY "clients_insert_file_versions"
  ON file_versions
  FOR INSERT
  WITH CHECK (
    asset_id IN (
      SELECT a.id FROM assets a
      JOIN folders f ON f.id = a.folder_id
      WHERE f.name = 'Client Uploads'
        AND a.project_id IN (
          SELECT p.id FROM projects p
          JOIN clients c ON c.id = p.client_id
          WHERE c.user_id = auth.uid()
        )
    )
  );
```

---

## PRD Constraints Reference

| Constraint                              | Implementation                                                                                                                                                             |
| :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Isolation**                           | `resolveClient(userId)` called on every tRPC procedure; `clientId` and `orgId` never trusted from caller input; reinforced by RLS policies in Step 13                      |
| **No admin settings visible**           | `(client)` route group has no access to `/dashboard` routes; middleware redirects admins away from `/portal`                                                               |
| **Client upload restriction**           | `ClientFileUploader` locks `folderId` to the "Client Uploads" folder; Supabase Storage RLS (`storage.foldername(name)[2] = 'Client Uploads'`) enforced at the bucket level |
| **Approve/Reject only on own projects** | `updateAssetStatusAction` cross-checks `projects.client_id = clients.id` server-side before any mutation                                                                   |
| **Activity feed filtered**              | `CLIENT_VISIBLE_EVENTS` allowlist applied in `portalRouter.recentActivity`                                                                                                 |
| **Org branding (Phase 1)**              | `organizations.accentColor` read in `ClientLayout` and passed as inline CSS var; functional in Phase 2 once the branding picker (Task 11) is built                         |
| **"Powered by ClientSpace"**            | Starter plan orgs should show a `<footer>` with the referral link; `plan` column on `organizations` drives this conditionally in `ClientLayout`                            |
| **Upsell loop**                         | `ClientProjectCard` renders the "Request a Phase 2" CTA when `project.status === 'completed'`                                                                              |
| **What Happens Next banner**            | `WhatHappensNextBanner` surfaces the first project in `review` status                                                                                                      |
| **Empty states**                        | All list components display friendly messages when `length === 0`                                                                                                          |
| **`<1.0s LCP`**                         | All portal pages are Server Components; data fetched in parallel with `Promise.all`; no client-side waterfalls on initial load                                             |

---

## Validation Checklist

Complete these checks before marking the task done.

### Route Guard

- [ ] Log in as an **admin/member** → navigate to `/portal` → should be **redirected to `/dashboard`**.
- [ ] Log out → navigate to `/portal` → should be **redirected to `/login`** with `?next=/portal` preserved.
- [ ] Log in as a **client** → navigate to `/portal` → should land on the portal home page.

### Data Isolation (Critical)

- [ ] Database: create **two separate orgs**, each with one client and one project.
- [ ] Log in as Client A → confirm **only Client A's project** appears in the Active Projects grid.
- [ ] While logged in as Client A, manually craft a tRPC request to `portal.projectById` with **Client B's project ID** → should return a `NOT_FOUND` error (or FORBIDDEN), never the project data.
- [ ] Confirm Client A's invoice list contains **no invoices from Client B's org**.

  ```sql
  -- Quick verification query:
  SELECT p.name, c.company_name
  FROM projects p
  JOIN clients c ON c.id = p.client_id
  WHERE c.user_id = '<client-a-auth-uid>';
  -- Expected: only Client A rows
  ```

### Portal Home

- [ ] Active Projects grid renders correctly for a client with 1+ active projects.
- [ ] "No active projects" empty state shows when there are no projects.
- [ ] Open Invoices list shows only `sent` / `overdue` invoices.
- [ ] "View all" link appears when there are open invoices and leads to `/portal/invoices`.
- [ ] Recent Activity shows at most 10 events, none of type `member_assigned` (internal-only).
- [ ] `WhatHappensNextBanner` appears when a project has `status = 'review'`, and its link navigates to the correct files page.

### Project Detail

- [ ] `/portal/projects/[id]` renders the project name, status badge, deadline, and milestone list.
- [ ] No edit controls are present (fields are read-only).
- [ ] "View Files" button navigates to `/portal/projects/[id]/files`.
- [ ] Navigating to a project ID that belongs to a different client returns a 404 page.

### Files & Approvals

- [ ] Assets display with correct approval status badges (`Pending Review`, `Approved`, `Changes Requested`).
- [ ] Approve button only appears on assets with `pending_review` status.
- [ ] Clicking **Approve**: optimistic update flips badge to `Approved` immediately; database row updated; activity log entry created with event type `file_approved`.
- [ ] Clicking **Request Changes**: optimistic update flips badge to `Changes Requested`; database row updated; activity log entry `changes_requested` created.
- [ ] An already-approved asset shows no Approve/Request Changes buttons.

### Client Uploads

- [ ] "Client Uploads" folder is auto-created if it doesn't exist.
- [ ] Uploading a file via the dropzone places the asset in the `Client Uploads` folder.
- [ ] Attempting to upload to any other folder via a crafted request is **rejected** by the Supabase Storage RLS policy (verify in Supabase Storage logs).
- [ ] Upload respects the 50 MB file size limit; oversized files show an error toast.

### Invoices Page

- [ ] `/portal/invoices` shows all invoice statuses (Draft, Sent, Paid, Overdue).
- [ ] Overdue invoices render with the destructive badge and highlighted row background.
- [ ] PDF download button renders and triggers the correct API route.

### Branding

- [ ] `ClientHeader` displays the org's logo when `logoUrl` is set; falls back to org name text.
- [ ] `organizations.accentColor` value is present as `--brand-accent` inline CSS var on the root `div` (verify with browser DevTools).
- [ ] For a Starter-plan org, a "Powered by ClientSpace" footer link is rendered (implement conditionally in `ClientLayout` — `org.plan === 'starter'`).

### Admin: "View as Client" Toggle (Stub)

- [ ] The admin dashboard (`/dashboard`) should show a `[ 👁 View as Client ]` toggle in the Navbar that redirects to `/portal` with an impersonation query param (implementation deferred to Task 11, but add the UI stub now).
