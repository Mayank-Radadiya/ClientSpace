/**
 * scripts/test-email.ts
 *
 * One-shot test to verify Resend deliverability.
 * Run: bun scripts/test-email.ts
 *
 * Sends a friendly test email so you can check:
 *   1. Resend API is working
 *   2. DKIM/SPF/DMARC pass (check raw source in Gmail)
 *   3. Email lands in inbox (not spam)
 */

import { Resend } from "resend";
import { config } from "dotenv";
import { resolve } from "path";
import crypto from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const TO = "aizensosuke.evilmanipulator@gmail.com";

// Plain text only — no HTML, no links, nothing Gmail filters can latch onto
const TEXT = [
  "Hi there,",
  "",
  "This is a test from clientspace.qzz.io via Resend.",
  "If you get this, the pipeline works.",
  "",
  "-- The ClientSpace Team",
].join("\n");

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not found in .env.local");
    process.exit(1);
  }

  console.log("Sending bare-minimum plain-text email...");
  console.log(`  From: ClientSpace <onboarding@resend.dev>`);
  console.log(`  To:   ${TO}`);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: "ClientSpace <hello@clientspace.qzz.io>",
    to: TO,
    subject: "quick check",
    text: TEXT,
    headers: {
      "X-Entity-Ref-ID": crypto.randomUUID(),
    },
  });

  if (error) {
    console.error("Resend API error:", error.message);
    process.exit(1);
  }

  console.log(`Sent! Resend ID: ${data?.id}`);
  console.log("Check your inbox.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
