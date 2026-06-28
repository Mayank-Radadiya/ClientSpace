import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { pool } from "@/db/pool";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResendWebhookPayload = {
  type: string;
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
    bounce_type?: "permanent" | "transient";
    bounce_reason?: string;
    bounce_code?: string;
  };
};

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Optional: verify Resend webhook signature
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("Resend-Signature");
    if (!signature) {
      console.warn("[resend-webhook] Missing signature header");
      return NextResponse.json({ error: "missing signature" }, { status: 401 });
    }

    const expected = createHash("sha256")
      .update(body + secret)
      .digest("hex");

    try {
      const sigBytes = Buffer.from(signature, "utf-8");
      const expectedBytes = Buffer.from(expected, "utf-8");
      if (
        sigBytes.length !== expectedBytes.length ||
        !timingSafeEqual(sigBytes, expectedBytes)
      ) {
        console.warn("[resend-webhook] Invalid signature");
        return NextResponse.json(
          { error: "invalid signature" },
          { status: 401 },
        );
      }
    } catch {
      console.warn("[resend-webhook] Signature verification error");
      return NextResponse.json(
        { error: "verification error" },
        { status: 401 },
      );
    }
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(body) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  // Only handle bounce events
  if (payload.type !== "email.bounced") {
    return NextResponse.json({ received: true });
  }

  if (!payload.data?.to?.length) {
    return NextResponse.json({ error: "missing recipient" }, { status: 400 });
  }

  const recipients = payload.data.to;
  const reason =
    payload.data.bounce_reason ?? payload.data.bounce_code ?? "unknown";
  const bounceType = payload.data.bounce_type ?? "transient";

  console.log(
    `[resend-webhook] Bounce: ${recipients.join(", ")} type=${bounceType} reason=${reason}`,
  );

  try {
    for (const email of recipients) {
      await pool`
        INSERT INTO bounced_emails (email, reason, bounce_type, created_at)
        VALUES (${email.toLowerCase()}, ${reason}, ${bounceType}, NOW())
      `;
    }
  } catch (err) {
    console.error("[resend-webhook] Failed to record bounce:", err);
  }

  return NextResponse.json({ received: true, bounced: recipients });
}
