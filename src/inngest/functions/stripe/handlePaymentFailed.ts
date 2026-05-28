// src/inngest/functions/stripe/handlePaymentFailed.ts
// Handles stripe/payment.failed events dispatched by the webhook handler.
// Reverts invoice status to 'sent', writes an activity log, sends failure email to the agency.

import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { activityLogs, invoices, organizations, users } from "@/db/schema";
import { inngest } from "@/inngest/client";

const resend = new Resend(process.env.RESEND_API_KEY);

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
          // Use 'invoice.sent' union variant (closest available for failed payments)
          event: "invoice.sent",
          invoiceNumber: invoice.number,
          amountCents: 0,
        },
      });
    });


    // 5. Send failure notification email to agency owner
    await step.run("send-email", async () => {
      if (!process.env.RESEND_API_KEY || !org) {
        return { ok: true, skipped: "resend_not_configured_or_org_missing" };
      }

      const owner = await db.query.users.findFirst({
        where: eq(users.id, org.ownerId),
        columns: { email: true, name: true },
      });

      if (!owner) return { ok: true, skipped: "owner_not_found" };

      const fromEmail =
        process.env.ONBOARDING_FROM_EMAIL ??
        process.env.INVITE_FROM_EMAIL ??
        "onboarding@resend.dev";

      const result = await resend.emails.send({
        from: fromEmail,
        to: owner.email,
        subject: `Payment failed — Invoice #${invoice.number}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111827;">
            <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #dc2626;">Payment failed</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
              A payment attempt for Invoice #${invoice.number} was unsuccessful.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: 500;">
                Reason: ${errorMessage}
              </p>
            </div>
            <p style="font-size: 13px; color: #9ca3af;">
              The invoice is still outstanding. Your client can retry payment from their portal.
            </p>
          </div>
        `,
      });

      if (result.error) {
        console.error(`[handlePaymentFailed] Resend error: ${result.error.message}`);
      }

      return { ok: true };
    });

    return { ok: true, invoiceId: invoice.id };
  },
);
