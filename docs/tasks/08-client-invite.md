# Task 08 — Client Invitation System

## Goal

Enable Admins to invite Clients into the portal via email. This implements **PRD Section 6.2** and is the entry point for the entire Client Experience. On completion, an Admin can enter a client's email, company, and contact name; a secure invitation email is dispatched; and a corresponding `clients` + `invitations` row exists in the database.

---

## Description

The flow is:

1. Admin opens the **Invite Client** dialog and submits the form.
2. A Server Action validates input, checks for duplicate emails within the organisation, and inserts a `clients` row (`userId: null`) and an `invitations` row inside a **single DB transaction**.
3. After the transaction commits successfully, the email is sent via **Resend** (sending _after_ the DB write prevents "ghost emails" when the DB fails mid-flight).
4. The invitation email contains a secure, time-limited link. Clients click it to complete account setup (handled in Task 09).

---

## Tech Stack

| Concern           | Library                                      |
| ----------------- | -------------------------------------------- |
| Email delivery    | `resend`                                     |
| Email template    | `@react-email/components`                    |
| Token generation  | Node.js built-in `crypto`                    |
| Schema validation | `zod`                                        |
| Database          | Drizzle ORM + Supabase Postgres              |
| UI dialog         | `shadcn/ui` (Dialog, Form) + React Hook Form |

---

## Instructions

### Step 1 — Install Dependencies

```bash
npm install resend @react-email/components
```

Add the following environment variables to `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
INVITE_FROM_EMAIL=invites@yourdomain.com
```

---

### Step 2 — Database: `invitations` Table

Ensure the `invitations` table exists in your Drizzle schema (`src/db/schema.ts`). Add it if missing:

```typescript
// src/db/schema.ts — ensure the invitations table matches the Task 02 canonical schema.
// The invitationStatusEnum and invitations table should already exist from Task 02.
// If you added them in Task 02, no changes are needed here. Otherwise, ensure:

import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { clients } from "./schema"; // adjust import path as needed

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull(), // SHA-256 of the raw token
  status: invitationStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});
```

Generate and apply the migration:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

### Step 3 — Zod Schema

Create the shared validation schema:

```typescript
// src/features/clients/schemas.ts
import { z } from "zod";

export const inviteClientSchema = z.object({
  email: z.string().email({ message: "A valid email is required." }),
  companyName: z
    .string()
    .min(1, { message: "Company name is required." })
    .max(120),
  contactName: z
    .string()
    .min(1, { message: "Contact name is required." })
    .max(120),
});

export type InviteClientInput = z.infer<typeof inviteClientSchema>;
```

---

### Step 4 — Server Action

