import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { inngest } from "@/inngest/client";
import type { NotificationEventData } from "@/lib/notifications/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export const notificationDispatch = inngest.createFunction(
  {
    id: "notification-asset-status",
    idempotency: "event.data.idempotencyKey",
    retries: 3,
  },
  { event: "notification/asset-status" },
  async ({ event, step }) => {
    const payload = event.data as NotificationEventData;

    await step.sleep("merge-window", "5m");

    const recipient = await step.run("resolve-recipient", async () => {
      const [row] = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, payload.recipientUserId))
        .limit(1);

      return row ?? null;
    });

    if (!recipient) {
      return { ok: true, skipped: "recipient_missing" as const };
    }

    await step.run("insert-notification", async () => {
      await db.insert(notifications).values({
        userId: payload.recipientUserId,
        orgId: payload.orgId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link,
      });
    });

    await step.run("send-email", async () => {
      if (
        !process.env.RESEND_API_KEY ||
        !payload.emailHtml ||
        !payload.emailSubject
      ) {
        return { ok: true, skipped: "email_not_configured" as const };
      }

      const fromEmail =
        process.env.ONBOARDING_FROM_EMAIL ||
        process.env.INVITE_FROM_EMAIL ||
        "onboarding@resend.dev";

      const result = await resend.emails.send({
        from: fromEmail,
        to: recipient.email,
        subject: payload.emailSubject,
        html: payload.emailHtml,
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      return { ok: true, messageId: (result as { id?: string })?.id ?? null };
    });

    return { ok: true };
  },
);
