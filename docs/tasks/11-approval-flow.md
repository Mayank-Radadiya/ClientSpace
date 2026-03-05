# Task 11 — Approval Flow: Notification Engine & Activity Timeline

## Goal

Close the loop on the approval actions built in Task 10. When a client interacts with the portal (approves a file, requests changes), all **assigned project members** (and the uploader of the current file version) must be notified — via both an in-app notification persisted to the `notifications` table and a transactional email sent through Resend. Notification dispatch is **offloaded to Inngest** (PRD §6.8) to unblock the main thread, enable smart batching (5-minute merge window), and guarantee delivery with automatic retries. Simultaneously, every action must be surfaced in a human-readable **Activity Timeline** visible on the Admin Dashboard and the project detail page.

This task implements **PRD Sections 6.4 (Digital Signature — IP capture), 6.7 (Activity Timeline) & 6.8 (Notifications / Inngest batching)**.

---

## Description

The notification and activity system sits between two existing surfaces:

1. **Source of truth:** The `updateAssetStatusAction` (Task 10) writes an `activity_logs` row inside its transaction when a client approves or requests changes. The metadata includes the client's **IP address** for digital signature compliance (PRD §6.4).
2. **Consumers:** The Admin Dashboard (`/dashboard`) and Project Detail page (`/dashboard/projects/[id]`) display the activity feed; assigned project members receive transactional email alerts via **Inngest background jobs**.

The architecture follows a **"log first, dispatch event second"** pattern:

- The DB write (activity log) is inside the existing transaction — it cannot fail silently.
- After the transaction commits, the server action dispatches an **Inngest event** (`notification/asset-status`). This is a single non-blocking call.
- The **Inngest function** handles: (a) resolving notification recipients, (b) inserting `notifications` rows, and (c) sending Resend emails — all with automatic retries and a **5-minute merge window** to prevent notification spam (PRD §6.8).
- Email failure never rolls back or blocks the response. The activity log row always persists.

### Notification targeting (Noise Control — PRD §6.8)

All **assigned project members** and the **uploader of the current file version** are notified. Recipients are resolved server-side by:

1. Querying `project_members` for the project → all assigned member `userId`s
2. Querying `file_versions` for the asset's `current_version_id` → `uploaded_by` userId
3. Deduplicating and **excluding the acting client** (the person who approved/requested changes)

This means the actual team members working on the project are notified, not just the org owner. The acting client never receives a self-notification.

### Components delivered in this task

| Artifact              | Path                                                        | Purpose                                                        |
| :-------------------- | :---------------------------------------------------------- | :------------------------------------------------------------- |
| Email template        | `src/emails/AssetStatusEmail.tsx`                           | Transactional React Email template                             |
| Inngest client        | `src/inngest/client.ts`                                     | Inngest singleton                                              |
| Inngest function      | `src/inngest/functions/notification-dispatch.ts`            | Background notification dispatch with 5-min merge window       |
| Inngest route         | `src/app/api/inngest/route.ts`                              | HTTP serve endpoint for Inngest                                |
| Notification helpers  | `src/lib/notifications/server.tsx`                          | `dispatchNotification()` + email renderer + recipient resolver |
| Action refactor       | `src/features/portal/server/actions.ts`                     | Hook engine into `updateAssetStatusAction`                     |
| Timeline component    | `src/features/activity/components/ActivityTimeline.tsx`     | Admin-facing feed UI                                           |
| tRPC activity router  | `src/server/routers/activity.ts`                            | Queries for admin activity feed                                |
| Dashboard integration | `/dashboard/page.tsx` + `/dashboard/projects/[id]/page.tsx` | Embed the timeline                                             |

---

## Tech Stack

| Concern                   | Library                                                       |
| :------------------------ | :------------------------------------------------------------ |
| Background dispatch       | `inngest` — durable execution, 5-min merge window (PRD §6.8)  |
| Transactional email       | `resend` + `@react-email/components`                          |
| Email preview (dev)       | `react-email` local dev server (`email dev`)                  |
| Notification persistence  | Drizzle ORM → `notifications` table (inside Inngest function) |
| Activity feed data source | Drizzle ORM → `activity_logs` table                           |
| RLS enforcement           | `createDrizzleClient` factory (PRD §10.2) — no bare `db`      |
| Timeline UI               | `shadcn/ui` (`ScrollArea`, `Badge`, `Avatar`)                 |
| Date formatting           | `date-fns` (`format`, `isToday`, `isYesterday`, `startOfDay`) |

