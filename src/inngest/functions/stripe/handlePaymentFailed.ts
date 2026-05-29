// src/inngest/functions/stripe/handlePaymentFailed.ts
// Handles stripe/payment.failed events dispatched by the webhook handler.
// Reverts invoice status to 'sent', writes an activity log, dispatches a notification.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, invoices, organizations, users } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { dispatchNotification } from "@/lib/notifications/server";
import { NOTIFICATION_EVENTS } from "@/features/notifications/events";

export const handlePaymentFailed = inngest.createFunction(
  {
    id: "stripe-payment-failed",
    retries: 3,
  },
  { event: "stripe/payment.failed" },
  async ({ event, step }) => {
    const { paymentIntentId, errorMessage, invoiceId } = event.data as {
      paymentIntentId: string;
      errorMessage: string;
      invoiceId: string | null;
    };

    // 1. Resolve the invoice
    const invoice = await step.run("resolve-invoice", async () => {
      if (invoiceId) {
        const byId = await db.query.invoices.findFirst({
          where: eq(invoices.id, invoiceId),
          columns: { id: true, orgId: true, number: true, status: true },
        });
        if (byId) return byId;
      }

      return db.query.invoices.findFirst({
        where: eq(invoices.stripePaymentIntentId, paymentIntentId),
        columns: { id: true, orgId: true, number: true, status: true },
      });
    });

    if (!invoice) {
      console.warn(`[handlePaymentFailed] No invoice found for PI ${paymentIntentId}`);
      return { ok: true, skipped: "invoice_not_found" };
    }

    // 2. Revert invoice status to 'sent' (never undo a successful payment)
    await step.run("update-invoice", async () => {
      if (invoice.status === "paid") return;

      await db
        .update(invoices)
        .set({
          status: "sent",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));
    });

    // 3. Fetch org + owner
    const org = await step.run("fetch-org", async () => {
      return db.query.organizations.findFirst({
        where: eq(organizations.id, invoice.orgId),
        columns: { name: true, ownerId: true },
      });
    });

    // 4. Write activity log
    await step.run("write-activity-log", async () => {
      if (!org) return;

      await db.insert(activityLogs).values({
        orgId: invoice.orgId,
        actorId: org.ownerId,
        eventType: "invoice.payment_failed",
        metadata: {
          event: "invoice.sent",
          invoiceNumber: invoice.number,
          amountCents: 0,
        },
      });
    });

    // 5. Dispatch in-app + email + Slack notification to agency owner
    await step.run("dispatch-notification", async () => {
      if (!org) return { ok: true, skipped: "org_missing" };

      const owner = await db.query.users.findFirst({
        where: eq(users.id, org.ownerId),
        columns: { id: true },
      });

      if (!owner) return { ok: true, skipped: "owner_not_found" };

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      await dispatchNotification({
        orgId: invoice.orgId,
        recipientUserId: owner.id,
        type: NOTIFICATION_EVENTS.INVOICE_OVERDUE,
        title: `Payment failed — Invoice #${invoice.number}`,
        body: `A payment attempt for Invoice #${invoice.number} was unsuccessful.`,
        actionUrl: `${appUrl}/invoices`,
        actionLabel: "View invoice",
        metadata: { invoiceNumber: invoice.number, errorMessage },
      });

      return { ok: true };
    });

    return { ok: true, invoiceId: invoice.id };
  },
);
