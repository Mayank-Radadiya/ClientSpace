# Task 09 — Magic Links (Client Invitation Acceptance)

## Goal

Implement the page a client lands on after clicking the invitation link from Task 08. This fulfils **PRD Section 6.2 (Client Invitation Acceptance)** and the PRD mandate for **Magic Links for Clients (Phase 1 Essential): Passwordless login via email links**. On completion, clicking the link in the email validates the invitation, atomically updates three database rows, creates a Supabase Auth account (if needed) via the Admin SDK, triggers a magic-link OTP email, and the client enters the portal by clicking the OTP link — **no password is ever created or entered**.

---

## Description

The full acceptance flow is:

1. The client clicks `/invite/accept?token=<raw-token>` in their email.
2. The **Server Component** page reads the `?token=` query param, hashes it with SHA-256 (identical method to Task 08), and looks up the `invitations` row by `tokenHash`.
3. The page validates the invitation: checks it is `pending` and has not expired.
4. The page checks if a user already exists for this email by querying `public.users` (synced from `auth.users` via the Task 03 trigger — **no Admin SDK `listUsers()` call**).
5. The page renders a `MagicLinkForm` with the email pre-filled (read-only) and a single "Accept Invitation" button. **No password fields** — the PRD mandates passwordless entry for clients.
6. The `acceptInviteAction` Server Action executes in this order:
   - **First:** If no `auth.users` row exists for the email, create one via `supabase.auth.admin.createUser()` using a **service-role client**.
   - **Second:** Perform **three atomic DB writes** inside a single Drizzle transaction:
     - Set `invitations.status = 'accepted'` and `invitations.accepted_at = NOW()`.
     - Set `clients.user_id = <auth-uid>`.
     - Insert a row into `org_memberships` with `role = 'client'`.
   - **Third:** After the transaction commits, call `supabase.auth.signInWithOtp({ email })` to send a magic-link email.
7. The client sees a "Check your email" confirmation. Clicking the magic link creates a session and lands them on `/portal`.

### Error States

| Condition                            | User-Facing Message                                                  |
| ------------------------------------ | -------------------------------------------------------------------- |
| Token missing / not found            | "This invitation link is invalid."                                   |
| Token expired (`expires_at < NOW()`) | "This invitation has expired. Please ask your contact to resend it." |
| Status is `accepted`                 | Redirect silently to `/portal` (idempotency).                        |
| Status is `revoked`                  | "This invitation has been revoked."                                  |
| DB transaction failure               | "Something went wrong. Please try again."                            |

---

## Tech Stack

| Concern                   | Library                                                 |
| ------------------------- | ------------------------------------------------------- |
| Token hashing             | Node.js built-in `crypto` (`createHash`)                |
| Auth — magic link (OTP)   | `supabase.auth.signInWithOtp({ email })`                |
| Auth — admin user create  | `supabase.auth.admin.createUser()` (service-role)       |
| Auth — session (server)   | `@supabase/ssr` (`createClient`)                        |
| Auth — service-role admin | `createServiceRoleClient()` (new helper)                |
| User existence check      | `public.users` table query (synced via Task 03 trigger) |
| DB atomic writes          | Drizzle ORM transaction                                 |
| Schema validation         | `zod`                                                   |
| UI                        | `shadcn/ui`                                             |

---

## Instructions

### Step 1 — Create the Public Route Group

The invitation page must be accessible without an active session. Ensure a `(public)` route group exists that is **not** wrapped by the auth middleware guard established in Task 03.

```text
src/
  app/
    (public)/
      invite/
        accept/
          page.tsx        ← Server Component (this task)
          error.tsx       ← optional, for unhandled errors
```

Update `src/middleware.ts` to allow `/invite/accept` through unauthenticated:

```typescript
// src/middleware.ts  (partial — add to matcher or guard logic)
const PUBLIC_PATHS = ["/login", "/invite/accept"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next(); // bypass auth check
  }
  // … existing session guard …
}
```

---

### Step 2 — Token Lookup Helper

Create a pure utility that encapsulates the hashing + DB lookup so it can be tested independently.

