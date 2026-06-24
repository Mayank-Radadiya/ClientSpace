/**
 * src/emails/send.ts
 *
 * Central Resend sending utility.
 * Supports white-label custom email domains: pass `orgId` to route email
 * from the agency's verified custom domain instead of ClientSpace's default.
 *
 * Fallback chain:
 *   1. org.customEmailVerified && org.customEmailDomain → "AgencyName <hello@theirdomain.com>"
 *   2. Otherwise → "Agency via ClientSpace <noreply@clientspace.qzz.io>"
 *
 * Reply-To is always set to the agency owner's email when orgId is provided.
 */

import { Resend } from "resend";
import { ClientInviteEmail } from "./ClientInviteEmail";
import { FirstClientAddedEmail } from "./FirstClientAddedEmail";
import { pool } from "@/db/pool";

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDING_EMAIL = "hello@clientspace.qzz.io";
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
  const envEmail =
    process.env.ONBOARDING_FROM_EMAIL ??
    process.env.INVITE_FROM_EMAIL ??
    SENDING_EMAIL;

  // Ensure the default from address has a display name to prevent spam flagging
  const defaultFrom = envEmail.includes("<")
    ? envEmail
    : `ClientSpace <${envEmail}>`;

  // Extract just the raw email address for the 'via' formatting
  const rawEmail = envEmail.includes("<")
    ? (envEmail.match(/<([^>]+)>/)?.[1] ?? SENDING_EMAIL)
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

    // Unverified domain — fall back with transparent attribution
    const fromName = fallbackFromName ?? org.name;
    return {
      fromAddress: `${fromName} via ClientSpace <${rawEmail}>`,
      replyTo: owner?.email,
    };
  } catch (err) {
    console.error("[send.ts] Failed to resolve org email config:", err);
    return { fromAddress: defaultFrom };
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

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: opts.to,
    ...(replyTo ? { replyTo } : {}),
    subject: `Access your client portal`,
    react: ClientInviteEmail({
      contactName: opts.contactName,
      companyName: opts.companyName,
      inviterName: opts.inviterName,
      inviteUrl: opts.inviteUrl,
    }),
    text: `Hello ${opts.contactName},\n\n${opts.inviterName} has set up an account for you on their client portal.\n\nYou can now log in to view your projects, access shared documents, and manage invoices.\n\nSign in to your portal: ${opts.inviteUrl}\n\nThis link expires in 72 hours.\n\nQuestions? Reply to reach ${opts.inviterName} directly.\n\n© ${new Date().getFullYear()} ClientSpace Inc.`,
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

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: opts.to,
    ...(replyTo ? { replyTo } : {}),
    subject: "Your first client has been added",
    react: FirstClientAddedEmail({
      clientCompanyName: opts.clientCompanyName,
      clientContactName: opts.clientContactName,
      clientEmail: opts.clientEmail,
    }),
    text: `Your first client has been added!\n\nClient Name: ${opts.clientContactName}\nCompany: ${opts.clientCompanyName}\nEmail: ${opts.clientEmail}\n\nClientSpace Inc.`,
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }
}
