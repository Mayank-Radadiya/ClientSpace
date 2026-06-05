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
import { eq } from "drizzle-orm";
import { ClientInviteEmail } from "./ClientInviteEmail";
import { FirstClientAddedEmail } from "./FirstClientAddedEmail";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { organizations, orgMemberships, users } from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    "hello@clientspace.qzz.io";

  // Ensure the default from address has a display name to prevent spam flagging
  const defaultFrom = envEmail.includes("<")
    ? envEmail
    : `ClientSpace <${envEmail}>`;

  // Extract just the raw email address for the 'via' formatting
  const rawEmail = envEmail.includes("<")
    ? envEmail.match(/<([^>]+)>/)?.[1] ?? "hello@clientspace.qzz.io"
    : envEmail;

  if (!orgId) {
    return { fromAddress: defaultFrom };
  }

  try {
    // Use a system-level (no RLS) read to fetch org config.
    // This is intentional: send.ts runs as a backend utility, not as a user.
    const db = await createDrizzleClient({ userId: "SYSTEM", orgId });

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: {
        name: true,
        ownerId: true,
        customEmailDomain: true,
        customEmailFromName: true,
        customEmailVerified: true,
      },
    });

    if (!org) return { fromAddress: defaultFrom };

    // Fetch the owner's email for Reply-To
    const owner = await db.query.users.findFirst({
      where: eq(users.id, org.ownerId),
      columns: { email: true },
    });

    if (org.customEmailVerified && org.customEmailDomain) {
      const fromName = org.customEmailFromName ?? org.name;
      return {
        fromAddress: `${fromName} <hello@${org.customEmailDomain}>`,
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
    text: `Hello ${opts.contactName},\n\n${opts.inviterName} has set up an account for you on their client portal.\n\nYou can now log in to view your projects, access shared documents, and manage invoices.\n\nAccess Your Account: ${opts.inviteUrl}\n\nThis secure access link will remain active for 72 hours.\n\nIf you have any questions, you can reply directly to this email to reach ${opts.inviterName}.\n\n© ${new Date().getFullYear()} ClientSpace Inc. All rights reserved.\n123 Business Avenue, Suite 100 • New York, NY 10001\nIf you did not expect this email, you can safely ignore it.`,
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
