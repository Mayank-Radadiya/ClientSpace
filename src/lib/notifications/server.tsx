// src/lib/notifications/server.tsx
// Single entry point for all notification dispatches in ClientSpace.
//
// Usage:
//   import { dispatchNotification } from "@/lib/notifications/server";
//   await dispatchNotification({ orgId, recipientUserId, type, title, body, ... });
//
// This function is intentionally thin — it fires a single Inngest event and
// returns immediately. All channel fan-out (in-app, email, Slack) happens
// inside the processNotification Inngest worker, never on the originating request.

import { render } from "@react-email/render";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  assets,
  fileVersions,
  organizations,
  projectMembers,
  projects,
  users,
} from "@/db/schema";
import { AssetStatusEmail } from "@/emails/AssetStatusEmail";
import { inngest } from "@/inngest/client";
import type { NotificationEventType } from "@/features/notifications/events";

// ─── Public payload interface ─────────────────────────────────────────────────

export interface NotificationPayload {
  orgId:            string;
  recipientUserId:  string;
  type:             NotificationEventType;
  title:            string;
  body:             string;
  actionUrl?:       string;
  actionLabel?:     string;
  /** Optional extra context, e.g. { assetName, projectName } — stored in metadata */
  metadata?:        Record<string, unknown>;
}

// ─── Main dispatch function ───────────────────────────────────────────────────

/**
 * Enqueues a notification for async fan-out via Inngest.
 * Never blocks the caller — returns as soon as the event is enqueued.
 */
export async function dispatchNotification(
  payload: NotificationPayload,
): Promise<void> {
  await inngest.send({
    name: "notifications/dispatch",
    data: payload,
  });
}

// ─── Legacy type alias ────────────────────────────────────────────────────────
// Kept for backwards compatibility with imports that use NotificationEventData.
// New code should use NotificationPayload.

/** @deprecated Use NotificationPayload instead */
export type NotificationEventData = NotificationPayload & {
  /** @deprecated No longer used — idempotency is handled by Inngest */
  idempotencyKey?: string;
  /** @deprecated Email templates are now selected by the worker based on event type */
  emailHtml?: string;
  /** @deprecated Email subject is now built by the worker */
  emailSubject?: string;
  /** @deprecated Use actionUrl instead */
  link?: string;
};

// ─── Email rendering helper ───────────────────────────────────────────────────

export async function renderAssetStatusEmailHtml(
  props: React.ComponentProps<typeof AssetStatusEmail>,
): Promise<string> {
  return render(<AssetStatusEmail {...props} />);
}

// ─── Recipient resolution helpers ────────────────────────────────────────────

export async function resolveNotificationRecipients(
  orgId: string,
  projectId: string,
  assetId: string,
  excludeActorId: string,
): Promise<string[]> {
  const members = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projects.orgId, orgId)),
    );

  const [assetWithUploader] = await db
    .select({ uploadedBy: fileVersions.uploadedBy })
    .from(assets)
    .leftJoin(fileVersions, eq(assets.currentVersionId, fileVersions.id))
    .where(and(eq(assets.id, assetId), eq(assets.orgId, orgId)))
    .limit(1);

  const recipientSet = new Set<string>(members.map((m) => m.userId));
  if (assetWithUploader?.uploadedBy) {
    recipientSet.add(assetWithUploader.uploadedBy);
  }
  recipientSet.delete(excludeActorId);

  return Array.from(recipientSet);
}

export async function resolveProjectOwner(orgId: string): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  const [row] = await db
    .select({
      userId: organizations.ownerId,
      email: users.email,
      name: users.name,
    })
    .from(organizations)
    .innerJoin(users, eq(organizations.ownerId, users.id))
    .where(eq(organizations.id, orgId))
    .limit(1);

  return row ?? null;
}