---

## Instructions

### Step 1 — Install Dependencies

```bash
npm install resend @react-email/components react-email inngest
```

Add to `.env.local`:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="ClientSpace <notifications@yourdomain.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Dev note:** Run `npx react-email dev --dir src/emails --port 3030` for live email preview. No real mail is sent during preview.

---

### Step 2 — Email Template: `AssetStatusEmail.tsx`

A single component renders two variants controlled by the `status` prop (`"approved"` | `"changes_requested"`).

```tsx
// src/emails/AssetStatusEmail.tsx
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

interface AssetStatusEmailProps {
  status: "approved" | "changes_requested";
  clientName: string;
  assetName: string;
  projectName: string;
  orgName: string;
  orgLogoUrl?: string;
  reviewUrl: string;
}

const APPROVED_COLOR = "#16a34a";
const CHANGES_COLOR = "#d97706";

export const AssetStatusEmail = ({
  status,
  clientName,
  assetName,
  projectName,
  orgName,
  orgLogoUrl,
  reviewUrl,
}: AssetStatusEmailProps) => {
  const isApproved = status === "approved";
  const accent = isApproved ? APPROVED_COLOR : CHANGES_COLOR;
  const preview = isApproved
    ? `✅ ${clientName} approved ${assetName} — no action needed.`
    : `⚠️ ${clientName} requested changes on ${assetName}.`;
  const heading = isApproved ? `File Approved 🎉` : `Changes Requested`;
  const bodyHtml = isApproved
    ? `${clientName} has approved <strong>${assetName}</strong> in <em>${projectName}</em>. No further action is required on this version.`
    : `${clientName} has requested changes on <strong>${assetName}</strong> in <em>${projectName}</em>. Review their feedback and upload a new version when ready.`;
  const ctaLabel = isApproved ? "View Approved File" : "Review Feedback";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Org header */}
          <Section style={{ marginBottom: 24 }}>
            {orgLogoUrl ? (
              <Img src={orgLogoUrl} alt={orgName} height={36} />
            ) : (
              <Text
                style={{ fontSize: 20, fontWeight: "600", color: "#0f172a" }}
              >
                {orgName}
              </Text>
            )}
          </Section>

          {/* Status pill */}
          <Section style={{ marginBottom: 16 }}>
            <span
              style={{
                ...styles.pill,
                backgroundColor: `${accent}1a`,
                color: accent,
                border: `1px solid ${accent}33`,
              }}
            >
              {isApproved ? "✅ Approved" : "⚠️ Changes Requested"}
            </span>
          </Section>

          <Heading style={{ ...styles.h1, color: accent }}>{heading}</Heading>
          <Text
            style={styles.paragraph}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          <Section style={{ textAlign: "center" as const, marginTop: 32 }}>
            <Button
              href={reviewUrl}
              style={{ ...styles.button, backgroundColor: accent }}
            >
              {ctaLabel}
            </Button>
          </Section>

          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            You&apos;re receiving this because you&apos;re the project owner in{" "}
            {orgName} on ClientSpace.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  main: { backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  container: {
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "32px 40px",
    borderRadius: 8,
    maxWidth: 560,
    border: "1px solid #e2e8f0",
  },
  pill: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: "500",
  },
  h1: { fontSize: 22, fontWeight: "700", margin: "0 0 12px" },
  paragraph: { fontSize: 15, lineHeight: "1.6", color: "#475569" },
  button: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    padding: "12px 24px",
    borderRadius: 6,
    textDecoration: "none",
  },
  hr: { borderColor: "#e2e8f0", margin: "24px 0" },
  footer: { fontSize: 12, color: "#94a3b8", lineHeight: "1.5" },
};

export default AssetStatusEmail;
```

---

### Step 3A — Inngest Client: `src/inngest/client.ts`

> **PRD §6.8:** "Implementation of Inngest for durable execution and background jobs to batch events."

```typescript
// src/inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "clientspace",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
```

---

### Step 3B — Inngest Function: `src/inngest/functions/notification-dispatch.ts`

This function is the **sole executor** of notification persistence and email delivery. It implements the PRD §6.8 **5-minute merge window** to prevent notification spam when a client rapidly approves multiple files.

