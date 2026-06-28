/**
 * scripts/warmup.ts
 *
 * Domain warm-up script for clientspace.qzz.io.
 * Sends one email per run to build Gmail sender reputation.
 *
 * Run ONCE daily and mark each email as "Not spam" in Gmail.
 * After 10-14 days, try sending a client invite — it should land.
 *
 * Usage: bun scripts/warmup.ts
 */

import { Resend } from "resend";
import { config } from "dotenv";
import { resolve } from "path";
import crypto from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const TO = "aizensosuke.evilmanipulator@gmail.com";

// Rotate through subjects to look natural — Gmail flags repeated identical subjects
const SUBJECTS = [
  "quick update from clientspace.qzz.io",
  "testing email delivery",
  "checking in",
  "email test from the portal",
  "making sure emails go through",
  "status check",
  "testing our email pipeline",
  "just a test",
  "delivery test",
  "can you see this?",
  "morning check",
  "testing message delivery",
];

const BODIES = [
  `Hi,

Just sending this through to test the pipeline. If you get this, everything's working.

-- The ClientSpace Team`,

  `Hey,

Quick test email to make sure our delivery from clientspace.qzz.io is working as expected.

-- The ClientSpace Team`,

  `Hi there,

Running a routine check on our email system. Let me know if this lands OK.

-- The ClientSpace Team`,

  `Hello,

Testing the email setup from our domain. Seems to be going through on this end.

-- The ClientSpace Team`,

  `Hi,

Another delivery test from clientspace.qzz.io. Let me know if this one shows up.

-- The ClientSpace Team`,

  `Hey,

Quick ping from the email system. Just verifying everything routes correctly.

-- The ClientSpace Team`,

  `Hi,

Just another routine check from the portal email system.

-- The ClientSpace Team`,

  `Hello,

Testing end-to-end delivery from our sending infrastructure today.

-- The ClientSpace Team`,

  `Hi there,

Checking if this lands in the inbox or spam today. Let me know.

-- The ClientSpace Team`,

  `Hey,

Regular delivery check from clientspace.qzz.io. All looking good here.

-- The ClientSpace Team`,

  `Hi,

Another test email going through the pipeline. Testing consistency.

-- The ClientSpace Team`,

  `Hello,

Daily delivery check. Let me know if this reaches you OK.

-- The ClientSpace Team`,
];

function plainText(day: number): string {
  return `${BODIES[day % BODIES.length]}

ClientSpace Inc.
548 Market St, PMB 72285
San Francisco, CA 94104`;
}

function htmlBody(day: number): string {
  const body = BODIES[day % BODIES.length]
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n-- /g, "<br>-- ");
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Helvetica,Arial,sans-serif;color:#333;line-height:1.6;padding:24px;">
<p style="font-size:15px;">${body}</p>
<p style="font-size:12px;color:#999;margin-top:24px;">
ClientSpace Inc. &bull; 548 Market St, PMB 72285 &bull; San Francisco, CA 94104</p>
</body>
</html>`;
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not found in .env.local");
    process.exit(1);
  }

  // Use date as day counter so each day picks the same body (consistent rotation)
  const day = Math.floor(
    (Date.now() - new Date("2026-06-28").getTime()) / 86400000,
  );
  const subject = SUBJECTS[day % SUBJECTS.length];

  console.log(`📧 Warm-up #${day + 1} — ${subject}`);
  console.log(`   From: ClientSpace <hello@clientspace.qzz.io>`);
  console.log(`   To:   ${TO}`);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: "ClientSpace <hello@clientspace.qzz.io>",
    to: TO,
    subject,
    html: htmlBody(day),
    text: plainText(day),
    headers: {
      "X-Entity-Ref-ID": crypto.randomUUID(),
    },
  });

  if (error) {
    console.error("❌ Send failed:", error.message);
    process.exit(1);
  }

  console.log(`✅ Sent! Resend ID: ${data?.id}`);
  console.log("");
  console.log("📬 Now go to Gmail and:");
  console.log("   1. If in SPAM → select it → click 'Not spam'");
  console.log("   2. Reply or star it (positive signals)");
  console.log("   3. Run again tomorrow");
  console.log("");
  console.log(`   Day ${day + 1} of ~14 needed`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
