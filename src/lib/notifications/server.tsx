import { render } from "@react-email/render";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, fileVersions, projectMembers, projects } from "@/db/schema";
import { AssetStatusEmail } from "@/emails/AssetStatusEmail";
import { inngest } from "@/inngest/client";

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

export async function dispatchNotification(
  data: NotificationEventData,
): Promise<void> {
  await inngest.send({ name: "notification/asset-status", data });
}

export async function renderAssetStatusEmailHtml(
  props: React.ComponentProps<typeof AssetStatusEmail>,
): Promise<string> {
  return render(<AssetStatusEmail {...props} />);
}

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
