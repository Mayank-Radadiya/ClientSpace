"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import { activityLogs, assets, clients, projects, users } from "@/db/schema";
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
  rawInput: unknown,
): Promise<{ success: true } | { error: string }> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized." };

  const parsed = updateAssetStatusSchema.safeParse(rawInput);
  if (!parsed.success) return { error: "Invalid input." };

  const { assetId, projectId, status } = parsed.data;

  return withRLS(ctx, async (tx) => {
    const client = await tx.query.clients.findFirst({
      where: and(eq(clients.userId, ctx.userId), eq(clients.orgId, ctx.orgId)),
      columns: { id: true, orgId: true, contactName: true, email: true },
    });
    if (!client) return { error: "Access denied." };

    const project = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.clientId, client.id),
        eq(projects.orgId, client.orgId),
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
      client.contactName ??
      actor?.email?.split("@")[0] ??
      "Client User";

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
        orgId: client.orgId,
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
        client.orgId,
        projectId,
        assetId,
        ctx.userId,
      );

      if (recipients.length > 0) {
        const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/projects/${projectId}`;
        const subjectPrefix =
          status === "approved" ? "File approved" : "Changes requested";

        const emailHtml = await renderAssetStatusEmailHtml({
          status,
          actorName,
          assetName: asset.name,
          projectName: project.name,
          actionUrl,
          bodyHtml:
            status === "approved"
              ? `The client approved <strong>${asset.name}</strong>.`
              : `The client requested changes for <strong>${asset.name}</strong>.`,
        });

        await Promise.all(
          recipients.map((recipientUserId) =>
            dispatchNotification({
              idempotencyKey: `${client.orgId}:${projectId}:${eventType}:${recipientUserId}`,
              recipientUserId,
              orgId: client.orgId,
              type: eventType,
              title:
                status === "approved"
                  ? `File approved: ${asset.name}`
                  : `Changes requested: ${asset.name}`,
              body: `${actorName} ${status === "approved" ? "approved" : "requested changes for"} ${asset.name} in ${project.name}.`,
              link: `/projects/${projectId}`,
              emailSubject: `${subjectPrefix}: ${asset.name} - ${project.name}`,
              emailHtml,
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
