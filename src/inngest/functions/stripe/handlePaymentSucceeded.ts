// src/inngest/functions/stripe/handlePaymentSucceeded.ts
// Handles stripe/payment.succeeded events dispatched by the webhook handler.
// Updates invoice to 'paid', writes an activity log, sends Resend email to the agency owner.

import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { activityLogs, invoices, organizations, users } from "@/db/schema";
import { inngest } from "@/inngest/client";

const resend = new Resend(process.env.RESEND_API_KEY);

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


    // 5. Send email to agency owner via Resend
    await step.run("send-email", async () => {
      if (!process.env.RESEND_API_KEY || !org) {
        return { ok: true, skipped: "resend_not_configured_or_org_missing" };
      }

      const owner = await db.query.users.findFirst({
        where: eq(users.id, org.ownerId),
        columns: { email: true, name: true },
      });

      if (!owner) return { ok: true, skipped: "owner_not_found" };

      const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
      }).format(amount / 100);

      const fromEmail =
        process.env.ONBOARDING_FROM_EMAIL ??
        process.env.INVITE_FROM_EMAIL ??
        "onboarding@resend.dev";

      const result = await resend.emails.send({
        from: fromEmail,
        to: owner.email,
        subject: `Payment received — Invoice #${invoice.number}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111827;">
            <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600;">Payment received 🎉</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
              Your client has paid Invoice #${invoice.number} via ${paymentMethod}.
            </p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">
                ${formattedAmount}
              </p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">
                Invoice #${invoice.number} · ${paymentMethod}
              </p>
            </div>
            <p style="font-size: 13px; color: #9ca3af;">
              Funds will be transferred to your bank account within 2 business days.
            </p>
          </div>
        `,
      });

      if (result.error) {
        // Don't throw — email failure should not retry the whole function
        console.error(`[handlePaymentSucceeded] Resend error: ${result.error.message}`);
      }

      return { ok: true };
    });

    return { ok: true, invoiceId: invoice.id };
  },
);