```typescript
// src/inngest/functions/notification-dispatch.ts
import { inngest } from "../client";
import { Resend } from "resend";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Inngest function: notification/asset-status
 *
 * Handles both DB notification insert AND email dispatch.
 * Uses a 5-minute sleep window to batch rapid-fire events
 * (e.g., a client approving 5 files in 30 seconds).
 *
 * Idempotency key: ${orgId}:${projectId}:${eventType}:${recipientUserId}
 * This prevents duplicate notifications during Vercel cold-starts
 * or webhook replays (PRD §10.2).
 */
export const notificationDispatch = inngest.createFunction(
  {
    id: "notification-asset-status",
    // Idempotency: same org + project + event + recipient within the window
    // is deduplicated automatically by Inngest.
    idempotency: "event.data.idempotencyKey",
    // Automatic retries on transient failures (Resend 5xx, DB timeouts)
    retries: 3,
  },
  { event: "notification/asset-status" },
  async ({ event, step }) => {
    const {
      recipientUserId,
      orgId,
      type,
      title,
      body,
      link,
      emailSubject,
      emailHtml,
    } = event.data;

    // ── 5-minute merge window (PRD §6.8) ──────────────────────────────────
    // If a client approves 5 files in quick succession, only the FIRST event
    // survives the idempotency window. The merge window prevents spam.
    await step.sleep("merge-window", "5m");

    // ── Resolve recipient ─────────────────────────────────────────────────
    // Use createDrizzleClient with a SYSTEM context for background jobs.
    // Background jobs run outside a user session, so we use SYSTEM scope.
    const db = await createDrizzleClient({ userId: "SYSTEM", orgId });

    const recipient = await step.run("resolve-recipient", async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, recipientUserId),
        columns: { email: true },
      });
      return user ?? null;
    });

    if (!recipient) {
      console.warn(
        `[notification-dispatch] Skipped: user ${recipientUserId} not found.`,
      );
      return { status: "skipped-no-user" };
    }

    // ── Persist notification row ──────────────────────────────────────────
    const notificationId = await step.run("insert-notification", async () => {
      const [row] = await db
        .insert(notifications)
        .values({
          userId: recipientUserId,
          orgId,
          type,
          title,
          body,
          link,
          read: false,
        })
        .returning({ id: notifications.id });
      return row?.id ?? "unknown";
    });

    // ── Send email (best-effort) ──────────────────────────────────────────
    let emailId: string | undefined;
    if (emailHtml && emailSubject) {
      emailId = await step.run("send-email", async () => {
        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: [recipient.email],
          subject: emailSubject,
          html: emailHtml,
        });
        return (result as { id?: string })?.id;
      });
    }

    return { notificationId, emailId };
  },
);
```

---

### Step 3C — Inngest HTTP Route: `src/app/api/inngest/route.ts`

```typescript
// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { notificationDispatch } from "@/inngest/functions/notification-dispatch";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [notificationDispatch],
});
```

---

### Step 3 — Notification Helpers: `src/lib/notifications/server.tsx`

> **File extension:** Use `.tsx` because `renderAssetStatusEmailHtml` contains JSX.

This module provides three helpers consumed by `updateAssetStatusAction`:

1. `dispatchNotification()` — fires an Inngest event (no direct DB writes or email sends)
2. `renderAssetStatusEmailHtml()` — renders the React Email template to HTML
3. `resolveNotificationRecipients()` — resolves assigned project members + file uploader

**Nothing in this module touches the database directly.** All persistence is handled by the Inngest function (Step 3B).