```typescript
// src/features/invitations/queries.ts
import { createHash } from "crypto";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Hash the incoming raw token EXACTLY as Task 08 stored it:
 *   createHash('sha256').update(rawToken).digest('hex')
 *
 * IMPORTANT: rawToken is the plain hex string from the URL.
 * Do NOT Buffer.from(rawToken, 'hex') before hashing — that would
 * produce a different digest and fail verification.
 */
export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * PUBLIC ROUTE CONTEXT: This runs on `/invite/accept`, which is unauthenticated.
 * We use the bare `db` client here because there is no authenticated session
 * to pass to `createDrizzleClient`. This is acceptable because:
 *   1. The query is read-only (SELECT).
 *   2. The lookup is by tokenHash, not by org — no tenant isolation needed.
 *   3. The invitation acceptance page is a public route by design (Task 09 Step 1).
 * Once the user authenticates (in acceptInviteAction), all subsequent writes
 * use `createDrizzleClient` with proper session context.
 */
export async function findInvitationByToken(rawToken: string) {
  const tokenHash = hashInviteToken(rawToken);
  return db.query.invitations.findFirst({
    where: eq(invitations.tokenHash, tokenHash),
    with: { client: true }, // join the related clients row
  });
}
```

---

### Step 3 — Zod Schema for Sign-Up

```typescript
// src/features/invitations/schemas.ts
import { z } from "zod";

export const signUpViaInviteSchema = z
  .object({
    email: z.string().email(), // hidden field; pre-filled from invite
    invitationId: z.string().uuid(), // hidden field; passed from server
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignUpViaInviteInput = z.infer<typeof signUpViaInviteSchema>;
```

---

### Step 4 — Server Action: `acceptInviteAction`

This is the heart of the task. It handles both new and existing users.

```typescript
// src/features/invitations/server/actions.ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { db } from "@/db"; // bare client ONLY for pre-auth lookups (see note below)
import { invitations, clients, orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { signUpViaInviteSchema } from "../schemas";

interface AcceptInvitePayload {
  invitationId: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function acceptInviteAction(rawInput: AcceptInvitePayload) {
  // ── 1. Validate input ────────────────────────────────────────────────────
  const parsed = signUpViaInviteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { email, password, invitationId } = parsed.data;

  // ── 2. Re-fetch the invitation (authoritative DB check) ──────────────────
  //   We re-fetch here (not trust the page render) to guard against
  //   the window between page load and form submit.
  //
  //   NOTE: bare `db` is used here because the user is not yet authenticated.
  //   This is the same pattern as `findInvitationByToken` (public route lookup).
  //   Once the user authenticates below, all writes use `createDrizzleClient`.
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.id, invitationId),
    with: { client: true },
  });

  if (!invitation) {
    return { error: "Invitation not found." };
  }

  // ── Idempotency: already accepted ───────────────────────────────────────
  if (invitation.status === "accepted") {
    redirect("/portal");
  }

  if (invitation.status === "revoked") {
    return { error: "This invitation has been revoked." };
  }

  if (new Date() > invitation.expiresAt) {
    return { error: "This invitation has expired. Please request a new one." };
  }

  // ── 3. Create or retrieve the Supabase Auth user ─────────────────────────
  //
  // IMPORTANT — createClient() here MUST be the @supabase/ssr server client
  // (imported from @/lib/supabase/server). It writes auth cookies via the
  // Next.js cookies() API, which is compatible with Server Actions (POST).
  // The session cookie is written at this point, but the redirect() below
  // flushes the Set-Cookie response headers correctly before the browser
  // follows the redirect — so cookie persistence is safe.
  const supabase = await createClient();

  // Try sign-up first. Supabase returns error.code === 'user_already_exists'
  // when the email is already registered — we fall back to signInWithPassword.
  let authUserId: string;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    if (signUpError.code === "user_already_exists") {
      // Path B — existing user: sign them in to retrieve their UID.
      // signInWithPassword returns { data: { user, session }, error }.
      // data.user is the full User object; data.session holds the JWT.
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.user) {
        return {
          error:
            "An account with this email already exists. Check your password and try again.",
        };
      }
      authUserId = signInData.user.id;
    } else {
      console.error("[acceptInviteAction] signUp error:", signUpError);
      return { error: "Could not create your account. Please try again." };
    }
  } else {
    if (!signUpData.user) {
      return { error: "Account creation failed. Please try again." };
    }
    authUserId = signUpData.user.id;
  }

  // ── 4. Atomic DB transaction — three writes ──────────────────────────────
  //
  // Now that the user is authenticated, use createDrizzleClient with proper
  // session context for RLS enforcement on all writes.
  //
  // Ordering guarantee: Auth happens BEFORE the transaction so that authUserId
  // is available for all three writes. If the transaction fails, the user is
  // already signed in (cookies are set) but the DB rows are NOT updated.
  //
  // This partial state is acceptable for MVP:
  //   • The invitation remains "pending" so the client can retry by clicking
  //     the link again (they will hit Path B since they are now a known user).
  //   • The DB failure returns an error to the UI; redirect() is NOT called,
  //     so the user stays on the page and sees the error message.
  //   • On retry, signInWithPassword succeeds (they are already authed) and
  //     the transaction runs again — the invitation idempotency check inside
  //     the action prevents double-inserts to org_memberships.
  const dbScoped = await createDrizzleClient({
    userId: authUserId,
    orgId: invitation.orgId,
  });

  try {
    await dbScoped.transaction(async (tx) => {
      // Write 1: mark invitation as accepted
      await tx
        .update(invitations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(invitations.id, invitationId));

      // Write 2: link the auth user to the clients row
      await tx
        .update(clients)
        .set({ userId: authUserId })
        .where(eq(clients.id, invitation.clientId));

      // Write 3: create org membership with role 'client'
      await tx.insert(orgMemberships).values({
        orgId: invitation.orgId,
        userId: authUserId,
        role: "client",
      });
    });
  } catch (err) {
    console.error("[acceptInviteAction] DB transaction failed:", err);
    // Do NOT redirect here — return an error so the client can retry.
    return {
      error: "Something went wrong saving your account. Please try again.",
    };
  }

  // ── 5. Redirect to Client Portal ─────────────────────────────────────────
  //   redirect() is only reached when the transaction succeeds.
  //   Next.js serialises the Set-Cookie header (from step 3) alongside the
  //   redirect response, so the session cookie is delivered atomically.
  redirect("/portal");
}
```

