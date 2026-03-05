# Task 03 — Authentication & RLS Security

> **Phase:** 1 · Foundation
> **Priority:** Critical — secures the database and application
> **Depends on:** `02-database.md`

---

## Objective

Implement the complete Authentication stack using `@supabase/ssr`, configure Next.js Middleware to protect dashboard routes, and apply strict Row Level Security (RLS) policies to the Postgres database to enforce tenant isolation.

---

## Description

We will set up the mechanism that keeps user data private. This involves three layers:

1. **Application Layer:** Supabase helpers (`browser`, `server`, `middleware`) to manage cookies.
2. **Edge Layer:** Next.js Middleware to redirect unauthenticated users away from `/dashboard`.
3. **Database Layer:** SQL Policies that physically prevent a user from selecting or updating data that doesn't belong to their Organization.

> **PRD §4 — Key Constraint:** "A Client can never see another client's projects, files, or invoices. Members only see projects they are explicitly assigned to."

---

## Tech Stack

- `@supabase/ssr`: Cookie-based auth for Next.js 14+ App Router.
- `postgres`: RLS Policies (SQL).

---

## Step-by-Step Instructions

### Step 1 — Create Supabase Utility Clients

We need three separate clients for different contexts (Client Components, Server Components, Middleware).

**1. Browser Client** (`src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

**2. Server Client** (`src/lib/supabase/server.ts`)

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
```

**3. Middleware Client** (`src/lib/supabase/middleware.ts`)
_This is critical for refreshing tokens._

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Protect Dashboard Routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Protect Auth Routes (Redirect to Dashboard if already logged in)
  if (
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup")) &&
    user
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
```

### Step 2 — Configure Root Middleware

Create `src/middleware.ts` in the project root to activate the logic above and enforce Edge Rate Limiting (PRD §12).

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis for edge rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// PRD §12: 20 requests per minute for auth endpoints
const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
});

// PRD §12: 100 requests per minute per authenticated user
const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

  // 1. Rate Limit Auth Routes (Login, Signup, Verify)
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup")
  ) {
    const { success } = await authRateLimit.limit(`auth_${ip}`);
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  // 2. Process Session and Refresh Cookies
  const response = await updateSession(request);

  // 3. Extract User to Rate Limit Authenticated Requests
  const authHeader = response.headers.get("x-middleware-request-user-role"); // Or derive from cookie
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const { success } = await apiRateLimit.limit(`user_${ip}`); // In production, limit by user.id
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - handled separately or let through)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

```sql
-- ================================================================
-- 1. Enable RLS on ALL tables (PRD §12: "RLS per org on every table")
-- ================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
-- Phase 2 stub tables (RLS enabled now to prevent future oversights)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE csat_responses ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 2. Core Table Policies
-- ================================================================

-- USERS: Users can read their own profile
CREATE POLICY "Users can see own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- USERS: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- ORG MEMBERSHIPS: Users can see their own memberships
CREATE POLICY "Users can view own memberships"
ON org_memberships FOR SELECT
USING (auth.uid() = user_id);

-- ORGANIZATIONS: Users can view orgs they belong to
CREATE POLICY "Members can view organization"
ON organizations FOR SELECT
USING (
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = organizations.id
AND org_memberships.user_id = auth.uid()
)
);

-- ORGANIZATIONS: Only owner can update org settings
CREATE POLICY "Owner can update organization"
ON organizations FOR UPDATE
USING (owner_id = auth.uid());

-- ================================================================
-- 3. Project Isolation & RBAC Policies (INLINED OPTIMIZATION)
-- ================================================================

-- PROJECTS: View Policy (Role-Based Isolation)
CREATE POLICY "Role-based project viewing"
ON projects FOR SELECT
USING (
-- 1. Owner/Admin: Can see all projects in the org
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = projects.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin')
)
OR
-- 2. Member: Can only see projects they are assigned to
(
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = projects.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role = 'member'
)
AND
EXISTS (
SELECT 1 FROM project_members
WHERE project_members.project_id = projects.id
AND project_members.user_id = auth.uid()
)
)
OR
-- 3. Client: Can only see projects mapped to their client ID
(
EXISTS (
SELECT 1 FROM clients
WHERE clients.id = projects.client_id
AND clients.user_id = auth.uid()
)
)
);

-- PROJECTS: Owners/Admins can create
CREATE POLICY "Owners and Admins can create projects"
ON projects FOR INSERT
WITH CHECK (
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = projects.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin')
)
);