```tsx
// src/lib/notifications/server.tsx
import { render } from "@react-email/render";
import { inngest } from "@/inngest/client";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { projectMembers, assets, fileVersions } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { AssetStatusEmail } from "@/emails/AssetStatusEmail";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType =
  | "file_approved"
  | "changes_requested"
  | "invoice_created"
  | "invoice_overdue"
  | "comment_added"
  | "project_status_changed";

export interface NotificationEventData {
  idempotencyKey: string;
  recipientUserId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  emailSubject?: string;
  emailHtml?: string;
}

// ─── Inngest event dispatcher ────────────────────────────────────────────────

/**
 * Dispatches a notification event to Inngest for background processing.
 *
 * This is the ONLY notification entry point used by server actions.
 * The Inngest function (Step 3B) handles DB persistence and email delivery.
 */
export async function dispatchNotification(
  data: NotificationEventData,
): Promise<void> {
  await inngest.send({
    name: "notification/asset-status",
    data,
  });
}

// ─── Email render helper ──────────────────────────────────────────────────────

/** Renders AssetStatusEmail to an HTML string for use in notification events. */
export async function renderAssetStatusEmailHtml(
  props: React.ComponentProps<typeof AssetStatusEmail>,
): Promise<string> {
  return await render(<AssetStatusEmail {...props} />);
}

// ─── Notification recipient resolver (PRD §6.4 / §6.8) ───────────────────────

/**
 * Resolves all users who should be notified about an asset status change.
 *
 * Recipients include:
 *  1. All assigned project members (from `project_members` table)
 *  2. The uploader of the asset's current version (from `file_versions`)
 *
 * The acting user (excludeActorId) is ALWAYS excluded to prevent
 * self-notifications.
 *
 * Returns a deduplicated array of user IDs.
 */
export async function resolveNotificationRecipients(
  orgId: string,
  projectId: string,
  assetId: string,
  excludeActorId: string,
): Promise<string[]> {
  // Use createDrizzleClient with a scoped context for this org
  const db = await createDrizzleClient({ userId: "SYSTEM", orgId });

  // 1. Get all assigned project member userIds
  const members = await db.query.projectMembers.findMany({
    where: eq(projectMembers.projectId, projectId),
    columns: { userId: true },
  });

  // 2. Get the uploader of the current version
  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, assetId),
    columns: { currentVersionId: true },
  });

  let uploaderId: string | null = null;
  if (asset?.currentVersionId) {
    const version = await db.query.fileVersions.findFirst({
      where: eq(fileVersions.id, asset.currentVersionId),
      columns: { uploadedBy: true },
    });
    uploaderId = version?.uploadedBy ?? null;
  }

  // 3. Deduplicate and exclude the acting user
  const recipientSet = new Set<string>();
  for (const m of members) {
    recipientSet.add(m.userId);
  }
  if (uploaderId) {
    recipientSet.add(uploaderId);
  }
  recipientSet.delete(excludeActorId);

  return Array.from(recipientSet);
}
```

---

### Step 4 — Refactor `updateAssetStatusAction`

Extend the existing Server Action from Task 10 to:

1. Use `createDrizzleClient` via `getSessionContext` (PRD §10.2 — no bare `db`)
2. Capture the client's **IP address** for digital signature compliance (PRD §6.4)
3. Use the `ActivityEventMetadata` **discriminated union** for typed metadata (PRD §11)
4. Dispatch **Inngest events** to all resolved notification recipients (PRD §6.8)

> **Schema note:** The `ActivityEventMetadata` union in Task 02 should include `ipAddress?: string` on the `asset.approved` and `asset.changes_requested` variants. If not yet added, update the union in `src/db/schema.ts`:
>
> ```typescript
> | { event: "asset.approved"; assetName: string; actorName: string; ipAddress?: string }
> | { event: "asset.changes_requested"; assetName: string; actorName: string; ipAddress?: string }
> ```

