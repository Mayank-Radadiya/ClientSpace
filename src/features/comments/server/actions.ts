"use server";

import { render } from "@react-email/render";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { createElement } from "react";
import { withRLS } from "@/db/createDrizzleClient";
import {
  activityLogs,
  assets,
  clients,
  comments,
  projects,
  users,
} from "@/db/schema";
import { NewCommentEmail } from "@/emails/NewCommentEmail";
import { getSessionContext } from "@/lib/auth/session";
import {
  dispatchNotification,
  resolveProjectOwner,
} from "@/lib/notifications/server";
import {
  createCommentSchema,
  deleteCommentSchema,
  editCommentSchema,
} from "../schemas";

async function verifyAssetAccess(
  tx: any,
  userId: string,
  orgId: string,
  assetId: string,
) {
  const asset = await tx.query.assets.findFirst({
    where: and(eq(assets.id, assetId), isNull(assets.deletedAt)),
    columns: { id: true, name: true, projectId: true, orgId: true },
  });
  if (!asset) throw new Error("Asset not found.");

  const project = await tx.query.projects.findFirst({
    where: eq(projects.id, asset.projectId),
    columns: { id: true, name: true, orgId: true, clientId: true },
  });
  if (!project) throw new Error("Project not found.");
  if (project.orgId !== orgId) throw new Error("Access denied.");

  const userRow = await tx.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, email: true },
  });
  if (!userRow) throw new Error("User not found.");

  return { asset, project, userRow };
}