-- PROJECTS: Owners/Admins can update any project; Members only their assigned projects
CREATE POLICY "Team can update projects"
ON projects FOR UPDATE
USING (
  -- 1. Owner/Admin: Can update any project in the org
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = projects.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin')
  )
  OR
  -- 2. Member: Can only update projects they are assigned to
  (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = projects.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.role = 'member'
    )
    AND
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  )
);

-- PROJECT MEMBERS: Viewable by anyone with Project Access
-- Note: Reuses the exact same isolation logic via recursive project check.
CREATE POLICY "Project access dictates member viewing"
ON project_members FOR SELECT
USING (
EXISTS (
SELECT 1 FROM projects
WHERE projects.id = project_members.project_id
)
);

CREATE POLICY "Owners and Admins manage project members"
ON project_members FOR ALL
USING (
EXISTS (
SELECT 1 FROM projects
JOIN org_memberships ON org_memberships.org_id = projects.org_id
WHERE projects.id = project_members.project_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin')
)
);

-- ================================================================
-- 4. Client & Invoice Policies
-- ================================================================

-- CLIENTS: Team sees all in org, Client sees themselves
CREATE POLICY "Client visibility"
ON clients FOR SELECT
USING (
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = clients.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin', 'member')
)
OR
(user_id = auth.uid())
);

CREATE POLICY "Team manages clients"
ON clients FOR ALL
USING (
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = clients.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin', 'member')
)
);

-- INVOICES: Team sees all in org, Client sees their own
CREATE POLICY "Invoice visibility"
ON invoices FOR SELECT
USING (
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = invoices.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin', 'member')
)
OR
EXISTS (
SELECT 1 FROM clients
WHERE clients.id = invoices.client_id
AND clients.user_id = auth.uid()
)
);

CREATE POLICY "Team manages invoices"
ON invoices FOR ALL
USING (
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = invoices.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin', 'member')
)
);

CREATE POLICY "Invoice line items follow invoices"
ON invoice_line_items FOR SELECT
USING (
EXISTS (
SELECT 1 FROM invoices
WHERE invoices.id = invoice_line_items.invoice_id
)
);

CREATE POLICY "Team manages invoice line items"
ON invoice_line_items FOR ALL
USING (
EXISTS (
SELECT 1 FROM invoices
JOIN org_memberships ON org_memberships.org_id = invoices.org_id
WHERE invoices.id = invoice_line_items.invoice_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin', 'member')
)
);

-- ================================================================
-- 5. Asset & File Policies
-- ================================================================

-- ASSETS: Inherit project visibility
CREATE POLICY "Project access dictates asset viewing"
ON assets FOR SELECT
USING (
EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id)
);

-- ASSETS: Team and Clients can upload (Client Upload restriction enforced below & in Storage)
CREATE POLICY "Project access dictates asset creating"
ON assets FOR INSERT
WITH CHECK (
EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id)
);

CREATE POLICY "Project access dictates asset updating"
ON assets FOR UPDATE
USING (
EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id)
);

CREATE POLICY "File versions follow assets"
ON file_versions FOR SELECT
USING (
EXISTS (SELECT 1 FROM assets WHERE assets.id = file_versions.asset_id)
);

CREATE POLICY "File versions insertion"
ON file_versions FOR INSERT
WITH CHECK (
EXISTS (SELECT 1 FROM assets WHERE assets.id = file_versions.asset_id)
);

CREATE POLICY "Folders follow projects"
ON folders FOR ALL
USING (
EXISTS (SELECT 1 FROM projects WHERE projects.id = folders.project_id)
);

CREATE POLICY "Milestones follow projects"
ON milestones FOR ALL
USING (
EXISTS (SELECT 1 FROM projects WHERE projects.id = milestones.project_id)
);

-- ================================================================
-- 6. Comments & Activity Policies
-- ================================================================

-- COMMENTS: Inherit project visibility
CREATE POLICY "Project access dictates comment viewing"
ON comments FOR SELECT
USING (
EXISTS (SELECT 1 FROM projects WHERE projects.id = comments.project_id)
);

CREATE POLICY "Project access dictates comment creating"
ON comments FOR INSERT
WITH CHECK (
EXISTS (SELECT 1 FROM projects WHERE projects.id = comments.project_id)
);

-- PRD §6.6: "Comments are NOT deletable by the author"
-- No DELETE policy on comments — enforced at DB level