```typescript
// src/features/portal/server/actions.ts  (full replacement)
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  assets,
  clients,
  projects,
  activityLogs,
  organizations,
  type ActivityEventMetadata,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import {
  dispatchNotification,
  renderAssetStatusEmailHtml,
  resolveNotificationRecipients,
} from "@/lib/notifications/server";

const updateAssetStatusSchema = z.object({
  assetId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(["approved", "changes_requested"]),
});

export async function updateAssetStatusAction(
  rawInput: z.infer<typeof updateAssetStatusSchema>,
) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  // ── 2. RLS-scoped DB client (PRD §10.2) ────────────────────────────────
  // ✅ All DB access uses getSessionContext → createDrizzleClient factory.
  // No bare `db` import — RLS enforces org_id isolation automatically.
  const sessionCtx = await getSessionContext();
  const db = await createDrizzleClient(sessionCtx);

  // ── 3. Resolve client (server-side — never trust caller) ─────────────────
  const client = await db.query.clients.findFirst({
    where: eq(clients.userId, user.id),
  });
  if (!client) return { error: "Access denied." };

  // ── 4. Validate input ─────────────────────────────────────────────────────
  const parsed = updateAssetStatusSchema.safeParse(rawInput);
  if (!parsed.success) return { error: "Invalid input." };
  const { assetId, projectId, status } = parsed.data;

  // ── 5. Confirm project belongs to THIS client ─────────────────────────────
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.clientId, client.id),
      eq(projects.orgId, client.orgId),
    ),
    columns: { id: true, name: true, orgId: true },
  });
  if (!project) return { error: "Access denied." };

  // ── 6. Fetch asset ────────────────────────────────────────────────────────
  const asset = await db.query.assets.findFirst({
    where: and(eq(assets.id, assetId), eq(assets.projectId, projectId)),
    columns: { id: true, name: true, approvalStatus: true },
  });
  if (!asset) return { error: "Asset not found." };

  if (asset.approvalStatus === "approved" && status === "approved") {
    return { error: "This asset is already approved." };
  }

  // ── 7. Capture IP address (PRD §6.4 — Digital Signature) ─────────────────
  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // ── 8. Persist + log (atomic transaction) ─────────────────────────────────
  // Metadata uses the ActivityEventMetadata discriminated union (PRD §11).
  // The `event` discriminant enables type-safe access in consumers.
  const eventType =
    status === "approved" ? "file_approved" : "changes_requested";
  const metadata: ActivityEventMetadata =
    status === "approved"
      ? {
          event: "asset.approved",
          assetName: asset.name,
          actorName: client.contactName ?? "Client",
          ipAddress,
        }
      : {
          event: "asset.changes_requested",
          assetName: asset.name,
          actorName: client.contactName ?? "Client",
          ipAddress,
        };

  await db.transaction(async (tx) => {
    await tx
      .update(assets)
      .set({ approvalStatus: status })
      .where(eq(assets.id, assetId));

    await tx.insert(activityLogs).values({
      projectId,
      orgId: client.orgId,
      actorId: user.id,
      eventType,
      metadata,
    });
  });
  // ── Transaction committed ──────────────────────────────────────────────────

  // ── 9. Dispatch notification via Inngest (PRD §6.8) ──────────────────────
  //
  // Inngest event dispatch is a single lightweight HTTP call (~50ms).
  // The Inngest function (Step 3B) handles:
  //   - 5-minute merge window (spam prevention)
  //   - DB notification insert
  //   - Resend email delivery
  //   - Automatic retries on failure
  //
  // This completely unblocks the main thread — no inline email sending.
  try {
    const recipients = await resolveNotificationRecipients(
      client.orgId,
      projectId,
      assetId,
      user.id,
    );

    if (recipients.length > 0) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, client.orgId),
        columns: { name: true, logoUrl: true },
      });

      const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/files`;
      const isApproved = status === "approved";

      const emailHtml = await renderAssetStatusEmailHtml({
        status,
        clientName: client.contactName ?? "Client",
        assetName: asset.name,
        projectName: project.name,
        orgName: org?.name ?? "Your Organization",
        orgLogoUrl: org?.logoUrl ?? undefined,
        reviewUrl,
      });

      // Dispatch one Inngest event per recipient.
      // Inngest handles deduplication via the idempotency key.
      await Promise.all(
        recipients.map((recipientUserId) =>
          dispatchNotification({
            idempotencyKey: `${client.orgId}:${projectId}:${eventType}:${recipientUserId}`,
            recipientUserId,
            orgId: client.orgId,
            type: isApproved ? "file_approved" : "changes_requested",
            title: isApproved
              ? `✅ ${client.contactName} approved ${asset.name}`
              : `⚠️ ${client.contactName} requested changes on ${asset.name}`,
            body: `In project: ${project.name}`,
            link: reviewUrl,
            emailSubject: isApproved
              ? `File approved: ${asset.name} — ${project.name}`
              : `Changes requested: ${asset.name} — ${project.name}`,
            emailHtml,
          }),
        ),
      );
    }
  } catch (err) {
    // Swallow: notification failure must never surface as a client-facing error.
    // The activity log (written above in the transaction) is the source of truth.
    console.error("[updateAssetStatusAction] Inngest dispatch failed:", err);
  }

  revalidatePath(`/portal/projects/${projectId}/files`);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard`);

  return { success: true };
}
```

---

### Step 5 — tRPC: Activity Router