---

### Step 5 — Sign-Up Form Component (Path A)

```tsx
// src/features/invitations/components/SignUpForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signUpViaInviteSchema, type SignUpViaInviteInput } from "../schemas";
import { acceptInviteAction } from "../server/actions";

interface SignUpFormProps {
  email: string;
  invitationId: string;
}

export function SignUpForm({ email, invitationId }: SignUpFormProps) {
  const form = useForm<SignUpViaInviteInput>({
    resolver: zodResolver(signUpViaInviteSchema),
    defaultValues: {
      email,
      invitationId,
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignUpViaInviteInput) {
    const result = await acceptInviteAction(values);

    // redirect() throws internally — if we reach here, something went wrong
    if (result?.error) {
      const msg =
        typeof result.error === "string"
          ? result.error
          : "Please fix the highlighted fields.";
      toast.error(msg);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email — read-only, pre-filled from invitation */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input {...field} type="email" readOnly className="bg-muted" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden invitationId */}
        <input type="hidden" {...form.register("invitationId")} />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Create a password</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Setting up your account…"
            : "Accept Invitation"}
        </Button>
      </form>
    </Form>
  );
}
```

---

### Step 6 — Accept Button Component (Path B — Existing User)

For Path B, the user may already have a password. We render a minimal form that asks for their password (to re-authenticate) before calling the same `acceptInviteAction`.

```tsx
// src/features/invitations/components/AcceptInviteButton.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { acceptInviteAction } from "../server/actions";

const existingUserSchema = z.object({
  email: z.string().email(),
  invitationId: z.string().uuid(),
  password: z.string().min(1, "Password is required."),
  confirmPassword: z.string().min(1), // satisfies shared schema
});

interface AcceptInviteButtonProps {
  email: string;
  invitationId: string;
}

export function AcceptInviteButton({
  email,
  invitationId,
}: AcceptInviteButtonProps) {
  const form = useForm({
    resolver: zodResolver(existingUserSchema),
    defaultValues: { email, invitationId, password: "", confirmPassword: "_" },
  });

  async function onSubmit(values: z.infer<typeof existingUserSchema>) {
    const result = await acceptInviteAction(values);
    if (result?.error) {
      toast.error(
        typeof result.error === "string"
          ? result.error
          : "Error accepting invitation.",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          An account already exists for <strong>{email}</strong>. Enter your
          password to accept this invitation.
        </p>
        <input type="hidden" {...form.register("email")} />
        <input type="hidden" {...form.register("invitationId")} />
        <input type="hidden" {...form.register("confirmPassword")} />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Accepting…" : "Accept Invitation"}
        </Button>
      </form>
    </Form>
  );
}
```

---

### Step 7 — The Page: `src/app/(public)/invite/accept/page.tsx`

This is a **Server Component**. All token validation happens here before any HTML is sent.

