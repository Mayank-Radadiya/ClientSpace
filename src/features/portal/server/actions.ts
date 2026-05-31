"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import { activityLogs, assets, clients, orgMemberships, projects, users } from "@/db/schema";
import {
  dispatchNotification,
  resolveNotificationRecipients,
} from "@/lib/notifications/server";
import { NOTIFICATION_EVENTS } from "@/features/notifications/events";
import { updateAssetStatusSchema } from "../schemas";

export async function updateAssetStatusAction(
  rawInput: unknown,
): Promise<{ success: true } | { error: string }> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized." };

  const parsed = updateAssetStatusSchema.safeParse(rawInput);
  if (!parsed.success) return { error: "Invalid input." };

  const { assetId, projectId, status, previewMode } = parsed.data;

  return withRLS(ctx, async (tx) => {
    // ── Identity resolution ───────────────────────────────────────────────────
    // Normal path:  caller is a genuine client user → look up the clients table.
    // Preview path: caller is an org member previewing the portal → verify via
    //               org_memberships and proceed as an org actor (no client row needed).

    let orgId: string;
    let contactName: string | null = null;

    if (previewMode) {
      // Verify the caller is an active org member
      const membership = await tx.query.orgMemberships.findFirst({
        where: and(
          eq(orgMemberships.userId, ctx.userId),
          eq(orgMemberships.orgId, ctx.orgId),
        ),
        columns: { orgId: true, role: true },
      });
      if (!membership) return { error: "Access denied." };
      orgId = membership.orgId;
    } else {
      // Normal client path
      const client = await tx.query.clients.findFirst({
        where: and(eq(clients.userId, ctx.userId), eq(clients.orgId, ctx.orgId)),
        columns: { id: true, orgId: true, contactName: true, email: true },
      });
      if (!client) return { error: "Access denied." };
      orgId = client.orgId;
      contactName = client.contactName;
    }

    const project = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.orgId, orgId),
      ),
      columns: { id: true, name: true },
    });
    if (!project) return { error: "Access denied." };

    const asset = await tx.query.assets.findFirst({
      where: and(eq(assets.id, assetId), eq(assets.projectId, projectId)),
      columns: { id: true, name: true, approvalStatus: true },
    });
    if (!asset) return { error: "Asset not found." };

    if (asset.approvalStatus === "approved" && status === "approved") {
      return { error: "This asset is already approved." };
    }

    const actor = await tx.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: { name: true, email: true },
    });

    const actorName =
      actor?.name ??
      contactName ??
      actor?.email?.split("@")[0] ??
      (previewMode ? "Preview User" : "Client User");

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      undefined;

    const eventType =
      status === "approved" ? "file_approved" : "changes_requested";
    const activityEvent =
      status === "approved" ? "asset.approved" : "asset.changes_requested";

    await tx.transaction(async (trx) => {
      await trx
        .update(assets)
        .set({ approvalStatus: status, updatedAt: new Date() })
        .where(eq(assets.id, assetId));

      await trx.insert(activityLogs).values({
        orgId,
        projectId,
        actorId: ctx.userId,
        eventType,
        metadata: {
          event: activityEvent,
          assetName: asset.name,
          actorName,
          ipAddress,
        },
      });
    });

    try {
      const recipients = await resolveNotificationRecipients(
        orgId,
        projectId,
        assetId,
        ctx.userId,
      );

      if (recipients.length > 0) {
        const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/projects/${projectId}`;

        await Promise.all(
          recipients.map((recipientUserId) =>
            dispatchNotification({
              recipientUserId,
              orgId,
              type: status === "approved"
                ? NOTIFICATION_EVENTS.ASSET_APPROVED
                : NOTIFICATION_EVENTS.ASSET_CHANGES_REQUESTED,
              title:
                status === "approved"
                  ? `File approved: ${asset.name}`
                  : `Changes requested: ${asset.name}`,
              body: `${actorName} ${status === "approved" ? "approved" : "requested changes for"} ${asset.name} in ${project.name}.`,
              actionUrl: actionUrl,
              actionLabel: "View project",
              metadata: { assetName: asset.name, projectName: project.name, actorName },
            }),
          ),
        );
      }
    } catch (error) {
      console.error(
        "[updateAssetStatusAction] Inngest dispatch failed:",
        error,
      );
    }

    revalidatePath(`/portal/projects/${projectId}/files`);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/dashboard`);

    return { success: true };
  });
}
