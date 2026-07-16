/**
 * src/emails/send.ts
 *
 * Central Resend sending utility.
 * Supports white-label custom email domains: pass `orgId` to route email
 * from the agency's verified custom domain instead of ClientSpace's default.
 *
 * Fallback chain:
 *   1. org.customEmailVerified && org.customEmailDomain → "AgencyName <hello@theirdomain.com>"
 * Fallback chain:
 *   1. org.customEmailVerified && org.customEmailDomain → "AgencyName <hello@theirdomain.com>"
 *   2. Otherwise → DEFAULT_FROM_EMAIL env variable or "ClientSpace <hello@clientspace.qzz.io>"
 *
 * Reply-To is always set to the agency owner's email when orgId is provided.
 */

import crypto from "crypto";
import { Resend } from "resend";
import { ClientInviteEmail } from "./ClientInviteEmail";
import { FirstClientAddedEmail } from "./FirstClientAddedEmail";
import { pool } from "@/db/pool";

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_SENDER =
  process.env.DEFAULT_FROM_EMAIL ??
  process.env.RESEND_FROM_EMAIL ??
  process.env.ONBOARDING_FROM_EMAIL ??
  process.env.INVITE_FROM_EMAIL ??
  "ClientSpace <hello@clientspace.qzz.io>";

const PHYSICAL_ADDRESS = "548 Market St, PMB 72285, San Francisco, CA 94104";
// ponytail: physical address added for CAN-SPAM compliance — update if office moves
// ─── Types ────────────────────────────────────────────────────────────────────

type SendClientInviteOptions = {
  to: string;
  contactName: string;
  companyName: string;
  inviterName: string;
  inviteUrl: string;
  /** If provided, use the org's custom email domain (if verified). */
  orgId?: string;
};

type SendFirstClientAddedOptions = {
  to: string;
  clientCompanyName: string;
  clientContactName: string;
  clientEmail: string;
  /** If provided, use the org's custom email domain (if verified). */
  orgId?: string;
};

// ─── From address resolution ──────────────────────────────────────────────────

interface OrgEmailConfig {
  fromAddress: string;
  replyTo?: string;
}

/**
 * Resolve the `from:` address for an outgoing email.
 * Uses the org's verified custom domain if configured; falls back to ClientSpace default.
 */
async function resolveOrgEmailConfig(
  orgId: string | undefined,
  fallbackFromName?: string,
): Promise<OrgEmailConfig> {
  const envEmail = DEFAULT_SENDER;

  // Ensure the default from address has a display name to prevent spam flagging
  const defaultFrom = envEmail.includes("<")
    ? envEmail
    : `ClientSpace <${envEmail}>`;

  // Extract just the raw email address for the 'via' formatting
  const rawEmail = envEmail.includes("<")
    ? (envEmail.match(/<([^>]+)>/)?.[1] ?? "hello@clientspace.qzz.io")
    : envEmail;

  if (!orgId) {
    return { fromAddress: defaultFrom };
  }

  try {
    // Use pool directly (bypass RLS) to fetch org config.
    // This is intentional: send.ts runs as a backend utility, not as a user.
    // withRLS would set empty JWT claims (userId "SYSTEM" is not a UUID),
    // which can cause RLS policies using auth.uid() to block the query.
    const orgRows = await pool`
      SELECT
        name,
        owner_id,
        custom_email_domain,
        custom_email_from_name,
        custom_email_verified
      FROM organizations
      WHERE id = ${orgId}
      LIMIT 1
    `;

    const org = orgRows[0] ?? null;
    if (!org) return { fromAddress: defaultFrom };

    // Fetch the owner's email for Reply-To
    const ownerRows = await pool`
      SELECT email FROM users WHERE id = ${org.owner_id} LIMIT 1
    `;
    const owner = ownerRows[0] ?? null;

    if (org.custom_email_verified && org.custom_email_domain) {
      const fromName = org.custom_email_from_name ?? org.name;
      return {
        fromAddress: `${fromName} <hello@${org.custom_email_domain}>`,
        replyTo: owner?.email,
      };
    }

    // Unverified domain — fall back to clean ClientSpace sender (no "via" — avoids spam filters)
    return {
      fromAddress: defaultFrom,
      replyTo: owner?.email,
    };
  } catch (err) {
    console.error("[send.ts] Failed to resolve org email config:", err);
    return { fromAddress: defaultFrom };
  }
}

// ─── Bounce check ─────────────────────────────────────────────────────────────

/**
 * Check if an email address has previously bounced.
 * Returns true if the address has at least one bounce record.
 */
async function hasBounced(email: string): Promise<boolean> {
  try {
    const rows = await pool`
      SELECT 1 FROM bounced_emails
      WHERE email = ${email.toLowerCase()}
        AND bounce_type = 'permanent'
      LIMIT 1
    `;
    return rows.length > 0;
  } catch (err) {
    console.error("[send.ts] Bounce check failed:", err);
    return false; // fail open — don't block sends on DB error
  }
}

// ─── Send functions ───────────────────────────────────────────────────────────

export async function sendClientInviteEmail(opts: SendClientInviteOptions) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { fromAddress, replyTo } = await resolveOrgEmailConfig(
    opts.orgId,
    opts.companyName,
  );

  if (await hasBounced(opts.to)) {
    console.warn(
      `[send.ts] Skipping invite to ${opts.to} — address has bounced previously`,
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: opts.to,
    ...(replyTo ? { replyTo } : {}),
    subject: `You've been invited to ${opts.companyName}'s client portal`,
    headers: {
      "X-Entity-Ref-ID": crypto.randomUUID(), // unique per send — reduces duplicate spam scoring
    },
    react: ClientInviteEmail({
      contactName: opts.contactName,
      companyName: opts.companyName,
      inviterName: opts.inviterName,
      inviteUrl: opts.inviteUrl,
    }),
    text: [
      `Hi ${opts.contactName},`,
      ``,
      `${opts.inviterName} has invited you to access the ${opts.companyName} client portal on ClientSpace.`,
      ``,
      `Click the link below to accept your invitation:`,
      opts.inviteUrl,
      ``,
      `This link expires in 48 hours.`,
      ``,
      `If you didn't expect this email, you can safely ignore it.`,
      ``,
      `— The ClientSpace Team`,
      `https://clientspace.qzz.io`,
      PHYSICAL_ADDRESS,
    ].join("\n"),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }
}

export async function sendFirstClientAddedEmail(
  opts: SendFirstClientAddedOptions,
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { fromAddress, replyTo } = await resolveOrgEmailConfig(opts.orgId);

  if (await hasBounced(opts.to)) {
    console.warn(
      `[send.ts] Skipping notification to ${opts.to} — address has bounced previously`,
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: opts.to,
    ...(replyTo ? { replyTo } : {}),
    subject: `${opts.clientContactName} has been added to your ClientSpace workspace`,
    headers: {
      "X-Entity-Ref-ID": crypto.randomUUID(),
    },
    react: FirstClientAddedEmail({
      clientCompanyName: opts.clientCompanyName,
      clientContactName: opts.clientContactName,
      clientEmail: opts.clientEmail,
    }),
    text: [
      `${opts.clientContactName} (${opts.clientCompanyName}) has been added to your ClientSpace workspace.`,
      ``,
      `Client details:`,
      `  Name: ${opts.clientContactName}`,
      `  Company: ${opts.clientCompanyName}`,
      `  Email: ${opts.clientEmail}`,
      ``,
      `— The ClientSpace Team`,
      `https://clientspace.qzz.io`,
      PHYSICAL_ADDRESS,
    ].join("\n"),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }
}
