# Task 12 — Comments & Threaded Timeline

## Goal

Build the real-time collaboration engine that allows Admins and Clients to discuss assets directly in the portal. Comments are threaded (max 1 level of nesting per PRD), support editing (own comments only), and admin-only soft-delete/hide (PRD §6.6 — authors cannot delete their own comments to preserve the immutable audit trail). Comments support `@mentions` — mentioned users receive in-app notifications. Cross-party email notifications are dispatched via the `sendNotification` engine introduced in Task 11 (Admin → Client and Client → Admin).

This task implements **PRD Section 6.4 (Comments on Files)**.

---

## Description

The comment system lives as a slide-over panel (`FileCommentsSheet`) anchored to the File View page. When a user posts a comment, the UI applies an **optimistic update** via TanStack Query so the message appears instantly — no loading spinner. The comment is then persisted server-side via a Server Action, and the _other party_ receives an in-app notification and email (Admin comments → notify Client; Client comments → notify Admin/owner).

### Data model summary (`comments` table — already in schema)

| Column      | Type           | Notes                                              |
| :---------- | :------------- | :------------------------------------------------- |
| `id`        | `uuid`         | PK                                                 |
| `assetId`   | `uuid`         | FK → `assets.id`                                   |
| `authorId`  | `uuid`         | FK → `users.id`                                    |
| `body`      | `text`         | Required, max 4000 chars                           |
| `parentId`  | `uuid?`        | Self-referential FK; `null` = top-level thread     |
| `metadata`  | `jsonb?`       | Reserved — stores `{ x, y }` image pin coordinates |
| `editedAt`  | `timestamptz?` | Set on edit; `null` = never edited                 |
| `deletedAt` | `timestamptz?` | Soft-delete; `null` = active                       |
| `createdAt` | `timestamptz`  | Auto-set by DB default                             |

### Threading rules (PRD §6.4)

- Top-level comments have `parentId = null`.
- Replies have `parentId = <top-level comment id>`.
- **Replies to replies are not supported** — the UI hides the "Reply" button on any comment that is already a reply (`depth === 1`).
- The tRPC query returns a **flat list** ordered by `createdAt ASC`; threading is assembled client-side with a single pass.

### Notification targeting

| Actor  | Notifies                                                                  |
| :----- | :------------------------------------------------------------------------ |
| Admin  | The project's assigned Client (via `projects.clientId → clients → users`) |
| Client | The org owner (same `resolveProjectOwner` used in Task 11)                |

If the actor _is_ the recipient (edge case: admin is also the client record owner), the notification is skipped.

### Components delivered in this task

| Artifact            | Path                                                                | Purpose                                                           |
| :------------------ | :------------------------------------------------------------------ | :---------------------------------------------------------------- |
| Zod schemas         | `src/features/comments/schemas.ts`                                  | Input validation                                                  |
| Server Actions      | `src/features/comments/server/actions.ts`                           | `createCommentAction`, `editCommentAction`, `deleteCommentAction` |
| tRPC router         | `src/server/routers/comments.ts`                                    | `byAssetId` query                                                 |
| Email template      | `src/emails/NewCommentEmail.tsx`                                    | Transactional email                                               |
| `CommentThread`     | `src/features/comments/components/CommentThread.tsx`                | Renders nested comment list                                       |
| `CommentInput`      | `src/features/comments/components/CommentInput.tsx`                 | Compose & post form                                               |
| `CommentItem`       | `src/features/comments/components/CommentItem.tsx`                  | Single comment with edit/delete                                   |
| `FileCommentsSheet` | `src/features/comments/components/FileCommentsSheet.tsx`            | Slide-over panel host                                             |
| Page integration    | `src/app/(dashboard)/projects/[projectId]/files/[assetId]/page.tsx` | Embed the sheet                                                   |

---

## Tech Stack

| Concern            | Library / Pattern                                                                |
| :----------------- | :------------------------------------------------------------------------------- |
| DB mutations       | Drizzle ORM + Server Actions (`"use server"`)                                    |
| DB queries         | tRPC `protectedProcedure`                                                        |
| Optimistic updates | TanStack Query (`useMutation` + `onMutate` / `onError` rollback)                 |
| UI primitives      | `shadcn/ui` — `Sheet`, `Avatar`, `Textarea`, `DropdownMenu`, `Button`, `Tooltip` |
| Notifications      | `sendNotification` from `src/lib/notifications/server.tsx` (Task 11)             |
| Email template     | `@react-email/components` + `render`                                             |
| Date formatting    | `date-fns` (`formatDistanceToNow`, `format`)                                     |
| Input validation   | `zod`                                                                            |

---

## Instructions

### Step 1 — Zod Schemas