```typescript
// src/features/clients/server/actions.ts
"use server";

import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { clients, invitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { orgMemberships } from "@/db/schema";
import { inviteClientSchema } from "../schemas";
import { sendClientInviteEmail } from "@/emails/send";

export async function inviteClientAction(rawInput: unknown) {
  // 1. Auth guard — matches the pattern established in Task 05
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized." };

  // Custom JWT claims are Phase 2; read role directly from DB.
  // NOTE: This initial lookup uses createDrizzleClient with a placeholder orgId.
  // The orgId is resolved from the membership row and then used for all subsequent queries.
  const db = await createDrizzleClient({ userId: user.id, orgId: "" });
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id),
  });

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return { error: "Only admins can invite clients." };
  }
  const orgId = membership.orgId;

  // Re-create the DB client with the correct orgId for RLS enforcement
  const dbScoped = await createDrizzleClient({ userId: user.id, orgId });

  // 2. Validate input
  const parsed = inviteClientSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { email, companyName, contactName } = parsed.data;

  // 3. Duplicate check — same email already in this org
  //    If a client row exists, check if re-invitation is needed:
  //    - If the latest invitation is still "pending" and not expired → block.
  //    - If the latest invitation is expired or revoked → allow a new invitation.
  const existingClient = await dbScoped.query.clients.findFirst({
    where: and(eq(clients.orgId, orgId), eq(clients.email, email)),
  });

  let clientId: string;

  if (existingClient) {
    // Check the latest invitation for this client
    const latestInvitation = await dbScoped.query.invitations.findFirst({
      where: and(
        eq(invitations.clientId, existingClient.id),
        eq(invitations.status, "pending"),
      ),
      orderBy: (inv, { desc }) => [desc(inv.createdAt)],
    });

    if (latestInvitation && new Date() < latestInvitation.expiresAt) {
      return {
        error:
          'A pending invitation already exists for this client. Use "Resend Invite" to send a new link.',
      };
    }

    // Expired or revoked — reuse the existing client row
    clientId = existingClient.id;
  }

  // 4. Generate a cryptographically secure token (72-hour expiry)
  //
  // IMPORTANT — hashing contract for Task 09:
  //   rawToken  : randomBytes(32).toString('hex')  → 64-char UTF-8 hex string
  //   tokenHash : sha256(rawToken-as-UTF8-string).digest('hex')
  //
  // Task 09 MUST hash the incoming URL token the same way:
  //   createHash('sha256').update(incomingToken).digest('hex')
  // Do NOT decode the hex to a Buffer before hashing — that would produce
  // a different digest and break verification.
  const rawToken = randomBytes(32).toString("hex"); // 64-char hex string
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  // 5. Transactional DB write
  //    - New client: insert clients row + invitations row.
  //    - Re-invitation: insert only the new invitations row for the existing client.
  try {
    await dbScoped.transaction(async (tx) => {
      if (!existingClient) {
        // New client — create the clients row first
        const [newClient] = await tx
          .insert(clients)
          .values({
            orgId,
            email,
            companyName,
            contactName,
            userId: null, // populated when the invite is accepted (Task 09)
          })
          .returning({ id: clients.id });

        clientId = newClient.id;
      }

      await tx.insert(invitations).values({
        orgId,
        clientId: clientId!,
        email,
        tokenHash,
        expiresAt,
        status: "pending",
      });
    });
  } catch (err) {
    console.error("[inviteClientAction] DB transaction failed:", err);
    return { error: "Database error. Please try again." };
  }

  // 6. Send email AFTER the transaction — prevents ghost emails on DB failure
  //
  // NOTE: For Phase 2, consider publishing an `invitation.created` Inngest event
  // here and letting a background worker handle the Resend API call + retries.
  // This avoids holding the UI in a "Sending…" state while the email API responds.
  // See PRD §10 (Background Jobs).
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${rawToken}`;
  try {
    await sendClientInviteEmail({
      to: email,
      contactName,
      companyName,
      inviteUrl,
    });
  } catch (err) {
    // Email failed but DB is already committed.
    // Log it and surface a partial-success message so an admin can resend.
    console.error("[inviteClientAction] Email delivery failed:", err);
    return {
      success: true,
      warning:
        'Client record created, but the invitation email could not be delivered. Use "Resend Invite" from the client list.',
    };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

// ── Stub: Resend an existing invitation ─────────────────────────────────────
export async function resendInviteAction(clientId: string) {
  // TODO (Task 09):
  // 1. Look up the pending invitation row for clientId.
  // 2. Generate a new token, update tokenHash + expiresAt.
  // 3. Re-send the email.
  throw new Error("Not yet implemented — see Task 09.");
}

// ── Stub: Revoke an invitation ───────────────────────────────────────────────
export async function revokeInviteAction(invitationId: string) {
  // TODO (Task 09):
  // 1. Set invitations.status = 'revoked' where id = invitationId.
  throw new Error("Not yet implemented — see Task 09.");
}
```

---

### Step 5 — Email Helper (Resend wrapper)

```typescript
// src/emails/send.ts
import { Resend } from "resend";
import { ClientInviteEmail } from "./ClientInviteEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendClientInviteOptions {
  to: string;
  contactName: string;
  companyName: string;
  inviteUrl: string;
}

export async function sendClientInviteEmail(opts: SendClientInviteOptions) {
  await resend.emails.send({
    from: process.env.INVITE_FROM_EMAIL!,
    to: opts.to,
    subject: `You've been invited to ${opts.companyName}'s portal`,
    react: ClientInviteEmail(opts),
  });
}
```

---

### Step 6 — Email Template

```tsx
// src/emails/ClientInviteEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ClientInviteEmailProps {
  contactName: string;
  companyName: string;
  inviteUrl: string;
}

export function ClientInviteEmail({
  contactName,
  companyName,
  inviteUrl,
}: ClientInviteEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        You have been invited to {companyName}&apos;s client portal
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
              alt="ClientSpace"
              width={140}
              height={40}
            />
          </Section>

          <Heading style={heading}>You&apos;re invited!</Heading>

          <Text style={paragraph}>Hi {contactName},</Text>
          <Text style={paragraph}>
            <strong>{companyName}</strong> has invited you to access their
            secure client portal powered by <strong>ClientSpace</strong>. Click
            the button below to set up your account and get started.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={hint}>
            This link expires in <strong>72 hours</strong>. If you did not
            expect this invitation, you can safely ignore this email.
          </Text>

          <Hr style={divider} />

          <Text style={footer}>
            © {new Date().getFullYear()} ClientSpace. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "40px auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const logoSection: React.CSSProperties = {
  backgroundColor: "#0f172a",
  padding: "24px 32px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#0f172a",
  padding: "32px 32px 0",
  margin: 0,
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#374151",
  padding: "12px 32px 0",
  margin: 0,
};