-- ACTIVITY LOGS: Inherit project/org visibility
CREATE POLICY "Activity log visibility"
ON activity_logs FOR SELECT
USING (
(project_id IS NOT NULL AND EXISTS (SELECT 1 FROM projects WHERE projects.id = activity_logs.project_id))
OR
(project_id IS NULL AND EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = activity_logs.org_id
AND org_memberships.user_id = auth.uid()
))
);

CREATE POLICY "System generates activity logs"
ON activity_logs FOR INSERT
WITH CHECK (true); -- Usually restricted to server routes executing as system

-- ================================================================
-- 7. Notification & Invitation Policies
-- ================================================================

-- NOTIFICATIONS: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- INVITATIONS: Team can view
CREATE POLICY "Team can view invitations"
ON invitations FOR SELECT
USING (
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = invitations.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin', 'member')
)
);

CREATE POLICY "Team can create invitations"
ON invitations FOR INSERT
WITH CHECK (
EXISTS (
SELECT 1 FROM org_memberships
WHERE org_memberships.org_id = invitations.org_id
AND org_memberships.user_id = auth.uid()
AND org_memberships.role IN ('owner', 'admin', 'member')
)
);

-- SHARE LINKS: Creator can view their own share links
CREATE POLICY "Users can view own share links"
ON share_links FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create share links"
ON share_links FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Note: Guest token resolution (PRD §11) is handled via a
-- privileged server-side route that bypasses RLS entirely.

-- ================================================================
-- 8. Phase 2 Stub Table Policies
-- ================================================================

CREATE POLICY "Team can view contracts"
ON contracts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = contracts.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "Project access dictates csat responses"
ON csat_responses FOR SELECT
USING (
EXISTS (SELECT 1 FROM projects WHERE projects.id = csat_responses.project_id)
);

-- ================================================================
-- 9. Storage Policies (Supabase Storage)
-- ================================================================
-- IMPORTANT: storage.foldername(name) returns directory segments only
-- (the filename is stripped). For a path like:
--
--   {org_id}/{project_id}/Client Uploads/file.png
--    [1]       [2]          [3]
--
-- [1] = org_id, [2] = project_id, [3] = subfolder name.
--
-- Convention: Folder structure is `{org_id}/{project_id}/...`

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT DO NOTHING;

-- Allow Read: Anyone with access to the project
CREATE POLICY "Project members can read files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[2]::uuid
  )
);

-- Allow Upload: Only Owners/Admins/Members (NOT Clients)
CREATE POLICY "Team can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = (storage.foldername(name))[1]::uuid
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

-- ================================================================
-- 10. THE "CLIENT UPLOADS" EXCEPTION (PRD §6.4 & Task 03 Audit)
-- ================================================================
-- "Clients CAN upload reference files strictly to a dedicated
-- 'Client Uploads' sub-folder"
-- Path format: {org_id}/{project_id}/Client Uploads/filename.ext
-- storage.foldername returns: [org_id, project_id, Client Uploads]
-- Therefore the subfolder check is at index [3].
-- NOTE: The PRD uses [2] under an implied 2-segment folder layout.
-- Our actual convention is 3-segment, so [3] is correct here.

CREATE POLICY "Clients can upload to Client Uploads folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[3] = 'Client Uploads'
  AND EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = (storage.foldername(name))[1]::uuid
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role = 'client'
  )
);

```

### Step 4 — Drizzle Secure Factory Pattern

This implements the required safe execution pattern from PRD §10.2. Direct Drizzle instance use is banned; all server actions must instantiate Drizzle via this factory.

Create `src/db/createDrizzleClient.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Shared connection pool — disable prefetch for Supabase Transaction Pooler
const pool = postgres(connectionString, { prepare: false });

type SessionContext = {
  userId: string;
  orgId: string;
};

/**
 * PRD §10.2: Secure Factory Pattern.
 * All DB queries outside of seed/migration scripts MUST pass through this factory.
 * It enforces tenant isolation at the query-execution layer by setting
 * `app.current_org_id` as a Postgres session variable.
 *
 * Usage (Server Action / tRPC procedure):
 *   const db = await createDrizzleClient({ userId: session.userId, orgId: session.orgId });
 *   const projects = await db.select().from(schema.projects);
 *
 * Phase 1: Sets session variable + relies on inline EXISTS RLS queries.
 * Phase 2: RLS policies will read `current_setting('app.current_org_id')` directly
 *          for O(1) tenant checks, replacing the org_memberships lookup.
 */