```typescript
// src/features/comments/schemas.ts
import { z } from "zod";

export const createCommentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment cannot be empty.")
    .max(4000, "Comment exceeds the 4,000-character limit."),
  assetId: z.string().uuid(),
  /** null → top-level comment; uuid → reply to that comment */
  parentId: z.string().uuid().nullable().default(null),
});

export const editCommentSchema = z.object({
  commentId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type EditCommentInput = z.infer<typeof editCommentSchema>;
```

---

### Step 2 — Email Template: `NewCommentEmail.tsx`

```tsx
// src/emails/NewCommentEmail.tsx
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

interface NewCommentEmailProps {
  authorName: string;
  commentBody: string;
  assetName: string;
  projectName: string;
  orgName: string;
  orgLogoUrl?: string;
  commentUrl: string;
}

export const NewCommentEmail = ({
  authorName,
  commentBody,
  assetName,
  projectName,
  orgName,
  orgLogoUrl,
  commentUrl,
}: NewCommentEmailProps) => (
  <Html>
    <Head />
    <Preview>
      💬 {authorName} commented on {assetName} in {projectName}
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={{ marginBottom: 24 }}>
          {orgLogoUrl ? (
            <Img src={orgLogoUrl} alt={orgName} height={36} />
          ) : (
            <Text style={styles.orgName}>{orgName}</Text>
          )}
        </Section>

        <Heading style={styles.h1}>New Comment 💬</Heading>

        <Text style={styles.meta}>
          <strong>{authorName}</strong> commented on{" "}
          <strong>{assetName}</strong> in <em>{projectName}</em>:
        </Text>

        {/* Quoted comment body */}
        <Section style={styles.quote}>
          <Text style={styles.quoteText}>{commentBody}</Text>
        </Section>

        <Section style={{ textAlign: "center" as const, marginTop: 28 }}>
          <Button href={commentUrl} style={styles.button}>
            View Comment
          </Button>
        </Section>

        <Hr style={styles.hr} />
        <Text style={styles.footer}>
          You&apos;re receiving this because you have an active project in{" "}
          {orgName} on ClientSpace.
        </Text>
      </Container>
    </Body>
  </Html>
);

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
  orgName: { fontSize: 20, fontWeight: "600", color: "#0f172a" },
  h1: { fontSize: 22, fontWeight: "700", margin: "0 0 12px", color: "#0f172a" },
  meta: { fontSize: 15, color: "#475569", lineHeight: "1.6" },
  quote: {
    borderLeft: "3px solid #6366f1",
    paddingLeft: 16,
    margin: "16px 0",
    backgroundColor: "#f1f5f9",
    borderRadius: "0 4px 4px 0",
    padding: "12px 16px",
  },
  quoteText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: "1.6",
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
  button: {
    backgroundColor: "#6366f1",
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

export default NewCommentEmail;
```

---

### Step 3 — Server Actions

```typescript
// src/features/comments/server/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { render } from "@react-email/render";
import { comments, assets, projects, clients, organizations, users } from "@/db/schema";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth/session";
import {
  sendNotification,
  resolveProjectOwner,
} from "@/lib/notifications/server";
import { NewCommentEmail } from "@/emails/NewCommentEmail";
import {
  createCommentSchema,
  editCommentSchema,
  deleteCommentSchema,
} from "../schemas";

// ─── Access guard ──────────────────────────────────────────────────────────────
//
// Verifies the calling user has access to the project that owns `assetId`.
// Returns { project, asset, userRole } on success, or throws with a message.
//
// Access rules:
//  - Admins: must belong to the org that owns the project.
//  - Clients: must be the assigned client on the project.
//
// ✅ All DB access uses getSessionContext → createDrizzleClient factory.

async function verifyAssetAccess(
  db: Awaited<ReturnType<typeof getSessionContext>>["db"],
  userId: string,
  assetId: string,
) {
  const asset = await db.query.assets.findFirst({
    where: and(eq(assets.id, assetId), isNull(assets.deletedAt)),
    columns: { id: true, name: true, projectId: true },
  });
  if (!asset) throw new Error("Asset not found.");

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, asset.projectId),
    with: {
      org: { columns: { id: true, name: true, logoUrl: true, ownerId: true } },
    },
  });
  if (!project) throw new Error("Project not found.");

  // Determine membership role
  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, role: true, email: true },
  });
  if (!userRow) throw new Error("User not found.");

  if (userRow.role === "admin" || userRow.role === "owner") {
    // Admin must belong to the project's org
    // (org-level membership is enforced via RLS; here we do a belt-and-suspenders check)
    if (project.orgId !== project.org?.id) throw new Error("Access denied.");
    return { asset, project, userRow, userRole: "admin" as const };
  }

  if (userRow.role === "client") {
    // Client must be the assigned client on the project
    const clientRow = await db.query.clients.findFirst({
      where: and(eq(clients.userId, userId), eq(clients.orgId, project.orgId)),
    });
    if (!clientRow || project.clientId !== clientRow.id) {
      throw new Error("Access denied.");
    }
    return { asset, project, userRow, userRole: "client" as const };
  }

  throw new Error("Access denied.");
}

// ─── @mentions parser ──────────────────────────────────────────────────────────
//
// PRD §6.6: "Supports @mentions — mentioned users receive in-app notification"

async function dispatchMentionNotifications({
  db,
  body,
  actorId,
  actorName,
  asset,
  orgId,
}: {
  db: Awaited<ReturnType<typeof getSessionContext>>["db"];
  body: string;
  actorId: string;
  actorName: string;
  asset: { id: string; name: string; projectId: string };
  orgId: string;
}) {
  const mentionPattern = /@(\w+(?:\s\w+)?)/g;
  const mentions = [...body.matchAll(mentionPattern)].map((m) => m[1]);
  if (mentions.length === 0) return;

  // Look up mentioned users by name (case-insensitive match via Drizzle)
  const mentionedUsers = await db.query.users.findMany({
    where: inArray(users.name, mentions),
    columns: { id: true, name: true },
  });

  const commentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${asset.projectId}/files/${asset.id}`;

  for (const mentioned of mentionedUsers) {
    if (mentioned.id === actorId) continue; // Don't self-notify
    try {
      await sendNotification({
        recipientUserId: mentioned.id,
        orgId,
        type: "comment_mention",
        title: `💬 ${actorName} mentioned you`,
        body: `In a comment on ${asset.name}`,
        link: commentUrl,
      });
    } catch (err) {
      console.error("[dispatchMentionNotifications] Non-fatal error:", err);
    }
  }
}