```tsx
// src/app/(public)/invite/accept/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findInvitationByToken } from "@/features/invitations/queries";
import { SignUpForm } from "@/features/invitations/components/SignUpForm";
import { AcceptInviteButton } from "@/features/invitations/components/AcceptInviteButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageProps {
  searchParams: { token?: string };
}

export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const { token } = searchParams;

  // ── 1. Token must be present ─────────────────────────────────────────────
  if (!token) {
    return <InviteError message="This invitation link is invalid." />;
  }

  // ── 2. Look up invitation by hashed token ────────────────────────────────
  const invitation = await findInvitationByToken(token);

  if (!invitation) {
    return <InviteError message="This invitation link is invalid." />;
  }

  // ── 3. Idempotency: already accepted → go to portal ─────────────────────
  if (invitation.status === "accepted") {
    redirect("/portal");
  }

  // ── 4. Validate status and expiry ────────────────────────────────────────
  if (invitation.status === "revoked") {
    return <InviteError message="This invitation has been revoked." />;
  }

  if (new Date() > invitation.expiresAt) {
    return (
      <InviteError message="This invitation has expired. Please ask your contact to resend it." />
    );
  }

  // ── 5. Check if a Supabase Auth user already exists for this email ───────
  //   We use the Admin client (service role) to look up the user by email.
  //   The regular anon client cannot enumerate users.
  //
  //   PAGINATION BUG FIX: listUsers() defaults to perPage=50. Without an
  //   explicit limit, users beyond position 50 will not be found, causing
  //   an existing user to incorrectly see the "Sign Up" form instead of
  //   the "Accept" form. We pass perPage:1000 which covers typical MVP
  //   org sizes. Upgrade path: replace with getUserByEmail() once available
  //   in your Supabase JS version, or query your own `users` mirror table.
  const supabase = await createClient();
  const { data: adminData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existingAuthUser = adminData?.users?.find(
    (u) => u.email === invitation.email,
  );

  const isExistingUser = !!existingAuthUser;

  // ── 6. Render the appropriate path ──────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isExistingUser ? "Accept Your Invitation" : "Set Up Your Account"}
          </CardTitle>
          <CardDescription>
            You have been invited to access the client portal.
            {!isExistingUser && " Create a password to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isExistingUser ? (
            <AcceptInviteButton
              email={invitation.email}
              invitationId={invitation.id}
            />
          ) : (
            <SignUpForm email={invitation.email} invitationId={invitation.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Local sub-component for error states ─────────────────────────────────────
function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Invitation Unavailable</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, contact the person who sent the
            invitation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

> **Security note on `auth.admin.listUsers()`:** This call requires the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`), which must only ever be used in Server Components or Server Actions — never in client code. Ensure `createClient()` in server context initialises with the service role key when calling admin APIs.
>
> **UX note:** The Path A / Path B split is a UX optimisation only — it is **not a security boundary**. If `listUsers` misidentifies a user (e.g., org exceeds 1,000 users), the worst outcome is an existing user sees the Sign-Up form. When they submit, `signUp` returns `user_already_exists`, the action falls back to `signInWithPassword`, and the flow completes correctly. The action is always the source of truth.

---

### Step 8 — Complete the Stubs from Task 08

#### `resendInviteAction`

```typescript
// src/features/clients/server/actions.ts  (replace the stub)
export async function resendInviteAction(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const dbInit = await createDrizzleClient({ userId: user.id, orgId: "" });
  const membership = await dbInit.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id),
  });
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: "Only admins can resend invitations." };
  }

  const db = await createDrizzleClient({
    userId: user.id,
    orgId: membership.orgId,
  });

  // Find the most recent pending invitation for this client
  const invitation = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.clientId, clientId),
      eq(invitations.status, "pending"),
    ),
    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
  });

  if (!invitation) {
    return { error: "No pending invitation found for this client." };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await db
    .update(invitations)
    .set({ tokenHash, expiresAt })
    .where(eq(invitations.id, invitation.id));

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${rawToken}`;
  await sendClientInviteEmail({
    to: invitation.email,
    contactName: client!.contactName,
    companyName: client!.companyName,
    inviteUrl,
  });

  return { success: true };
}
```

#### `revokeInviteAction`

```typescript
// src/features/clients/server/actions.ts  (replace the stub)
export async function revokeInviteAction(invitationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const dbInit = await createDrizzleClient({ userId: user.id, orgId: "" });
  const membership = await dbInit.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id),
  });
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: "Only admins can revoke invitations." };
  }

  const db = await createDrizzleClient({
    userId: user.id,
    orgId: membership.orgId,
  });

  await db
    .update(invitations)
    .set({ status: "revoked" })
    .where(eq(invitations.id, invitationId));

  revalidatePath("/dashboard/clients");
  return { success: true };
}
```

---

### Step 9 — RLS Policy for `org_memberships`

Ensure the insert in `acceptInviteAction` can succeed. Because the action uses the service role client (or runs in a trusted server context), RLS is bypassed. However, add a read policy so clients can read their own membership:

```sql
-- Allow users to read their own membership row
CREATE POLICY "members_read_own"
  ON org_memberships
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

