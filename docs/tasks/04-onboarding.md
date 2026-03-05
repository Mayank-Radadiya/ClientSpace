# Task 04 — Onboarding: Organization Creation

> **Phase:** 1 · Foundation
> **Priority:** Critical — blocks dashboard access for new users
> **Depends on:** `03-auth-rls.md`

---

## Objective

Implement the mandatory "Day 1" onboarding flow: after signup and email verification, force the user to create their first Organization before they can access any dashboard route. This is Step 3 of the PRD §5 Onboarding Flow.

---

## Description

A newly signed-up user who has verified their email has no Organization yet. Without one, they cannot see projects, clients, invoices — nothing. This task builds the gate that intercepts these users and channels them through a single-page form to create their first org.

**The flow:**

```text
Sign Up → Verify Email → /onboarding (THIS TASK) → /onboarding/add-client (Task 08) → /dashboard
```

Four things happen when the form is submitted:

1. An `organizations` row is INSERT'd with `plan: 'starter'` and `next_invoice_number: 1001`.
2. An `org_memberships` row is INSERT'd with `role: 'owner'`.
3. The org `type` (Freelancer/Agency) is persisted to `auth.users.app_metadata` for guided setup personalization.
4. The user is redirected to `/onboarding/add-client` — the next step of the guided setup (PRD §5/§13.1).

> **PRD §5:** "Every paying user creates at least one organization."
> **PRD §13.1:** "Create organization (name, type: Freelancer or Agency)"

---

## Tech Stack

- `react-hook-form` + `@hookform/resolvers` — Client-side form management
- `zod` — Shared schema validation (client + server)
- Next.js **Server Actions** — Mutation (PRD §10.2: "Server Actions strictly reserved for RSC form mutations")
- `drizzle-orm` — Transactional INSERT
- `shadcn/ui` — Form components (`Input`, `Select`, `Button`, `Card`, `Label`)

---

## Step-by-Step Instructions

### Step 1 — Update Middleware: Onboarding Guard

The middleware from Task 03 must be extended to redirect authenticated users **without an organization** to `/onboarding`. Modify `src/lib/supabase/middleware.ts`:

```typescript
// Add this AFTER the existing dashboard protection block in updateSession()

// 3. Onboarding Guard: Redirect users without an org to /onboarding
if (
  user &&
  request.nextUrl.pathname.startsWith("/dashboard") &&
  !request.nextUrl.pathname.startsWith("/onboarding")
) {
  // Check if user has at least one org membership
  // Note: We use a lightweight cookie flag set during org creation
  // to avoid a DB query on every request. The flag is set in the
  // createOrganizationAction server action.
  const hasOrg = request.cookies.get("has_org")?.value === "true";

  if (!hasOrg) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
}

// 4. Prevent users WITH an org from hitting /onboarding again
if (user && request.nextUrl.pathname === "/onboarding") {
  const hasOrg = request.cookies.get("has_org")?.value === "true";
  if (hasOrg) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
```

> **Why a cookie flag?** Querying `org_memberships` on every middleware invocation adds latency to every request. A `has_org` cookie set once during org creation is O(1). The cookie is HttpOnly and server-set — not spoofable from the client.

---

### Step 2 — Zod Validation Schema

Create `src/features/onboarding/schemas.ts`:

```typescript
import { z } from "zod";

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters")
    .trim(),

  type: z.enum(["freelancer", "agency"], {
    required_error: "Please select your organization type",
  }),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
```

> **PRD §13.1:** The onboarding asks for "name" and "type: Freelancer or Agency". The `type` field is not stored in the DB schema but is persisted to the user's `app_metadata` via `supabase.auth.updateUser()` to personalize the guided setup copy in subsequent steps.

---

### Step 3 — Slug Generation Utility

Create `src/features/onboarding/utils/slug.ts`:

```typescript
/**
 * Generate a URL-safe slug from an organization name.
 * Appends a short random suffix to guarantee uniqueness.
 *
 * Example: "Acme Design Studio" → "acme-design-studio-x7k2"
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces & hyphens)
    .replace(/[\s_]+/g, "-") // Collapse spaces/underscores to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}
```

---

### Step 4 — Server Action

