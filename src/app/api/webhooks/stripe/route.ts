// src/app/api/webhooks/stripe/route.ts
// Stripe webhook endpoint — POST only.
// Security: raw body + signature verification (NEVER parse as JSON first).
// All DB work is delegated to Inngest functions — this handler returns 200 FAST.

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { inngest } from "@/inngest/client";

export const dynamic = "force-dynamic";

// Only POST is valid — other methods return 405
export async function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.warn("[stripe/webhook] Missing stripe-signature header.");
    return new NextResponse("Missing signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  // CRITICAL: Read raw body as text — must NOT be parsed as JSON.
  // JSON.parse() or body parsers mutate the body and break signature verification.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error("[stripe/webhook] Failed to read request body:", (err as Error).message);
    return new NextResponse("Failed to read body", { status: 400 });
  }

  // Verify the webhook signature — returns parsed event or throws
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    // Log only the error message, never the full body or signature
    console.error(
      `[stripe/webhook] Signature verification failed: ${(err as Error).message}`,
    );
    return new NextResponse("Webhook signature invalid", { status: 400 });
  }

  // Log the event type + ID only — never the full event object
  console.info(`[stripe/webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as {
          id: string;
          amount: number;
          currency: string;
          payment_method_types: string[];
          metadata?: Record<string, string>;
        };

        await inngest.send({
          name: "stripe/payment.succeeded",
          data: {
            paymentIntentId: pi.id,
            amount: pi.amount,
            currency: pi.currency,
            paymentMethod: pi.payment_method_types[0] ?? "card",
            invoiceId: pi.metadata?.invoiceId ?? null,
          },
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as {
          id: string;
          last_payment_error?: { message?: string };
          metadata?: Record<string, string>;
        };

        await inngest.send({
          name: "stripe/payment.failed",
          data: {
            paymentIntentId: pi.id,
            errorMessage: pi.last_payment_error?.message ?? "Payment failed",
            invoiceId: pi.metadata?.invoiceId ?? null,
          },
        });
        break;
      }

      case "account.updated": {
        const account = event.data.object as {
          id: string;
          charges_enabled: boolean;
          payouts_enabled: boolean;
        };

        await inngest.send({
          name: "stripe/account.updated",
          data: {
            stripeAccountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
          },
        });
        break;
      }

      default:
        // Acknowledge all other events without processing
        console.info(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // If Inngest dispatch fails, return 500 so Stripe retries
    console.error(
      `[stripe/webhook] Inngest dispatch failed for event ${event.id}:`,
      (err as Error).message,
    );
    return new NextResponse("Dispatch failed", { status: 500 });
  }

  // Always return 200 after dispatching — Stripe will retry on non-2xx
  return new NextResponse("OK", { status: 200 });
}