## PRD Constraints Reference

| Constraint             | Implementation                                                               |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Token hashing**      | `createHash('sha256').update(rawToken).digest('hex')` — identical to Task 08 |
| **Token expiry**       | Page and action both check `new Date() > invitation.expiresAt`               |
| **Idempotency**        | Status `accepted` → `redirect('/portal')` without error                      |
| **Atomic writes**      | All three DB updates wrapped in a single `db.transaction()`                  |
| **Role**               | `org_memberships` row inserted with `role: 'client'`                         |
| **`clients.userId`**   | Set to the Supabase Auth UID in Write 2 of the transaction                   |
| **No raw token in DB** | Only `tokenHash` is ever written; raw token lives only in the email URL      |

---

## Validation Checklist

Complete these checks before marking the task done.

### Happy Path — New User (Path A)

- [ ] Copy the invite URL from the Task 08 email and open it in an **incognito window**.
- [ ] The page renders with the correct email pre-filled and the password fields visible.
- [ ] Submit the form with a valid password (≥ 8 chars) and matching confirm password.
- [ ] After submission, the browser is redirected to `/portal`.
- [ ] **Database checks:**

  ```sql
  -- invitations row
  SELECT status, accepted_at FROM invitations ORDER BY created_at DESC LIMIT 1;
  -- Expected: status = 'accepted', accepted_at IS NOT NULL

  -- clients row
  SELECT user_id FROM clients ORDER BY created_at DESC LIMIT 1;
  -- Expected: user_id IS NOT NULL (the Supabase Auth UID)

  -- org_memberships row
  SELECT role FROM org_memberships WHERE user_id = '<auth-uid>';
  -- Expected: role = 'client'
  ```

- [ ] The new user appears in the **Supabase Auth → Users** dashboard.

### Happy Path — Existing User (Path B)

- [ ] Use an email address that **already has a Supabase Auth account**.
- [ ] Send an invitation to that address from the Task 08 UI.
- [ ] Click the link — the page should show the "Accept Your Invitation" heading with only a password field (not the sign-up form).
- [ ] Enter the correct existing password → redirect to `/portal`.
- [ ] All three DB writes succeed as above.

### Error / Edge Cases

- [ ] **Expired token:** Manually set `expires_at = NOW() - interval '1 hour'` on an invitation row, then click its link → page shows "This invitation has expired."
- [ ] **Revoked token:** Set `status = 'revoked'` on an invitation → page shows "This invitation has been revoked."
- [ ] **Invalid token:** Navigate to `/invite/accept?token=totallybadtoken` → page shows "This invitation link is invalid."
- [ ] **No token param:** Navigate to `/invite/accept` (no query string) → same invalid message.
- [ ] **Already accepted (idempotency):** Click a link whose `status = 'accepted'` → browser silently redirects to `/portal` without error.
- [ ] **Wrong password (Path B):** Enter incorrect password → toast error appears, user stays on the page.
- [ ] **Mismatched passwords (Path A):** Submit with mismatched `password` / `confirmPassword` → inline `FormMessage` error, no network call made.

### Security

- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is only used server-side — search the codebase: `grep -r "SERVICE_ROLE" src/` should return **zero** results from files under `src/app/(public)/` that are client components.
- [ ] The raw token is **never** logged: `grep -r "rawToken" src/` (only Task 08 generation and Task 09 hash calls should appear; no `console.log` lines).
- [ ] Verify the invitation page is excluded from the session guard middleware by hitting `/invite/accept?token=bad` in an **unauthenticated** browser — it must return the error page, not a login redirect.
- [ ] The `org_memberships` row for the new client has `role = 'client'`, not `admin` or `owner`.

### Client Portal Access

- [ ] After acceptance, the logged-in client can access `/portal`.
- [ ] The client **cannot** access admin routes (e.g., `/dashboard/clients`) — they should receive a 403 or redirect.
- [ ] The client can only see data belonging to their own `clientId` (verify RLS policies block cross-client data access by querying Supabase with the client's JWT).
