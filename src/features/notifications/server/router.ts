// src/features/notifications/server/router.ts
// tRPC procedures for notification preferences and Slack webhook management.
//
// Procedures:
//   notifications.getPreferences         — get user's channel preference matrix
//   notifications.updatePreferences      — upsert the preference matrix
//   notifications.updateSlackWebhook     — set/clear org Slack webhook (owner/admin only)
//   notifications.testSlackWebhook       — fire a test message to configured webhook

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS, createDrizzleClient } from "@/db/createDrizzleClient";
import { notificationPreferences, organizations, orgMemberships } from "@/db/schema";
import { DEFAULT_PREFERENCES, EVENT_LABELS } from "@/features/notifications/events";

// ─── Validators ───────────────────────────────────────────────────────────────

const channelPreferenceSchema = z.object({
  in_app: z.boolean(),
  email:  z.boolean(),
  slack:  z.boolean(),
});

const preferencesMapSchema = z.record(z.string(), channelPreferenceSchema);

// ─── Router ───────────────────────────────────────────────────────────────────

export const notificationsRouter = createTRPCRouter({
  /**
   * Returns the current user's full channel preference matrix.
   * Merges their saved preferences over DEFAULT_PREFERENCES so unconfigured
   * event types always have a sensible value.
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      const row = await tx.query.notificationPreferences.findFirst({
        where: and(
          eq(notificationPreferences.userId, ctx.userId),
          eq(notificationPreferences.orgId, ctx.orgId),
        ),
        columns: { preferences: true },
      });

      const saved = (row?.preferences ?? {}) as Record<string, Partial<{ in_app: boolean; email: boolean; slack: boolean }>>;

      // Merge saved overrides onto defaults for every known event type
      const merged = Object.fromEntries(
        Object.entries(DEFAULT_PREFERENCES).map(([type, defaults]) => {
          const override = saved[type] ?? {};
          return [
            type,
            {
              in_app: override.in_app ?? defaults.in_app,
              email:  override.email  ?? defaults.email,
              slack:  override.slack  ?? defaults.slack,
            },
          ];
        }),
      );

      return { preferences: merged };
    });
  }),

  /**
   * Upserts the user's channel preference matrix.
   * Partial updates are supported — only provided keys are changed.
   */
  updatePreferences: protectedProcedure
    .input(z.object({ preferences: preferencesMapSchema }))
    .mutation(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.notificationPreferences.findFirst({
          where: and(
            eq(notificationPreferences.userId, ctx.userId),
            eq(notificationPreferences.orgId, ctx.orgId),
          ),
          columns: { id: true, preferences: true },
        });

        if (existing) {
          // Merge new preferences over the existing ones
          const merged = {
            ...(existing.preferences as Record<string, unknown>),
            ...input.preferences,
          };
          await tx
            .update(notificationPreferences)
            .set({ preferences: merged, updatedAt: new Date() })
            .where(eq(notificationPreferences.id, existing.id));
        } else {
          await tx.insert(notificationPreferences).values({
            userId: ctx.userId,
            orgId:  ctx.orgId,
            preferences: input.preferences,
          });
        }

        return { success: true };
      });
    }),

  /**
   * Sets or clears the Slack Incoming Webhook URL for the org.
   * Only org owner/admin can call this.
   *
   * Security: slackWebhookUrl is stored server-side only and MUST NOT
   * be returned in client-facing query responses.
   */
  updateSlackWebhook: protectedProcedure
    .input(
      z.object({
        webhookUrl: z.union([
          z.string().url("Must be a valid URL").startsWith("https://hooks.slack.com/", "Must be a Slack webhook URL"),
          z.literal(""),
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new Error("Only org owner or admin can configure Slack integration.");
      }

      const db = await createDrizzleClient(ctx);
      await db
        .update(organizations)
        .set({
          slackWebhookUrl: input.webhookUrl === "" ? null : input.webhookUrl,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, ctx.orgId));

      return { success: true };
    }),

  /**
   * Sends a test Slack message to the org's configured webhook.
   * Returns { ok: true } on success, throws on failure.
   */
  testSlackWebhook: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.role !== "owner" && ctx.role !== "admin") {
      throw new Error("Only org owner or admin can test Slack integration.");
    }

    const db = await createDrizzleClient(ctx);
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, ctx.orgId),
      columns: { slackWebhookUrl: true, name: true },
    });

    if (!org?.slackWebhookUrl) {
      throw new Error("No Slack webhook configured for this organization.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const res = await fetch(org.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✅ *ClientSpace Slack integration is working!*\nNotifications for *${org.name}* will appear here.`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Manage notifications", emoji: true },
                url: `${appUrl}/settings/notifications`,
              },
            ],
          },
        ],
      }),
    });

    const text = await res.text();
    if (!res.ok || text !== "ok") {
      throw new Error(`Slack returned an error: ${text}`);
    }

    return { ok: true };
  }),

  /**
   * Returns whether the org has a Slack webhook configured.
   * SECURITY: Returns boolean only — never exposes the actual webhook URL.
   */
  getSlackStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await createDrizzleClient(ctx);
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, ctx.orgId),
      columns: { slackWebhookUrl: true },
    });

    return { connected: Boolean(org?.slackWebhookUrl) };
  }),
});