// ─── Notification dispatch ─────────────────────────────────────────────────────
//
// Bidirectional: Client → Admin/Owner AND Admin → Client

async function dispatchCommentNotification({
  db,
  actorId,
  actorName,
  actorRole,
  asset,
  project,
}: {
  db: Awaited<ReturnType<typeof getSessionContext>>["db"];
  actorId: string;
  actorName: string;
  actorRole: "admin" | "client";
  asset: { id: string; name: string; projectId: string };
  project: { id: string; name: string; orgId: string; org: { name: string; logoUrl?: string | null } };
}) {
  try {
    let recipientUserId: string | null = null;

    if (actorRole === "client") {
      // Client commented → notify org owner (Admin)
      const owner = await resolveProjectOwner(project.orgId);
      if (owner && owner.userId !== actorId) {
        recipientUserId = owner.userId;
      }
    } else {
      // Admin/Owner commented → notify the assigned client user
      const projectRow = await db.query.projects.findFirst({
        where: eq(projects.id, project.id),
        with: {
          client: {
            with: { user: { columns: { id: true, email: true } } },
          },
        },
      });

      let clientUserId = projectRow?.client?.userId ?? null;

      // Fallback: if the relation doesn't resolve, try looking up via clients table directly
      if (!clientUserId && projectRow?.clientId) {
        const fallbackClient = await db.query.clients.findFirst({
          where: eq(clients.id, projectRow.clientId),
          columns: { userId: true },
        });
        clientUserId = fallbackClient?.userId ?? null;
      }

      if (clientUserId && clientUserId !== actorId) {
        recipientUserId = clientUserId;
      }
    }

    if (!recipientUserId) return; // No valid cross-party recipient found

    const commentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${project.id}/files/${asset.id}`;

    const emailHtml = await render(
      <NewCommentEmail
        authorName={actorName}
        commentBody={"(see comment thread)"} // don't leak full body in email for privacy
        assetName={asset.name}
        projectName={project.name}
        orgName={project.org.name}
        orgLogoUrl={project.org.logoUrl ?? undefined}
        commentUrl={commentUrl}
      />,
    );

    await sendNotification({
      recipientUserId,
      orgId: project.orgId,
      type: "comment_added",
      title: `💬 ${actorName} commented on ${asset.name}`,
      body: `In project: ${project.name}`,
      link: commentUrl,
      email: {
        subject: `New comment on ${asset.name} — ${project.name}`,
        html: emailHtml,
      },
    });
  } catch (err) {
    // Notification failure must never bubble up as a user-facing error.
    console.error("[dispatchCommentNotification] Non-fatal error:", err);
  }
}

// ─── createCommentAction ───────────────────────────────────────────────────────

export async function createCommentAction(
  rawInput: z.infer<typeof createCommentSchema>,
) {
  // ✅ All DB access uses getSessionContext → createDrizzleClient factory.
  const ctx = await getSessionContext();
  const { user, db } = ctx;
  if (!user) return { error: "Unauthorized." };

  const parsed = createCommentSchema.safeParse(rawInput);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { body, assetId, parentId } = parsed.data;

  let access;
  try {
    access = await verifyAssetAccess(db, user.id, assetId);
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Access denied." };
  }

  // If this is a reply, ensure the parent exists, belongs to the same asset,
  // and is itself a top-level comment (enforce max 1 level depth).
  if (parentId) {
    const parent = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, parentId),
        eq(comments.assetId, assetId),
        isNull(comments.parentId),    // parent must be top-level
        isNull(comments.deletedAt),
      ),
    });
    if (!parent)
      return {
        error:
          "You cannot reply to a reply. Please reply to the main thread instead.",
      };
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      assetId,
      authorId: user.id,
      body,
      parentId: parentId ?? null,
    })
    .returning();

  // Fire cross-party notification (awaited for serverless safety — see Task 11 notes)
  await dispatchCommentNotification({
    db,
    actorId: user.id,
    actorName: access.userRow.name ?? user.email ?? "Someone",
    actorRole: access.userRole,
    asset: { ...access.asset, projectId: access.asset.projectId },
    project: access.project as Parameters<typeof dispatchCommentNotification>[0]["project"],
  });

  // PRD §6.6: Dispatch @mention notifications
  await dispatchMentionNotifications({
    db,
    body,
    actorId: user.id,
    actorName: access.userRow.name ?? user.email ?? "Someone",
    asset: { ...access.asset, projectId: access.asset.projectId },
    orgId: access.project.orgId,
  });

  revalidatePath(
    `/dashboard/projects/${access.asset.projectId}/files/${assetId}`,
  );

  return { success: true, commentId: newComment.id };
}

// ─── editCommentAction ─────────────────────────────────────────────────────────

export async function editCommentAction(
  rawInput: z.infer<typeof editCommentSchema>,
) {
  // ✅ All DB access uses getSessionContext → createDrizzleClient factory.
  const ctx = await getSessionContext();
  const { user, db } = ctx;
  if (!user) return { error: "Unauthorized." };

  const parsed = editCommentSchema.safeParse(rawInput);
  if (!parsed.success) return { error: "Invalid input." };
  const { commentId, body } = parsed.data;

  const existing = await db.query.comments.findFirst({
    where: and(eq(comments.id, commentId), isNull(comments.deletedAt)),
    columns: { id: true, authorId: true, assetId: true },
  });

  if (!existing) return { error: "Comment not found." };
  // Ownership check: only the author may edit
  if (existing.authorId !== user.id) return { error: "You can only edit your own comments." };

  await db
    .update(comments)
    .set({ body, editedAt: new Date() })
    .where(eq(comments.id, commentId));

  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, existing.assetId),
    columns: { projectId: true },
  });

  revalidatePath(
    `/dashboard/projects/${asset?.projectId}/files/${existing.assetId}`,
  );

  return { success: true };
}

// ─── deleteCommentAction (Admin/Owner soft-delete only) ────────────────────────
//
// PRD §6.6: "Comments are NOT deletable by the author (preserves audit trail
// integrity). Admins can hide inappropriate comments (soft-delete with
// placeholder)."

export async function deleteCommentAction(
  rawInput: z.infer<typeof deleteCommentSchema>,
) {
  // ✅ All DB access uses getSessionContext → createDrizzleClient factory.
  const ctx = await getSessionContext();
  const { user, db } = ctx;
  if (!user) return { error: "Unauthorized." };

  const parsed = deleteCommentSchema.safeParse(rawInput);
  if (!parsed.success) return { error: "Invalid input." };
  const { commentId } = parsed.data;

  const existing = await db.query.comments.findFirst({
    where: and(eq(comments.id, commentId), isNull(comments.deletedAt)),
    columns: { id: true, authorId: true, assetId: true },
  });

  if (!existing) return { error: "Comment not found." };

  // PRD §6.6: Authors CANNOT delete their own comments (audit trail).
  // Only admin/owner roles may soft-delete (hide) inappropriate comments.
  const userRow = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  if (!userRow || (userRow.role !== "admin" && userRow.role !== "owner")) {
    return { error: "Only admins can hide comments." };
  }

  // Soft-delete so child replies remain coherent (they reference parentId)
  await db
    .update(comments)
    .set({ deletedAt: new Date() })
    .where(eq(comments.id, commentId));

  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, existing.assetId),
    columns: { projectId: true },
  });

  revalidatePath(
    `/dashboard/projects/${asset?.projectId}/files/${existing.assetId}`,
  );

  return { success: true };
}
```

---

### Step 4 — tRPC Router: `comments.ts`

```typescript
// src/server/routers/comments.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { comments } from "@/db/schema";
import { and, eq, isNull, asc } from "drizzle-orm";

export const commentsRouter = router({
  /**
   * Returns a flat, date-ordered list of NON-deleted comments for an asset.
   * Threading is assembled on the client with a single O(n) pass.
   *
   * Soft-deleted top-level comments are included as tombstones so their
   * replies remain visible in the thread. Their `body` is replaced with
   * "[deleted]" by the query so callers don't need to handle it specially.
   *
   * ✅ Uses ctx.db from protectedProcedure — RLS-scoped via createDrizzleClient.
   */
  byAssetId: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.comments.findMany({
        where: and(
          eq(comments.assetId, input.assetId),
          // Include soft-deleted top-level comments (tombstones) only if
          // they have replies — handled on client. For simplicity, fetch
          // all and filter client-side. You may add a sub-query here later.
        ),
        orderBy: [asc(comments.createdAt)],
        with: {
          author: {
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

      // Mask soft-deleted comment body server-side
      return rows.map((r) => ({
        ...r,
        body: r.deletedAt ? "[deleted]" : r.body,
        isDeleted: !!r.deletedAt,
      }));
    }),
});
```

Register in `src/server/routers/_app.ts`:

```typescript
import { commentsRouter } from "./comments";

export const appRouter = router({
  // … existing routers …
  comments: commentsRouter,
});
```

Add Drizzle relations to `src/db/schema.ts` if not present:

```typescript
export const commentsRelations = relations(comments, ({ one, many }) => ({
  asset: one(assets, { fields: [comments.assetId], references: [assets.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
}));
```

---

### Step 5 — UI: `CommentItem.tsx`

```tsx
// src/features/comments/components/CommentItem.tsx
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Pencil, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { editCommentAction } from "../server/actions";
import type { RouterOutputs } from "@/lib/trpc/client";

type CommentRow = RouterOutputs["comments"]["byAssetId"][number];

interface CommentItemProps {
  comment: CommentRow;
  currentUserId: string;
  /** Current user's role — needed to gate "Hide" action (admin/owner only) */
  currentUserRole: "admin" | "owner" | "client" | "member";
  /** depth === 0: top-level; depth === 1: reply. Reply button hidden at depth 1. */
  depth?: number;
  onReply?: (parentId: string) => void;
  /** Called when admin hides a comment — triggers optimistic update in parent */
  onHide?: (commentId: string) => void;
}

export function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
  depth = 0,
  onReply,
  onHide,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [isPending, setIsPending] = useState(false);

  const isOwn = comment.author?.id === currentUserId;
  const isDeleted = comment.isDeleted;
  const isClient = comment.author?.role === "client";
  // PRD §6.6: Only admin/owner can hide (soft-delete) comments
  const isAdmin = currentUserRole === "admin" || currentUserRole === "owner";

  async function handleSaveEdit() {
    if (!editBody.trim() || editBody === comment.body) {
      setIsEditing(false);
      return;
    }
    setIsPending(true);
    const result = await editCommentAction({
      commentId: comment.id,
      body: editBody.trim(),
    });
    setIsPending(false);
    if (result?.error) {
      // Surface inline — no toast import needed for this minimal example
      alert(result.error);
    } else {
      setIsEditing(false);
    }
  }

  async function handleHide() {
    if (
      !confirm(
        "Hide this comment? It will be replaced with a [deleted] placeholder.",
      )
    )
      return;
    // Optimistic: notify parent before awaiting server
    onHide?.(comment.id);
  }

  const initials = (comment.author?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex gap-3 ${depth === 1 ? "ml-10 mt-2" : "mt-4"}`}>
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarImage src={comment.author?.avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground leading-none">
            {comment.author?.name ?? "Unknown"}
          </span>
          {isClient && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              Client
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
          {comment.editedAt && !isDeleted && (
            <span className="text-[10px] text-muted-foreground italic">
              (edited)
            </span>
          )}
        </div>

        {/* Body / edit form */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="min-h-[60px] text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isPending || !editBody.trim()}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditBody(comment.body);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isDeleted ? "text-muted-foreground italic" : "text-foreground"
            }`}
          >
            {comment.body}
          </p>
        )}

        {/* Actions row */}
        {!isEditing && !isDeleted && (
          <div className="flex items-center gap-1 mt-1.5">
            {/* Reply button only on top-level comments (depth === 0) */}
            {depth === 0 && onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onReply(comment.id)}
              >
                Reply
              </Button>
            )}

            {/* Edit (own comments) / Hide (admin/owner only — PRD §6.6) */}
            {(isOwn || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span className="sr-only">Comment options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  {/* Edit — only the author can edit their own comment */}
                  {isOwn && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {/* Hide — only admin/owner can soft-delete (PRD §6.6 audit trail) */}
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={handleHide}
                      className="text-destructive focus:text-destructive"
                    >
                      <EyeOff className="mr-2 h-3.5 w-3.5" />
                      Hide
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Step 6 — UI: `CommentInput.tsx`

```tsx
// src/features/comments/components/CommentInput.tsx
"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";

interface CommentInputProps {
  assetId: string;
  parentId?: string | null;
  /**
   * Called with the optimistic temporary comment immediately after the user
   * clicks Post — before the server responds. The parent's `useMutation`
   * handles rollback if the server errors.
   */
  onSubmit: (body: string, parentId?: string | null) => void;
  onCancelReply?: () => void;
  replyingToName?: string;
  disabled?: boolean;
}

export function CommentInput({
  parentId = null,
  onSubmit,
  onCancelReply,
  replyingToName,
  disabled,
}: CommentInputProps) {
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handlePost() {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed, parentId);
    setBody("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl+Enter submits
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  }

  return (
    <div className="space-y-2">
      {/* Reply context banner */}
      {replyingToName && (
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <span>
            Replying to <strong>{replyingToName}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            replyingToName
              ? `Reply to ${replyingToName}…`
              : "Add a comment… (⌘↵ to send)"
          }
          className="min-h-[72px] resize-none text-sm flex-1"
          disabled={disabled}
        />
        <Button
          size="sm"
          onClick={handlePost}
          disabled={disabled || !body.trim()}
          className="shrink-0 self-end"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Post
        </Button>
      </div>
    </div>
  );
}
```

---

### Step 7 — UI: `CommentThread.tsx`

This component assembles the flat tRPC list into a nested structure (max-depth 1) and wires the optimistic mutation.

```tsx
// src/features/comments/components/CommentThread.tsx
//
// ⚠️ Mount behaviour: This component is rendered inside the FileCommentsSheet.
// The Sheet mounts CommentThread when it first opens (shadcn/ui default).
// The `isLoading` state intentionally handles the initial fetch on open —
// this is acceptable UX for a side panel. If you need prefetching, call
// `queryClient.prefetchQuery(trpc.comments.byAssetId.queryOptions({ assetId }))`
// in the parent page before the Sheet is opened.
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { createCommentAction, deleteCommentAction } from "../server/actions";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import type { RouterOutputs } from "@/lib/trpc/client";

type FlatComment = RouterOutputs["comments"]["byAssetId"][number];

interface ThreadedComment extends FlatComment {
  replies: FlatComment[];
}

/** O(n) pass: group replies under their parent. */
function buildThreads(flat: FlatComment[]): ThreadedComment[] {
  const map = new Map<string, ThreadedComment>();
  const roots: ThreadedComment[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of flat) {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(c);
    } else {
      roots.push(map.get(c.id)!);
    }
  }

  return roots;
}

interface CommentThreadProps {
  assetId: string;
  currentUserId: string;
  /** Current user's role — passed through to CommentItem for action gating */
  currentUserRole: "admin" | "owner" | "client" | "member";
}

export function CommentThread({
  assetId,
  currentUserId,
  currentUserRole,
}: CommentThreadProps) {
  const queryClient = useQueryClient();
  const queryKey = getQueryKey(trpc.comments.byAssetId, { assetId }, "query");

  const { data: flatComments = [], isLoading } =
    trpc.comments.byAssetId.useQuery({ assetId });

  // Auto-scroll: keep the latest comment in view whenever the list grows.
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (flatComments.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [flatComments.length]);

  const [replyTo, setReplyTo] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ── Optimistic create mutation ───────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async ({
      body,
      parentId,
    }: {
      body: string;
      parentId?: string | null;
    }) => {
      const result = await createCommentAction({ body, assetId, parentId });
      if (result?.error) throw new Error(result.error);
      return result;
    },

    // 1. Snapshot current data
    onMutate: async ({ body, parentId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FlatComment[]>(queryKey);

      // Inject optimistic comment
      const optimistic: FlatComment = {
        id: `optimistic-${Date.now()}`,
        assetId,
        authorId: currentUserId,
        body,
        parentId: parentId ?? null,
        editedAt: null,
        deletedAt: null,
        isDeleted: false,
        createdAt: new Date(),
        author: {
          id: currentUserId,
          name: "You",
          avatarUrl: null,
          email: "",
          role: "admin", // will be corrected on refetch
        },
      };

      queryClient.setQueryData<FlatComment[]>(queryKey, (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous };
    },

    // 2. Rollback on error
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to post comment.");
    },

    // 3. Always invalidate to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Optimistic hide mutation (admin-only soft-delete with proper rollback) ──
  const hideMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await deleteCommentAction({ commentId });
      if (result?.error) throw new Error(result.error);
      return result;
    },

    // 1. Snapshot and optimistically remove from view
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FlatComment[]>(queryKey);

      queryClient.setQueryData<FlatComment[]>(queryKey, (old = []) =>
        old.map((c) =>
          c.id === commentId
            ? {
                ...c,
                body: "[deleted]",
                isDeleted: true,
                deletedAt: new Date(),
              }
            : c,
        ),
      );

      return { previous };
    },

    // 2. Rollback on error — restores the comment
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to hide comment.");
    },

    // 3. Always invalidate to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  function handleHide(commentId: string) {
    hideMutation.mutate(commentId);
  }

  const handleSubmit = useCallback(
    (body: string, parentId?: string | null) => {
      createMutation.mutate({ body, parentId });
      setReplyTo(null);
    },
    [createMutation],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Loading comments…
      </div>
    );
  }

  const threads = buildThreads(flatComments);
  const isEmpty = threads.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable thread area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground gap-2">
            <span className="text-2xl">💬</span>
            <p>No comments yet.</p>
            <p className="text-xs">Be the first to start the conversation.</p>
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id}>
              <CommentItem
                comment={thread}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                depth={0}
                onReply={(id) =>
                  setReplyTo({ id, name: thread.author?.name ?? "them" })
                }
                onHide={handleHide}
              />
              {/* Render replies (depth 1 — no further nesting) */}
              {thread.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  depth={1}
                  onHide={handleHide}
                  // No onReply prop at depth 1 — button is hidden
                />
              ))}
            </div>
          ))
        )}
        {/* Scroll anchor — placed OUTSIDE the thread map, at the very bottom */}
        <div ref={bottomRef} />
      </div>

      {/* Pinned input area */}
      <div className="border-t px-4 pt-3 pb-4 bg-background">
        <CommentInput
          assetId={assetId}
          parentId={replyTo?.id ?? null}
          replyingToName={replyTo?.name}
          onSubmit={handleSubmit}
          onCancelReply={() => setReplyTo(null)}
          disabled={createMutation.isPending}
        />
      </div>
    </div>
  );
}
```

---

### Step 8 — UI: `FileCommentsSheet.tsx`

```tsx
// src/features/comments/components/FileCommentsSheet.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { MessageSquare } from "lucide-react";
import { CommentThread } from "./CommentThread";