const buttonSection: React.CSSProperties = {
  padding: "28px 32px",
  textAlign: "center",
};

const button: React.CSSProperties = {
  backgroundColor: "#6366f1",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  borderRadius: "8px",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const hint: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  padding: "0 32px 24px",
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "0 32px",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  padding: "16px 32px 24px",
  margin: 0,
};
```

---

### Step 7 — UI Dialog Component

```tsx
// src/features/clients/components/InviteClientDialog.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { inviteClientSchema, type InviteClientInput } from "../schemas";
import { inviteClientAction } from "../server/actions";

export function InviteClientDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<InviteClientInput>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: { email: "", companyName: "", contactName: "" },
  });

  async function onSubmit(values: InviteClientInput) {
    const result = await inviteClientAction(values);

    if (result?.error) {
      const msg =
        typeof result.error === "string"
          ? result.error
          : "Please fix the highlighted fields.";
      toast.error(msg);
      return;
    }

    if (result?.warning) {
      toast.warning(result.warning);
    } else {
      toast.success("Invitation sent successfully!");
    }

    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite Client</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a Client</DialogTitle>
          <DialogDescription>
            Send a secure invitation email. The link expires in 72 hours.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="client@acme.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending…" : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 8 — Wire Up the Dialog on the Clients Page

```tsx
// src/app/(dashboard)/clients/page.tsx  (partial update)
import { InviteClientDialog } from "@/features/clients/components/InviteClientDialog";

export default function ClientsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <InviteClientDialog />
      </div>
      {/* client list table … */}
    </div>
  );
}
```

---

## PRD Constraints Reference

| Constraint             | Implementation                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Token expiry           | 72 hours — set via `new Date(Date.now() + 72 * 60 * 60 * 1000)`                                            |
| Token security         | `crypto.randomBytes(32)` raw token; only the **SHA-256 hash** is stored in the DB                          |
| Role context           | `clients.userId` is `null` until accepted; role `'client'` is assigned in `org_memberships` (Task 09)      |
| No duplicate emails    | Pre-insert query checks `(orgId, email)` uniqueness; allows re-invite if prior invitation expired/revoked  |
| Ghost email prevention | Email is sent **only after** the DB transaction commits                                                    |
| Resend / Revoke        | Stubbed as `resendInviteAction` and `revokeInviteAction` in the actions file; implemented fully in Task 09 |
| RLS enforcement        | Uses `createDrizzleClient({ userId, orgId })` factory — bare `db` import is banned (PRD §10.2)             |

---

## Validation Checklist

Complete these checks before marking the task done.

### Database

- [ ] `invitations` table exists: `SELECT * FROM invitations LIMIT 5;` returns rows.
- [ ] `clients` row has `user_id = NULL` immediately after invite.
- [ ] `clients` row does **not** have a `role` column — roles live in `org_memberships`.
- [ ] `invitations.token_hash` is a 64-character hex string (SHA-256), **not** the raw token.
- [ ] `invitations.expires_at` is exactly 72 hours after `created_at` (verify with `SELECT expires_at - created_at FROM invitations ORDER BY created_at DESC LIMIT 1;`).
- [ ] `invitations.status` is `'pending'` on a fresh invite.
- [ ] Submitting a duplicate email with a **pending, non-expired** invitation returns an error.
- [ ] Submitting a duplicate email with an **expired or revoked** invitation creates a new invitations row for the existing client.

### Email Delivery

- [ ] Submit the form with a real deliverable test address (e.g., a Resend test inbox or your own email).
- [ ] Check the Resend dashboard — the email event appears with status `delivered`.
- [ ] The received email renders the logo, heading, contact name, and the **Accept Invitation** button.
- [ ] Clicking **Accept Invitation** navigates to `/invite/accept?token=<raw-token>` (the URL is well-formed even if the page returns 404 until Task 09).
- [ ] The raw token in the URL hashes to the `token_hash` stored in the DB:
  ```bash
  # Quick verification in Node REPL
  const { createHash } = require('crypto');
  const rawToken = '<paste token from URL>';
  console.log(createHash('sha256').update(rawToken).digest('hex'));
  # Output must match invitations.token_hash
  ```

### UI / UX

- [ ] The **Invite Client** button opens the dialog.
- [ ] All three fields display Zod validation errors on empty submit.
- [ ] The button shows "Sending…" while the Server Action is in flight.
- [ ] A success toast appears and the dialog closes on happy-path completion.
- [ ] A warning toast appears (and the dialog closes) when the DB write succeeds but email delivery fails.

### Security

- [ ] The raw token is **never** logged to the console or stored in the DB.
- [ ] The Server Action returns `Unauthorised.` when called without an admin session (test via `curl` or a non-admin browser session).