Create `src/features/onboarding/server/actions.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { organizations, orgMemberships } from "@/db/schema";
import { createOrgSchema, type CreateOrgInput } from "../schemas";
import { generateSlug } from "../utils/slug";

export type CreateOrgState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof CreateOrgInput, string[]>>;
};

export async function createOrganizationAction(
  _prevState: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create an organization." };
  }

  // 2. Parse & validate
  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
  };

  const parsed = createOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as CreateOrgState["fieldErrors"],
    };
  }

  const { name, type } = parsed.data;
  const slug = generateSlug(name);

  // 3. Transactional insert: Organization + Owner membership
  // PRD §5: "Every paying user creates at least one organization."
  // PRD §9: Default plan is 'starter', next_invoice_number starts at 1001.
  // Note: We use orgId 'SYSTEM' as a sentinel because no org exists yet.
  // This is the ONLY legitimate use of a sentinel orgId — the INSERTs target
  // new rows and do not query RLS-gated data.
  try {
    const db = await createDrizzleClient({ userId: user.id, orgId: "SYSTEM" });

    await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name,
          slug,
          ownerId: user.id,
          plan: "starter",
          nextInvoiceNumber: 1001,
        })
        .returning({ id: organizations.id });

      await tx.insert(orgMemberships).values({
        userId: user.id,
        orgId: org.id,
        role: "owner",
      });
    });
  } catch (err) {
    // Handle unique constraint violation on slug (random suffix collision)
    if (
      err instanceof Error &&
      "code" in err &&
      (err as any).code === "23505"
    ) {
      return { error: "Name conflict — please try again." };
    }
    console.error("Failed to create organization:", err);
    return { error: "Something went wrong. Please try again." };
  }

  // 4. Persist org type in user metadata for guided setup personalization
  await supabase.auth.updateUser({
    data: { org_type: type },
  });

  // 5. Set the middleware cookie flag
  const cookieStore = await cookies();
  cookieStore.set("has_org", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days — matches Supabase session lifecycle
  });

  // 6. Redirect to guided setup — next step: add first client
  // PRD §5/§13.1: Org creation is Step 3. Step 4 is "Add your first client".
  // The /onboarding/add-client page will be implemented in Task 08.
  redirect("/onboarding/add-client");
}
```

**Key constraints enforced:**

| Constraint         | Implementation                                          |
| ------------------ | ------------------------------------------------------- |
| Factory pattern    | `createDrizzleClient({ userId, orgId: 'SYSTEM' })`      |
| Single transaction | `db.transaction()` wraps both INSERTs                   |
| Owner role         | `role: 'owner'` hardcoded — not user-controllable       |
| Default plan       | `plan: 'starter'` per PRD §9                            |
| Invoice number     | `nextInvoiceNumber: 1001` per PRD §6.5                  |
| Unique slug        | Random suffix + 23505 collision catch                   |
| Auth check         | `supabase.auth.getUser()` before any mutation           |
| Type persisted     | `supabase.auth.updateUser({ data: { org_type } })`      |
| Guided onboarding  | Redirects to `/onboarding/add-client`, not `/dashboard` |

---

### Step 5 — Onboarding Form Component

Create `src/features/onboarding/components/CreateOrgForm.tsx`:

```tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  createOrganizationAction,
  type CreateOrgState,
} from "../server/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: CreateOrgState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating..." : "Create workspace"}
    </Button>
  );
}

export function CreateOrgForm() {
  const [state, formAction] = useFormState(
    createOrganizationAction,
    initialState,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <CardDescription>
          Set up your organization to start managing clients and projects.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Global Error */}
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Org Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Acme Design Studio"
              required
              minLength={2}
              maxLength={100}
            />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Org Type */}
          <div className="space-y-2">
            <Label htmlFor="type">I am a...</Label>
            <Select name="type" required>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="agency">Agency / Team</SelectItem>
              </SelectContent>
            </Select>
            {state.fieldErrors?.type && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.type[0]}
              </p>
            )}
          </div>

          {/* Submit */}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
```

> **Note on `useFormState` vs `useActionState`:** We use `useFormState` from `react-dom` for Next.js 14 compatibility. If you upgrade to Next.js 15+ / React 19, switch to `useActionState` from `react` which adds a built-in `isPending` third return value. For now, we extract pending state via the separate `useFormStatus` hook inside a child `<SubmitButton>` component.

---

### Step 6 — Onboarding Page