interface FileCommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
  currentUserId: string;
  currentUserRole: "admin" | "owner" | "client" | "member";
}

export function FileCommentsSheet({
  open,
  onOpenChange,
  assetId,
  assetName,
  currentUserId,
  currentUserRole,
}: FileCommentsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] sm:max-w-[420px] flex flex-col p-0 gap-0"
      >
        <SheetHeader className="border-b px-4 py-3 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Comments
          </SheetTitle>
          <SheetDescription className="text-xs truncate">
            {assetName}
          </SheetDescription>
        </SheetHeader>

        {/* CommentThread fills the remaining sheet height */}
        <div className="flex-1 min-h-0">
          <CommentThread
            assetId={assetId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

### Step 9 — Page Integration

Open (or create) the asset detail page and wire in the sheet:

```tsx
// src/app/(dashboard)/projects/[projectId]/files/[assetId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssetDetailView } from "@/features/files/components/AssetDetailView";
import { getSessionContext } from "@/lib/auth/session";
// (AssetDetailView already exists from Task 6 — we're extending it)

interface AssetPageProps {
  params: { projectId: string; assetId: string };
}

export default async function AssetPage({ params }: AssetPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve user role for comment action gating (PRD §6.6)
  const ctx = await getSessionContext();

  return (
    <AssetDetailView
      projectId={params.projectId}
      assetId={params.assetId}
      currentUserId={user.id}
      currentUserRole={ctx.role}
    />
  );
}
```

Then update `AssetDetailView` (or your existing file view component) to include a "Comments" trigger button:

```tsx
// Inside your existing AssetDetailView (sketch — adapt to your structure)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { FileCommentsSheet } from "@/features/comments/components/FileCommentsSheet";

export function AssetDetailView({
  projectId,
  assetId,
  assetName,
  currentUserId,
  currentUserRole,
}: {
  projectId: string;
  assetId: string;
  assetName: string;
  currentUserId: string;
  currentUserRole: "admin" | "owner" | "client" | "member";
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <div className="relative h-full">
      {/* … existing file preview / approval actions … */}

      {/* Floating comments trigger */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-6 right-6 shadow-lg gap-2 z-10"
        onClick={() => setCommentsOpen(true)}
      >
        <MessageSquare className="h-4 w-4" />
        Comments
      </Button>

      <FileCommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        assetId={assetId}
        assetName={assetName}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
```

---

### Step 10 — Register Drizzle Schema Relations

Ensure your `comments` table definition in `src/db/schema.ts` includes the `parentId` self-join and `deletedAt`/`editedAt` columns if not already present. Then run:

```bash
npx drizzle-kit generate   # generates SQL migration
npx drizzle-kit migrate    # applies to local DB
```

Verify with:

```bash
npx drizzle-kit studio
```

---

## Validation Checklist

Use this checklist to verify the full flow end-to-end.

### DB Schema

- [ ] `comments` table exists with columns: `id`, `asset_id`, `author_id`, `body`, `parent_id` (nullable), `metadata` (jsonb, nullable), `edited_at` (nullable), `deleted_at` (nullable), `created_at`
- [ ] `parent_id` has self-referential FK → `comments.id` with `ON DELETE SET NULL`
- [ ] Drizzle relation `commentsRelations` defined for joins

### RLS / Drizzle Factory (PRD §10.2)

- [ ] **No bare `db` imports:** Run `grep -rn 'from "@/db"' src/features/comments/ src/server/routers/comments.ts`. Zero results — all DB access uses `getSessionContext` (server actions) or `ctx.db` (tRPC).

### tRPC Query

- [ ] `trpc.comments.byAssetId({ assetId })` returns an array (no TypeScript errors)
- [ ] Soft-deleted comment bodies are masked to `"[deleted]"` in the response
- [ ] Replies (`parentId !== null`) are included in the same flat list
- [ ] tRPC query uses `ctx.db` from `protectedProcedure` (RLS-scoped)

### Optimistic Update (Critical UX)

- [ ] After clicking "Post", the comment appears **instantly** in the thread without a loading state
- [ ] Opening DevTools → Network — the comment is visible in the UI **before** the Server Action response arrives
- [ ] If the Server Action returns an error (simulate by temporarily returning `{ error: "test" }`), the optimistic comment **disappears** and the Textarea is not cleared
- [ ] If the hide action fails, the "[deleted]" placeholder **reverts** back to the original comment body

### Server Action: `createCommentAction`

- [ ] Posted comment persists to `comments` table (check in Drizzle Studio or Supabase dashboard)
- [ ] A Client posting a comment → notification row appears in `notifications` for the Admin/owner
- [ ] An Admin posting a comment → notification row appears in `notifications` for the assigned Client user
- [ ] A user posting on a project they don't own/aren't assigned to → returns `{ error: "Access denied." }`
- [ ] Reply with `parentId` pointing to another reply (depth > 1) → returns `{ error: "You cannot reply to a reply. Please reply to the main thread instead." }`

### @mentions (PRD §6.6)

- [ ] Posting a comment with `@JohnDoe` → a `comment_mention` notification is created for the user named "JohnDoe"
- [ ] Self-mention (mentioning yourself) → no notification is sent
- [ ] Mentioning a non-existent user → no error; simply no notification

### Email Notification (Bidirectional)

- [ ] Client posts first comment → check Resend dashboard: email delivered to Admin email address
- [ ] Admin replies → check Resend dashboard: email delivered to Client email address
- [ ] Actor is the same as the recipient (edge case) → NO email is sent (verify in Resend logs)

### Threading UI

- [ ] Top-level comments display a "Reply" button
- [ ] Replies (depth 1) do **not** show a "Reply" button
- [ ] Clicking "Reply" shows the context banner ("Replying to [Name]…") in the input area
- [ ] Submitting a reply renders it indented under the parent comment

### Edit / Hide (PRD §6.6 Immutable Audit Trail)

- [ ] Three-dot menu shows "Edit" **only** on the current user's own comments
- [ ] Three-dot menu shows "Hide" **only** if the current user is `admin` or `owner`
- [ ] Authors **cannot** see a "Delete" or "Hide" button (audit trail preserved)
- [ ] Editing a comment updates the body inline and shows "(edited)" timestamp
- [ ] Hiding a comment (admin): row soft-deleted in DB (`deleted_at` is set); UI shows `"[deleted]"` placeholder
- [ ] Attempting to call `deleteCommentAction` as a non-admin → returns `{ error: "Only admins can hide comments." }`
- [ ] Attempting to edit someone else's comment via the Server Action directly returns `{ error: "You can only edit your own comments." }`

### Sheet UX

- [ ] "Comments" button opens the slide-over sheet from the right
- [ ] Sheet title shows the asset name
- [ ] Sheet is scrollable for long threads
- [ ] Comment input is pinned to the bottom of the sheet at all times
- [ ] New comments auto-scroll the thread to the bottom

---

## Notes & Future Improvements

- **Image pin coordinates:** The `metadata` column is designed to store `{ x: number, y: number }` for pinning comments to specific locations on image previews. This UI is out of scope for this task but the schema is ready.
- **Real-time updates:** Currently comments refresh on `revalidatePath`. For a live chat feel, swap `trpc.comments.byAssetId.useQuery` for a Supabase Realtime subscription on the `comments` table in a Phase 2 iteration.
- **Unread comment badges:** The `notifications` table already tracks `comment_added` events. Wire the `activity.unreadCount` query (Task 11) to the Comments button to show a badge count.
