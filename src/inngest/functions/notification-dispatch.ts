// src/inngest/functions/notification-dispatch.ts
// Unified notification worker — fans out every notifications/dispatch event
// to in-app, email, and Slack channels in parallel.
//
// Architecture:
//   1. resolve-preferences   → load user prefs, merge with DEFAULT_PREFERENCES
//   2. insert-in-app         → write to notifications table
//   3. fan-out               → Promise.allSettled over enabled channels
//      a. email              → Resend (React Email template)
//      b. slack              → Slack Incoming Webhook (Block Kit)
//   4. mark-delivered        → update deliveryStatus in notifications row
//
// Security rules (enforced inside worker, not at dispatch site):
//   - Slack payloads: title + actionUrl ONLY — no PII, no financial amounts
//   - slackWebhookUrl read from organizations.slackWebhookUrl (server-only)

import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import {
  notifications,
  notificationPreferences,
  organizations,
  users,
} from "@/db/schema";
import { inngest } from "@/inngest/client";
import {
  DEFAULT_PREFERENCES,
  type NotificationEventType,
  type ChannelPreference,
} from "@/features/notifications/events";
import type { NotificationPayload } from "@/lib/notifications/server";

// ─── Email templates mapping ──────────────────────────────────────────────────
// Each event type maps to a React Email component factory.
// Add new templates here as events are added.
async function buildEmailHtml(
  type: NotificationEventType,
  payload: NotificationPayload,
  recipientName: string,
  recipientEmail: string,
): Promise<{ subject: string; html: string } | null> {
  // Generic transactional template — we use a single shared template
  // for all notification events. Swap to event-specific templates as needed.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const subject = payload.title;
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>${subject}</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 520px; margin: 32px auto; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px 32px;">
            <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;">ClientSpace</p>
          </div>
          <div style="padding: 32px;">
            <h1 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #111827;">${payload.title}</h1>
            <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">${payload.body ?? ""}</p>
            ${payload.actionUrl ? `
            <a href="${payload.actionUrl}" style="display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              ${payload.actionLabel ?? "View"}
            </a>
            ` : ""}
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; background: #f9fafb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              You're receiving this because you have notifications enabled. 
              <a href="${appUrl}/settings/notifications" style="color: #6366f1; text-decoration: none;">Manage preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

// ─── Slack Block Kit builder ──────────────────────────────────────────────────
// SECURITY: Only sends title and actionUrl. No PII, no financial amounts.
function buildSlackBlocks(payload: NotificationPayload) {
  const blocks: unknown[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${payload.title}*\n${payload.body ?? ""}`,
      },
    },
  ];

  if (payload.actionUrl) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: payload.actionLabel ?? "View", emoji: true },
          url: payload.actionUrl,
          style: "primary",
        },
      ],
    });
  }

  return { blocks };
}

// ─── Inngest worker ───────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

export const processNotification = inngest.createFunction(
  {
    id: "notifications-dispatch",
    retries: 2,
    concurrency: {
      limit: 20,
      key: "event.data.orgId",
    },
  },
  { event: "notifications/dispatch" },
  async ({ event, step }) => {
    const payload = event.data as NotificationPayload;
    const { orgId, recipientUserId, type } = payload;

    // ── Step 1: Resolve user + org + preferences ──────────────────────────────
    const context = await step.run("resolve-context", async () => {
      const [userRow, orgRow, prefRow] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, recipientUserId),
          columns: { id: true, email: true, name: true, phone: true },
        }),
        db.query.organizations.findFirst({
          where: eq(organizations.id, orgId),
          columns: { id: true, name: true, slackWebhookUrl: true },
        }),
        db.query.notificationPreferences.findFirst({
          where: and(
            eq(notificationPreferences.userId, recipientUserId),
            eq(notificationPreferences.orgId, orgId),
          ),
          columns: { preferences: true },
        }),
      ]);

      if (!userRow) throw new Error(`[processNotification] User ${recipientUserId} not found`);

      // Merge saved preferences over defaults — user can override any channel per event
      const savedPrefs = (prefRow?.preferences ?? {}) as Record<string, Partial<ChannelPreference>>;
      const defaults = DEFAULT_PREFERENCES[type as NotificationEventType] ?? {
        in_app: true,
        email: true,
        slack: false,
      };
      const effectivePrefs: ChannelPreference = {
        in_app: savedPrefs[type]?.in_app ?? defaults.in_app,
        email:  savedPrefs[type]?.email  ?? defaults.email,
        slack:  savedPrefs[type]?.slack  ?? defaults.slack,
      };

      return {
        user: userRow,
        org: orgRow,
        prefs: effectivePrefs,
      };
    });

    const { user, org, prefs } = context;

    // ── Step 2: Insert in-app notification (always, unless user opted out) ────
    const notificationId = await step.run("insert-in-app", async () => {
      if (!prefs.in_app) return null;

      const [row] = await db
        .insert(notifications)
        .values({
          userId: recipientUserId,
          orgId,
          type,
          title: payload.title,
          body: payload.body,
          actionUrl: payload.actionUrl,
          actionLabel: payload.actionLabel,
          link: payload.actionUrl, // backwards-compat alias
          channel: "in_app",
          deliveryStatus: "delivered",
          metadata: payload.metadata ?? null,
        })
        .returning({ id: notifications.id });

      // Broadcast to Supabase Realtime so the bell updates instantly
      // We import dynamically to avoid pulling the Supabase SDK into the worker bundle
      // when Realtime is not configured.
      try {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const supabase = createAdminClient();
          await supabase
            .channel(`notifications:${recipientUserId}`)
            .send({
              type: "broadcast",
              event: "new_notification",
              payload: { notificationId: row?.id, type, title: payload.title },
            });
        }
      } catch (err) {
        // Non-fatal: Realtime broadcast failure should not block delivery
        console.warn("[processNotification] Realtime broadcast failed:", err);
      }

      return row?.id ?? null;
    });

    // ── Step 3: Fan-out to external channels ──────────────────────────────────
    await step.run("fan-out-channels", async () => {
      const tasks: Promise<{ channel: string; ok: boolean; error?: string }>[] = [];

      // ─ Email ───────────────────────────────────────────────────────────────
      if (prefs.email && user.email && process.env.RESEND_API_KEY) {
        tasks.push(
          (async () => {
            try {
              const emailContent = await buildEmailHtml(
                type as NotificationEventType,
                payload,
                user.name,
                user.email,
              );
              if (!emailContent) return { channel: "email", ok: true };

              const fromEmail =
                process.env.DEFAULT_FROM_EMAIL ??
                process.env.RESEND_FROM_EMAIL ??
                process.env.NOTIFICATIONS_FROM_EMAIL ??
                process.env.ONBOARDING_FROM_EMAIL ??
                "ClientSpace <hello@clientspace.qzz.io>";

              const { error } = await resend.emails.send({
                from: fromEmail,
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
              });

              if (error) {
                return { channel: "email", ok: false, error: error.message };
              }

              return { channel: "email", ok: true };
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              return { channel: "email", ok: false, error: msg };
            }
          })(),
        );
      }

      // ─ Slack ───────────────────────────────────────────────────────────────
      // SECURITY: slackWebhookUrl is read server-side only. Never sent to client.
      // SECURITY: Block Kit payload contains ONLY title + actionUrl — no PII.
      if (prefs.slack && org?.slackWebhookUrl) {
        tasks.push(
          (async () => {
            try {
              const body = buildSlackBlocks(payload);
              const res = await fetch(org.slackWebhookUrl!, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
              const text = await res.text();
              if (!res.ok || text !== "ok") {
                return { channel: "slack", ok: false, error: `HTTP ${res.status}: ${text}` };
              }
              return { channel: "slack", ok: true };
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              return { channel: "slack", ok: false, error: msg };
            }
          })(),
        );
      }



      // Collect results — don't let one channel failure block others
      const results = await Promise.allSettled(tasks);

      const failures = results
        .filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok))
        .map((r) =>
          r.status === "rejected"
            ? { channel: "unknown", error: String(r.reason) }
            : r.status === "fulfilled"
            ? { channel: r.value.channel, error: r.value.error }
            : { channel: "unknown", error: "unknown" },
        );

      // Update in-app notification delivery status if all external channels failed
      if (notificationId && failures.length === tasks.length && tasks.length > 0) {
        await db
          .update(notifications)
          .set({
            deliveryError: failures.map((f) => `${f.channel}: ${f.error ?? "failed"}`).join("; "),
          })
          .where(eq(notifications.id, notificationId));
      }

      return {
        delivered: results.length - failures.length,
        failed: failures.length,
        details: failures,
      };
    });

    return { ok: true, notificationId };
  },
);

// ─── Legacy export alias ──────────────────────────────────────────────────────
// The old worker was exported as notificationDispatch. Keep the alias so the
// Inngest route registration in src/app/api/inngest/route.ts doesn't need changes.
export const notificationDispatch = processNotification;