```typescript
// src/server/routers/activity.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
// ✅ No bare `db` import — all DB access uses ctx.db from the
// protectedProcedure context, which is RLS-scoped via createDrizzleClient.
import { activityLogs, notifications } from "@/db/schema";
import { and, eq, desc, lt } from "drizzle-orm";

export const activityRouter = router({
  /**
   * Paginated activity feed for a single project.
   * Admin view — all event types included.
   */
  byProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
        /** ISO datetime string — cursor for pagination */
        cursor: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId, limit, cursor } = input;
      const rows = await ctx.db.query.activityLogs.findMany({
        where: and(
          eq(activityLogs.projectId, projectId),
          cursor ? lt(activityLogs.createdAt, new Date(cursor)) : undefined,
        ),
        orderBy: [desc(activityLogs.createdAt)],
        limit: limit + 1,
        with: {
          actor: {
            // Include `role` so the UI can badge Client actions correctly
            // regardless of which event type string is used (fixes edge case
            // where an admin approves a file — event type alone is ambiguous).
            //
            // Phase 2 optimization: For massive timelines (10k+ rows), cache
            // client IDs per project rather than joining the users table on
            // every row. Since activityLogs already stores actorId, and client
            // IDs are limited per project, a pre-fetched Set<string> lookup
            // would eliminate the N-row join overhead.
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
              email: true,
              role: true,
            },
          },
        },
      });
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      return {
        items,
        nextCursor: hasMore
          ? items[items.length - 1]?.createdAt.toISOString()
          : undefined,
      };
    }),

  /**
   * Global feed for the admin dashboard home.
   * Returns last N events across ALL projects in the org.
   */
  dashboard: protectedProcedure
    .input(
      z.object({
        orgId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.activityLogs.findMany({
        where: eq(activityLogs.orgId, input.orgId),
        orderBy: [desc(activityLogs.createdAt)],
        limit: input.limit,
        with: {
          actor: {
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
              email: true,
              role: true,
            },
          },
          project: { columns: { id: true, name: true } },
        },
      });
    }),

  /** Unread count for the bell-icon badge */
  unreadCount: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, input.userId),
            eq(notifications.read, false),
          ),
        )
        .limit(99);
      return { count: rows.length };
    }),

  /** Mark a single notification as read */
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.session.user.id),
          ),
        );
      return { success: true };
    }),

  /** Mark ALL notifications as read for the current user */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id),
          eq(notifications.read, false),
        ),
      );
    return { success: true };
  }),
});
```

Register in `src/server/routers/_app.ts`:

```typescript
import { activityRouter } from "./activity";

export const appRouter = router({
  // … existing routers …
  activity: activityRouter,
});
```

---

### Step 6 — Drizzle Relations

Add to `src/db/schema.ts` if not already present — required for the tRPC `with:` joins:

```typescript
// src/db/schema.ts  (relations section — add these)
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
```

---

### Step 7 — UI Component: `ActivityTimeline.tsx`

Groups events by date, shows actor avatars, and labels Client-sourced events with a "Client" badge.

```tsx
// src/features/activity/components/ActivityTimeline.tsx
"use client";

import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RouterOutputs } from "@/lib/trpc/client";
import type { ActivityEventMetadata } from "@/db/schema";

type ActivityRow = RouterOutputs["activity"]["byProject"]["items"][number];
type DashboardRow = RouterOutputs["activity"]["dashboard"][number];

type AnyRow = ActivityRow | DashboardRow;

interface ActivityTimelineProps {
  items: AnyRow[];
  /** Show project name — use on the dashboard home (multi-project view) */
  showProject?: boolean;
  maxHeight?: string;
}

// ── Human-readable label via discriminated union (PRD §11) ─────────────────────
// Uses the `event` discriminant on ActivityEventMetadata for type-safe access.
// No `as string` casts needed — the union provides compile-time type safety.
function getEventLabel(
  eventType: string,
  metadata: ActivityEventMetadata,
): string {
  switch (metadata.event) {
    case "project.created":
      return `created project ${metadata.projectName}`;
    case "project.status_changed":
      return `changed status from ${metadata.from} to ${metadata.to}`;
    case "asset.uploaded":
      return `uploaded ${metadata.assetName}`;
    case "asset.approved":
      return `approved ${metadata.assetName}`;
    case "asset.changes_requested":
      return `requested changes on ${metadata.assetName}`;
    case "invoice.sent":
      return `created invoice #${metadata.invoiceNumber}`;
    case "invoice.paid":
      return `marked invoice #${metadata.invoiceNumber} as paid`;
    case "comment.created":
      return `left a comment`;
    case "client.invited":
      return `invited ${metadata.email}`;
    case "milestone.completed":
      return `completed milestone: ${metadata.title}`;
    default:
      return eventType.replace(/_/g, " ");
  }
}

// ── Badge logic ────────────────────────────────────────────────────────────
// We use actor.role === 'client' rather than checking the event type string.
//
// WHY: An admin CAN approve a file (e.g., correcting a mistake). In that case
// the event type is still "file_approved" but the actor is an admin — showing
// a "Client" badge would be incorrect. Role from the joined actor row is the
// authoritative signal; it is always populated because actorId is non-nullable.
function isClientActor(row: AnyRow): boolean {
  return (row.actor as { role?: string } | null)?.role === "client";
}

function groupLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export function ActivityTimeline({
  items,
  showProject = false,
  maxHeight = "420px",
}: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No activity yet — events will appear here as work progresses.
      </p>
    );
  }

  // Group by calendar day
  const groups = items.reduce<Map<string, AnyRow[]>>((acc, row) => {
    const key = startOfDay(new Date(row.createdAt)).toISOString();
    acc.set(key, [...(acc.get(key) ?? []), row]);
    return acc;
  }, new Map());

  return (
    <ScrollArea style={{ maxHeight }} className="pr-3">
      <ol className="space-y-6">
        {[...groups.entries()].map(([dayKey, dayItems]) => (
          <li key={dayKey}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {groupLabel(new Date(dayKey))}
            </p>
            <ol className="space-y-3">
              {dayItems.map((item) => {
                // ActivityEventMetadata discriminated union — no unsafe casts.
                const metadata = item.metadata as ActivityEventMetadata;
                const label = getEventLabel(item.eventType, metadata);
                const actorName =
                  item.actor?.name ?? item.actor?.email ?? "System";
                const initials = actorName
                  .split(" ")
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase();
                const project = (item as DashboardRow).project ?? null;

                return (
                  <li key={item.id} className="flex items-start gap-3">
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0 text-xs">
                      <AvatarImage
                        src={item.actor?.avatarUrl ?? undefined}
                        alt={actorName}
                      />
                      <AvatarFallback className="text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-foreground">
                        <span className="font-medium">{actorName}</span> {label}
                        {showProject && project && (
                          <span className="text-muted-foreground">
                            {" "}
                            in{" "}
                            <a
                              href={`/dashboard/projects/${project.id}`}
                              className="underline underline-offset-2 hover:text-foreground"
                            >
                              {project.name}
                            </a>
                          </span>
                        )}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <time className="text-[11px] text-muted-foreground">
                          {format(new Date(item.createdAt), "h:mm a")}
                        </time>
                        {isClientActor(item) && (
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            Client
                          </Badge>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </ScrollArea>
  );
}
```

---

### Step 8 — Dashboard Integration

#### 8a — Project Detail Page

```tsx
// src/app/(dashboard)/projects/[id]/page.tsx  (additions at the bottom of the component)
import { ActivityTimeline } from "@/features/activity/components/ActivityTimeline";

// Add to the parallel Promise.all at the top of the page component:
const [project, activityData] = await Promise.all([
  api.projects.byId({ projectId: params.id }),
  api.activity.byProject({ projectId: params.id, limit: 50 }),
]);

// Add this section to the JSX:
<section aria-labelledby="activity-heading" className="mt-10">
  <h2 id="activity-heading" className="mb-4 text-lg font-semibold">
    Activity
  </h2>
  <ActivityTimeline items={activityData.items} maxHeight="500px" />
</section>;
```

#### 8b — Admin Dashboard Home

```tsx
// src/app/(dashboard)/page.tsx  (additions)
import { ActivityTimeline } from "@/features/activity/components/ActivityTimeline";

// Add to the parallel Promise.all:
const dashboardActivity = await api.activity.dashboard({ orgId, limit: 20 });

// Add this section to the JSX (alongside existing overview cards):
<section aria-labelledby="recent-activity-heading" className="mt-8">
  <div className="mb-4 flex items-center justify-between">
    <h2 id="recent-activity-heading" className="text-lg font-semibold">
      Recent Activity
    </h2>
    <span className="text-xs text-muted-foreground">
      Last 20 events across all projects
    </span>
  </div>
  <ActivityTimeline items={dashboardActivity} showProject maxHeight="360px" />
</section>;
```

---

### Step 9 — Email Preview Fixtures

```tsx
// src/emails/previews/AssetStatusEmail.preview.tsx
import { AssetStatusEmail } from "../AssetStatusEmail";

export const ApprovedPreview = () => (
  <AssetStatusEmail
    status="approved"
    clientName="Alex Johnson"
    assetName="Logo-v2.png"
    projectName="Acme Website Redesign"
    orgName="Pixel Studio"
    reviewUrl="http://localhost:3000/dashboard/projects/fake-id/files"
  />
);

export const ChangesRequestedPreview = () => (
  <AssetStatusEmail
    status="changes_requested"
    clientName="Alex Johnson"
    assetName="Homepage-Draft.pdf"
    projectName="Acme Website Redesign"
    orgName="Pixel Studio"
    reviewUrl="http://localhost:3000/dashboard/projects/fake-id/files"
  />
);

export default ApprovedPreview;
```

Open `http://localhost:3030` after running `npx react-email dev --dir src/emails --port 3030` to verify both states render correctly.

---

## Validation Checklist

Complete **in order**. Every item must pass before marking this task done.

### Pre-flight

- [ ] `npm install resend @react-email/components react-email inngest` ran without errors
- [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`, `INNGEST_EVENT_KEY`, and `INNGEST_SIGNING_KEY` are set in `.env.local`
- [ ] `npm run dev` starts with zero TypeScript errors
- [ ] `npx react-email dev --dir src/emails --port 3030` renders both `AssetStatusEmail` variants at `localhost:3030`

### Database

- [ ] `notifications` table schema matches: `id, user_id, org_id, type, title, body, read, link, created_at`
- [ ] `activityLogsRelations` declared in `src/db/schema.ts` with `actor` and `project` joins
- [ ] `notificationsRelations` declared with `user` join
- [ ] `drizzle-kit push` (or `db:migrate`) completes with no errors

### Core approval → notification loop

1. Log in as an **Admin** (project owner).
2. Create a project and upload a file. Confirm status is **"Pending Review"** on `/dashboard/projects/[id]/files`.
3. Open an **incognito window** and log in as the assigned **Client**.
4. Navigate to `/portal/projects/[id]/files` and click **"Approve"**.
5. Switch back to the Admin session:
   - [ ] `/dashboard/projects/[id]` — Activity Timeline shows **"[ClientName] approved [AssetName]"** with a **"Client"** badge.
   - [ ] `/dashboard` — Global Recent Activity shows the same event with the project name.
   - [ ] `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;` — new rows exist with `type = 'file_approved'`, `read = false`, correct `user_id`s (assigned project members).
   - [ ] `SELECT metadata->>'ipAddress' FROM activity_logs ORDER BY created_at DESC LIMIT 1;` — returns the client's IP address (not `"unknown"`).
   - [ ] `SELECT metadata->>'event' FROM activity_logs ORDER BY created_at DESC LIMIT 1;` — returns `"asset.approved"` (discriminated union event).
6. Check the assigned member's inbox (or Resend dashboard at `https://resend.com/emails`) — email received with subject `"File approved: [AssetName] — [ProjectName]"`.
7. Verify Inngest dashboard (`localhost:8288` in dev) shows the `notification/asset-status` function executed successfully.

### "Changes Requested" variant

- [ ] Repeat steps 3–6 above clicking **"Request Changes"** instead.
- [ ] Timeline entry: **"[ClientName] requested changes on [AssetName]"**.
- [ ] Email subject contains **"Changes requested:"**.
- [ ] `notifications.type` is `"changes_requested"`.

### Data integrity / email resilience

- [ ] Temporarily set `RESEND_API_KEY=invalid` and repeat the approval.
  - `assets.approval_status` **is updated** in DB ✓
  - `activity_logs` row **is inserted** with `metadata.ipAddress` ✓
  - `notifications` row **is inserted** (via Inngest background function) ✓
  - Inngest dashboard shows the email step failed with a non-fatal error ✓
  - Client Portal shows updated status badge ✓
- [ ] Restore the valid `RESEND_API_KEY`.

### Notification targeting (assigned members)

- [ ] Assign **two team members** to a project and have a client approve a file.
  - Both assigned members receive a notification row in `notifications` table.
  - The client (actor) does **NOT** receive a self-notification.
- [ ] Verify uploader notification: if Member A uploaded the file and Member B is assigned, both A and B get notified.
- [ ] `SELECT user_id FROM notifications WHERE type = 'file_approved' ORDER BY created_at DESC;` — should return all assigned member IDs, not the org owner ID.

### Inngest batching (5-minute merge window)

- [ ] Have a client rapidly approve 3 files in the same project within 30 seconds.
  - Only **one** notification email is sent per recipient (5-min idempotency window).
  - All 3 `activity_logs` rows are inserted immediately.

### RLS enforcement

- [ ] Run `grep -n 'from "@/db"' docs/tasks/11-approval-flow.md` in code blocks — **zero** matches.
- [ ] All DB access uses `createDrizzleClient` (server actions), `ctx.db` (tRPC), or background SYSTEM context.

### Unread badge

- [ ] On `/dashboard`, the bell-icon unread count badge matches `SELECT count(*) FROM notifications WHERE user_id = '[memberId]' AND read = false;`.
- [ ] Calling `api.activity.markAllRead` sets all rows to `read = true` and the badge clears.