async function dispatchMentionNotifications(args: {
  tx: any;
  body: string;
  actorId: string;
  actorName: string;
  asset: { id: string; name: string; projectId: string };
  orgId: string;
}) {
  const mentionPattern = /@(\w+(?:\s\w+)?)/g;
  const mentions = [...args.body.matchAll(mentionPattern)]
    .map((m) => m[1])
    .filter((m): m is string => Boolean(m));
  if (mentions.length === 0) return;

  // NOTE: exact-match only for MVP. Phase 2: lower() case-insensitive matching.
  const mentionedUsers = await args.tx.query.users.findMany({
    where: inArray(users.name, mentions),
    columns: { id: true, name: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const commentUrl = `${appUrl}/projects/${args.asset.projectId}/files/${args.asset.id}`;

  for (const mentioned of mentionedUsers) {
    if (mentioned.id === args.actorId) continue;
    try {
      await dispatchNotification({
        idempotencyKey: `${args.orgId}:${args.asset.id}:comment_mention:${mentioned.id}:${Date.now()}`,
        recipientUserId: mentioned.id,
        orgId: args.orgId,
        type: "comment_added",
        title: `${args.actorName} mentioned you`,
        body: `In a comment on ${args.asset.name}`,
        link: commentUrl,
      });
    } catch (err) {
      console.error("[dispatchMentionNotifications] Non-fatal:", err);
    }
  }
}

async function dispatchCommentNotification(args: {
  tx: any;
  actorId: string;
  actorName: string;
  actorRole: "owner" | "admin" | "member" | "client";
  commentBody: string;
  asset: { id: string; name: string; projectId: string };
  project: { id: string; name: string; orgId: string; clientId: string };
}) {
  try {
    let recipientUserId: string | null = null;

    if (args.actorRole === "client") {
      const owner = await resolveProjectOwner(args.project.orgId);
      if (owner && owner.userId !== args.actorId) recipientUserId = owner.userId;
    } else {
      const clientRow = await args.tx.query.clients.findFirst({
        where: eq(clients.id, args.project.clientId),
        columns: { userId: true },
      });
      if (clientRow?.userId && clientRow.userId !== args.actorId) {
        recipientUserId = clientRow.userId;
      }
    }

    if (!recipientUserId) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const commentUrl = `${appUrl}/projects/${args.project.id}/files/${args.asset.id}`;

    const emailHtml = await render(
      createElement(NewCommentEmail, {
        authorName: args.actorName,
        commentBody: args.commentBody,
        assetName: args.asset.name,
        projectName: args.project.name,
        orgName: "ClientSpace",
        commentUrl,
      }),
    );

    await dispatchNotification({
      idempotencyKey: `${args.project.orgId}:${args.asset.id}:comment_added:${recipientUserId}:${Date.now()}`,
      recipientUserId,
      orgId: args.project.orgId,
      type: "comment_added",
      title: `${args.actorName} commented on ${args.asset.name}`,
      body: `In project: ${args.project.name}`,
      link: commentUrl,
      emailSubject: `New comment on ${args.asset.name} - ${args.project.name}`,
      emailHtml,
    });
  } catch (err) {
    console.error("[dispatchCommentNotification] Non-fatal:", err);
  }
}

export async function createCommentAction(rawInput: unknown) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized." };

  const parsed = createCommentSchema.safeParse(rawInput);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { body, assetId, parentId } = parsed.data;

  return withRLS(ctx, async (tx) => {
    let access;
    try {
      access = await verifyAssetAccess(tx, ctx.userId, ctx.orgId, assetId);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Access denied." };
    }

    if (ctx.role === "client") {
      const clientRow = await tx.query.clients.findFirst({
        where: and(eq(clients.userId, ctx.userId), eq(clients.orgId, ctx.orgId)),
        columns: { id: true },
      });
      if (!clientRow || access.project.clientId !== clientRow.id) {
        return { error: "Access denied." };
      }
    }

    if (parentId) {
      const parent = await tx.query.comments.findFirst({
        where: and(
          eq(comments.id, parentId),
          eq(comments.assetId, assetId),
          isNull(comments.parentId),
          isNull(comments.deletedAt),
        ),
        columns: { id: true },
      });
      if (!parent) {
        return {
          error:
            "You cannot reply to a reply. Please reply to the main thread instead.",
        };
      }
    }

    const [newComment] = await tx
      .insert(comments)
      .values({
        orgId: ctx.orgId,
        projectId: access.project.id,
        assetId,
        authorId: ctx.userId,
        body,
        parentId: parentId ?? null,
      })
      .returning({ id: comments.id });

    await tx.insert(activityLogs).values({
      orgId: ctx.orgId,
      projectId: access.project.id,
      actorId: ctx.userId,
      eventType: "comment_added",
      metadata: {
        event: "comment.created",
        bodySnippet: body.slice(0, 120),
        assetId,
      },
    });

    const actorName = access.userRow.name ?? access.userRow.email ?? "Someone";

    await dispatchCommentNotification({
      tx,
      actorId: ctx.userId,
      actorName,
      actorRole: ctx.role,
      commentBody: body,
      asset: access.asset,
      project: access.project,
    });

    await dispatchMentionNotifications({
      tx,
      body,
      actorId: ctx.userId,
      actorName,
      asset: access.asset,
      orgId: ctx.orgId,
    });

    revalidatePath(`/projects/${access.project.id}/files/${assetId}`);
    return { success: true as const, commentId: newComment?.id ?? "" };
  });
}

export async function editCommentAction(rawInput: unknown) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized." };

  const parsed = editCommentSchema.safeParse(rawInput);
  if (!parsed.success) return { error: "Invalid input." };

  return withRLS(ctx, async (tx) => {
    const { commentId, body } = parsed.data;

    const existing = await tx.query.comments.findFirst({
      where: and(eq(comments.id, commentId), isNull(comments.deletedAt)),
      columns: { id: true, authorId: true, assetId: true, projectId: true },
    });
    if (!existing) return { error: "Comment not found." };
    if (existing.authorId !== ctx.userId) {
      return { error: "You can only edit your own comments." };
    }

    await tx
      .update(comments)
      .set({ body, editedAt: new Date() })
      .where(eq(comments.id, commentId));

    revalidatePath(`/projects/${existing.projectId}/files/${existing.assetId}`);
    return { success: true as const };
  });
}

export async function deleteCommentAction(rawInput: unknown) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized." };
  if (ctx.role !== "admin" && ctx.role !== "owner") {
    return { error: "Only admins can hide comments." };
  }

  const parsed = deleteCommentSchema.safeParse(rawInput);
  if (!parsed.success) return { error: "Invalid input." };

  return withRLS(ctx, async (tx) => {
    const { commentId } = parsed.data;

    const existing = await tx.query.comments.findFirst({
      where: and(eq(comments.id, commentId), isNull(comments.deletedAt)),
      columns: { id: true, assetId: true, projectId: true },
    });
    if (!existing) return { error: "Comment not found." };

    await tx
      .update(comments)
      .set({ deletedAt: new Date() })
      .where(eq(comments.id, commentId));

    revalidatePath(`/projects/${existing.projectId}/files/${existing.assetId}`);
    return { success: true as const };
  });
}
