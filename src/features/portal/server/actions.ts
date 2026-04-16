"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import { activityLogs, assets, clients, projects } from "@/db/schema";

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
      columns: { id: true, orgId: true },
    });
    if (!client) return { error: "Access denied." };

    const project = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.clientId, client.id),
        eq(projects.orgId, client.orgId),
      ),
      columns: { id: true },
    });
    if (!project) return { error: "Access denied." };

    const asset = await tx.query.assets.findFirst({
      where: and(eq(assets.id, assetId), eq(assets.projectId, projectId)),
      columns: { id: true, approvalStatus: true },
    });
    if (!asset) return { error: "Asset not found." };

    if (asset.approvalStatus === "approved" && status === "approved") {
      return { error: "This asset is already approved." };
    }

    const headersList = await headers();
    const clientIp =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    await tx.transaction(async (trx) => {
      await trx
        .update(assets)
        .set({ approvalStatus: status })
        .where(eq(assets.id, assetId));

      await trx.insert(activityLogs).values({
        orgId: client.orgId,
        projectId,
        actorId: ctx.userId,
        eventType:
          status === "approved" ? "file_approved" : "changes_requested",
        metadata: {
          event:
            status === "approved"
              ? "asset.approved"
              : "asset.changes_requested",
          assetId,
          clientIp,
          signedAt: new Date().toISOString(),
          actorName: "Client",
          assetName: "Asset",
        } as never,
      });
    });

    revalidatePath(`/portal/projects/${projectId}/files`);
    return { success: true };
  });
}