Create `src/app/(auth)/onboarding/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CreateOrgForm } from "@/features/onboarding/components/CreateOrgForm";

export const metadata = {
  title: "Create your workspace — ClientSpace",
};

export default async function OnboardingPage() {
  // 1. Require authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. If user already has an org, redirect to sync route
  // ⚠️ CRITICAL: Do NOT redirect directly to /dashboard here.
  // The middleware checks a `has_org` cookie. If the cookie is missing
  // (cleared cache, new browser), middleware redirects back to /onboarding,
  // creating an infinite loop: /onboarding → /dashboard → /onboarding → ...
  // Instead, redirect to a Route Handler that can SET the cookie, then forward.
  // Note: orgId 'SYSTEM' sentinel — user may not have an org yet.
  const db = await createDrizzleClient({ userId: user.id, orgId: "SYSTEM" });
  const existingMembership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id),
  });

  if (existingMembership) {
    redirect("/api/auth/sync-org");
  }

  // 3. Render the form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <CreateOrgForm />
    </div>
  );
}
```

**Page logic:**

| Check              | Result                          |
| ------------------ | ------------------------------- |
| Not logged in      | Redirect → `/login`             |
| Already has an org | Redirect → `/api/auth/sync-org` |
| No org yet         | Render `CreateOrgForm`          |

> **⚠️ Why `/api/auth/sync-org` instead of `/dashboard`?** Server Component pages cannot set cookies before redirecting. If the `has_org` cookie is missing (cleared cache, new browser, expired), redirecting directly to `/dashboard` triggers middleware → `/onboarding` → DB check → `/dashboard` → middleware → infinite loop. The sync route repairs the cookie first.

---

### Step 6.5 — Organization Sync Route (Cookie Repair)

Create `src/app/api/auth/sync-org/route.ts`. This route handles the edge case where a user has an organization in the database but is missing the `has_org` middleware cookie.

```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL),
    );
  }

  // Check DB for org membership
  // Note: orgId 'SYSTEM' sentinel — we're checking if any membership exists.
  const db = await createDrizzleClient({ userId: user.id, orgId: "SYSTEM" });
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id),
  });

  if (membership) {
    // Repair the cookie
    const cookieStore = await cookies();
    cookieStore.set("has_org", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days — matches Supabase session lifecycle
    });
    return NextResponse.redirect(
      new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL),
    );
  }

  // No org found — send back to onboarding
  return NextResponse.redirect(
    new URL("/onboarding", process.env.NEXT_PUBLIC_APP_URL),
  );
}
```

**How this breaks the infinite loop:**

```text
// BEFORE (broken):
Middleware (no cookie) → /onboarding → DB has org → /dashboard → Middleware (no cookie) → 💥 LOOP

// AFTER (fixed):
Middleware (no cookie) → /onboarding → DB has org → /api/auth/sync-org → SET cookie → /dashboard → Middleware (has cookie) → ✅ PASS
```

---

### Step 7 — Set Cookie on Login (Existing Users)

For users who already have an organization and log in again, the `has_org` cookie must be set during their login flow. Add this logic to the auth callback route created in Task 03.

