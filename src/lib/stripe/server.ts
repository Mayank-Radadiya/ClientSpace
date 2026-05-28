// src/lib/stripe/server.ts
// Singleton Stripe client — server-side ONLY.
// Never import this file from a "use client" component.
// STRIPE_SECRET_KEY must never be exposed to the browser.

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "[stripe/server] STRIPE_SECRET_KEY is not set. Add it to .env.local.",
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
  // Telemetry opt-out for privacy compliance
  telemetry: false,
});
