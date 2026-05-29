// src/inngest/functions/stripe/handlePaymentSucceeded.ts
// Handles stripe/payment.succeeded events dispatched by the webhook handler.
// Updates invoice to 'paid', writes an activity log, dispatches a notification.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, invoices, organizations, users } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { dispatchNotification } from "@/lib/notifications/server";
import { NOTIFICATION_EVENTS } from "@/features/notifications/events";

export const handlePaymentSucceeded = inngest.createFunction(
  {
    id: "stripe-payment-succeeded",
    retries: 3,
  },
  { event: "stripe/payment.succeeded" },
  async ({ event, step }) => {
    const { paymentIntentId, amount, currency, paymentMethod, invoiceId } =
      event.data as {
        paymentIntentId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        invoiceId: string | null;
      };

    // 1. Resolve the invoice by metadata invoiceId or stripePaymentIntentId
    const invoice = await step.run("resolve-invoice", async () => {
      if (invoiceId) {
        const byId = await db.query.invoices.findFirst({
          where: eq(invoices.id, invoiceId),
          columns: { id: true, orgId: true, number: true, clientId: true, status: true },
        });
        if (byId) return byId;
      }

      return db.query.invoices.findFirst({
        where: eq(invoices.stripePaymentIntentId, paymentIntentId),
        columns: { id: true, orgId: true, number: true, clientId: true, status: true },
      });
    });

    if (!invoice) {
      console.warn(`[handlePaymentSucceeded] No invoice found for PI ${paymentIntentId}`);
      return { ok: true, skipped: "invoice_not_found" };
    }

    // 2. Update invoice status to 'paid'
    await step.run("update-invoice", async () => {
      await db
        .update(invoices)
        .set({
          status: "paid",
          paidAt: new Date(),
          paymentMethod,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));
    });

    // 3. Fetch org + owner for activity log and email
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
        eventType: "invoice.paid",
        metadata: {
          event: "invoice.paid",
          invoiceNumber: invoice.number,
        },
      });
    });


    // 5. Dispatch in-app + email + Slack + SMS notification to agency owner
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
        type: NOTIFICATION_EVENTS.INVOICE_PAID,
        title: `Payment received — Invoice #${invoice.number}`,
        body: `Your client paid Invoice #${invoice.number} via ${paymentMethod}.`,
        actionUrl: `${appUrl}/invoices`,
        actionLabel: "View invoices",
        metadata: { invoiceNumber: invoice.number, paymentMethod, currency },
      });

      return { ok: true };
    });

    return { ok: true, invoiceId: invoice.id };
  },
);