Update `src/app/api/auth/callback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has an org and set the cookie flag
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Note: orgId 'SYSTEM' sentinel — checking membership existence.
        const db = await createDrizzleClient({
          userId: user.id,
          orgId: "SYSTEM",
        });
        const membership = await db
          .select({ orgId: orgMemberships.orgId })
          .from(orgMemberships)
          .where(eq(orgMemberships.userId, user.id))
          .limit(1);

        if (membership.length > 0) {
          const cookieStore = await cookies();
          cookieStore.set("has_org", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days — matches Supabase session lifecycle
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

---

## File Outputs

| File                                                   | Purpose                                               |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `src/features/onboarding/schemas.ts`                   | Zod validation schema (`createOrgSchema`)             |
| `src/features/onboarding/utils/slug.ts`                | Slug generation utility                               |
| `src/features/onboarding/server/actions.ts`            | Server Action (transactional org + membership INSERT) |
| `src/features/onboarding/components/CreateOrgForm.tsx` | Client Component (form UI with `useFormState`)        |
| `src/app/(auth)/onboarding/page.tsx`                   | Page (auth gate + org check + sync-org redirect)      |
| `src/app/api/auth/sync-org/route.ts`                   | **NEW** — Cookie repair route (breaks redirect loop)  |
| `src/lib/supabase/middleware.ts`                       | **Modified** — onboarding redirect guard              |
| `src/app/api/auth/callback/route.ts`                   | **Modified** — set `has_org` cookie on login          |

---

## Validation Checklist

- [ ] **New user blocked:** Sign up a fresh user. After email verification, visit `/dashboard`. You should be redirected to `/onboarding`.
- [ ] **Form renders:** The onboarding page shows a card with "Organization name" input and "I am a..." select.
- [ ] **Validation works:** Submit the form with an empty name. A field error should appear. Submit with no type selected. A field error should appear.
- [ ] **Submission works:** Fill in a valid name and type. Click "Create workspace". You should be redirected to `/onboarding/add-client` (guided setup, not `/dashboard`).
- [ ] **DB check (org):** In Supabase Dashboard → Table Editor → `organizations`. Verify a new row exists with `plan: starter`, `next_invoice_number: 1001`, and `owner_id` matching the user.
- [ ] **DB check (membership):** In `org_memberships`, verify a row exists with `role: owner` for this user+org pair.
- [ ] **Org type persisted:** In Supabase Dashboard → Authentication → Users → click user → verify `app_metadata` contains `{ "org_type": "freelancer" }` (or `"agency"`).
- [ ] **Cookie check:** In DevTools → Application → Cookies, verify `has_org=true` is set with `Max-Age` ≈ 30 days (2592000 seconds).
- [ ] **Factory pattern:** Verify no `import { db } from "@/db"` exists in any file created by this task. All DB access uses `createDrizzleClient`.
- [ ] **Slug collision:** (Optional) Temporarily hardcode `generateSlug` to return a fixed slug. Submit two orgs. The second should return "Name conflict — please try again." instead of a server error.
- [ ] **Re-entry blocked:** Visit `/onboarding` again after creating an org. You should be redirected to `/dashboard`.
- [ ] **Cookie desync test:** After creating an org, delete the `has_org` cookie from DevTools. Visit `/dashboard`. You should briefly hit `/onboarding` → `/api/auth/sync-org` → cookie repaired → land on `/dashboard` (no infinite loop).
- [ ] **Sync route direct hit:** Visit `/api/auth/sync-org` while logged in with an org. You should land on `/dashboard` with the cookie set.
- [ ] **Compile:** Run `bun run build`. Ensure no TypeScript errors.

---

## Architectural Decisions

| Decision                                     | Rationale                                                                                                                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server Action** (not tRPC)                 | PRD §10.2: "Server Actions strictly reserved for RSC form mutations." Org creation is a one-time RSC form submission — the canonical Server Action use case.                                                                  |
| **`createDrizzleClient`** (not bare `db`)    | PRD §10.2: "Bare Drizzle client instantiation is banned outside tests." All DB calls use the factory. Pre-org contexts use `orgId: 'SYSTEM'` sentinel.                                                                        |
| **Cookie flag** (not DB query in middleware) | Middleware runs on every request. A cookie check is O(1) vs a DB roundtrip on every route transition. The cookie is HttpOnly + Secure — not spoofable.                                                                        |
| **30-day cookie** (not 1 year)               | Matches the Supabase session cookie lifecycle. If auth expires/logout, the org cookie resets too, preventing stale state.                                                                                                     |
| **Cookie de-sync safety**                    | If a user is removed from an org, the cookie stays true until expiry. The `/api/auth/sync-org` route re-validates from DB on any loop, acting as a safety net. Future: clear `has_org` cookie on org deletion/removal events. |
| **`type` stored in `app_metadata`**          | The "Freelancer vs Agency" choice personalizes guided setup UX copy. Stored via `supabase.auth.updateUser()` — no schema change needed.                                                                                       |
| **Transaction for both INSERTs**             | An org without its owner membership is an orphan. A membership without an org is a FK violation. Both must succeed or neither.                                                                                                |
| **Slug collision catch (23505)**             | Random suffix collision is rare but possible. Catching PostgreSQL error 23505 returns a user-friendly "Name conflict — please try again" instead of a generic error.                                                          |
| **Guided onboarding redirect**               | PRD §5/§13.1 requires: org creation → add first client → create first project. Redirecting to `/onboarding/add-client` instead of `/dashboard` fulfills this.                                                                 |
| **Sync Route** (not direct redirect)         | Server Component pages cannot set cookies before `redirect()`. A Route Handler can. Without this, a missing cookie causes an infinite redirect loop.                                                                          |
| **`useFormState`** (not `useActionState`)    | `useActionState` is React 19 / Next.js 15. For Next.js 14 stable, `useFormState` from `react-dom` is the correct hook. Pending state uses `useFormStatus`.                                                                    |

---

## References

- PRD §5 — Organization & Multi-Tenancy Model (onboarding flow)
- PRD §9 — Pricing (Starter plan default, `next_invoice_number: 1001`)
- PRD §10.2 — Architectural Rules (Server Actions for RSC mutations)
- PRD §13.1 — Freelancer Onboarding (name + type: Freelancer or Agency)
- PRD §16 — Success Metrics ("Admin creates first project within 10 minutes of signup")