export async function createDrizzleClient(ctx: SessionContext) {
  const db = drizzle(pool, { schema });

  // Set the org context for this session.
  // `SET LOCAL` scopes the variable to the current transaction only,
  // preventing cross-request leakage in pooled connections.
  await db.execute(
    sql`SELECT set_config('app.current_org_id', ${ctx.orgId}, true)`,
  );
  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`,
  );

  return db;
}
```

> **Why `set_config(..., true)` instead of `SET LOCAL`?** The third parameter `true` makes the setting local to the current transaction, identical to `SET LOCAL` but callable as a regular function from Drizzle's `execute`. This ensures the org context is scoped per-request and cannot leak across pooled connections.

### Step 4 — Auth Callback Route

Create `src/app/api/auth/callback/route.ts` to handle the email verification link redirect.

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

### Step 5 — Auth Trigger: Sync `auth.users` → `public.users`

When a new user signs up via Supabase Auth, a row must be auto-created in the public `users` table (PRD §11: "This table mirrors `auth.users` as a public profile"). Run this in the **Supabase SQL Editor**:

```sql
-- Trigger: Auto-create public.users row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
```

> **Why this matters:** Without this trigger, the `users` table stays empty even though Supabase Auth has the user. Every RLS policy depends on `org_memberships` which joins to `users.id`. If the user row doesn't exist, RLS blocks everything.

---

## File Outputs

| File                                 | Purpose                                           |
| ------------------------------------ | ------------------------------------------------- |
| `src/lib/supabase/client.ts`         | Browser Client (Client Components)                |
| `src/lib/supabase/server.ts`         | Server Client (Server Components, Route Handlers) |
| `src/lib/supabase/middleware.ts`     | Middleware Client (token refresh + route guard)   |
| `src/middleware.ts`                  | Root middleware configuration + Upstash ratelimit |
| `src/app/api/auth/callback/route.ts` | Auth callback for email verification              |
| `src/db/createDrizzleClient.ts`      | Secure DB connection factory (PRD §10.2)          |
| **Supabase SQL Editor**              | RLS policies + `handle_new_user` trigger          |

---

## Phase 2 Upgrade Path — Custom Claims (PRD §11)

> **Current (Phase 1):** Every RLS check does a `SELECT` on `org_memberships` to verify access. This is O(N) per query.
>
> **Phase 2 Upgrade:** Store `org_id` and `org_role` in the JWT's `app_metadata` via Custom Claims. Replace `is_org_member()` with the O(1) function:
>
> ```sql
> CREATE OR REPLACE FUNCTION get_current_org_role()
> RETURNS text AS $$
>   SELECT (auth.jwt() -> 'app_metadata' ->> 'org_role')::text;
> $$ LANGUAGE sql STABLE;
> ```
>
> This eliminates the `org_memberships` lookup on every query. The claims are refreshed when users switch organizations.

---

## Validation Checklist

- [ ] **Middleware Rate Limit:** Test spamming `/login` and verify a `429 Too Many Requests` is returned (using Upstash).
- [ ] **Middleware Check:** Visit `http://localhost:3000/dashboard`. You should be instantly redirected to `/login`.
- [ ] **Reverse Auth Check:** Log in, then visit `/login`. You should be redirected to `/dashboard`.
- [ ] **SQL Execution:** Run the full SQL block in Supabase SQL Editor. Ensure zero syntax errors.
- [ ] **RBAC Isolation:** Test client isolation. Clients must only see projects mapped to their `client_id`, and members must only see projects mapped in `project_members`.
- [ ] **RLS Verification:** Open Supabase Dashboard → Table Editor → Every table shows the 🔒 RLS badge.
- [ ] **Bucket Check:** Verify `project-files` bucket exists in Supabase Storage.
- [ ] **Drizzle Factory:** Ensure `src/db/createDrizzleClient.ts` compiles and is used in lieu of bare db instantiation.
- [ ] **Auth Trigger Check:** Sign up a test user. Verify a row appears in `public.users` with matching `id`.
- [ ] **Compile:** Run `bun run build`. Ensure `cookies()` usage in `server.ts` doesn't throw errors.

---

## References

- PRD §4 — User Roles & Permissions (4-tier RBAC matrix)
- PRD §6.1 — Authentication (session cookies, magic links, rate limiting)
- PRD §6.4 — File Sharing (Client Uploads exception)
- PRD §10.2 — Architectural Rules (Drizzle RLS Factory)
- PRD §11 — Proposed RLS Policy (Custom Claims upgrade path)
- PRD §12 — Security (tenant isolation, signed URLs)
