import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { invitations, organizations, clients } from "@/db/schema";
import { tokenValidationRateLimit } from "@/lib/rateLimit";
import { pool } from "@/db/pool";

export type InvitationWithDetails = {
  id: string;
  email: string;
  clientId: string;
  orgId: string;
  status: "pending" | "in_use" | "accepted" | "expired" | "revoked";
  expiresAt: Date;
  acceptedAt: Date | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  client: {
    id: string;
    companyName: string | null;
    contactName: string | null;
    email: string;
  };
};

async function getRequestIp() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    requestHeaders.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function shouldBypassTokenRateLimit(ip: string) {
  return process.env.NODE_ENV !== "production" || ip === "unknown";
}

/**
 * Fetches a valid invitation by raw token (hashes it first).
 * Returns null if token is invalid, expired, or already accepted.
 * Rate limited by IP address to prevent brute-force attacks.
 */
export async function getInvitationByToken(
  rawToken: string,
): Promise<InvitationWithDetails | null> {
  // Rate limit by IP address (10 attempts per hour)
  const ip = await getRequestIp();

  if (!shouldBypassTokenRateLimit(ip)) {
    const rateLimitResult = tokenValidationRateLimit(ip);
    if (!rateLimitResult.allowed) {
      console.warn(`[getInvitationByToken] Rate limit exceeded for IP: ${ip}`);
      return null; // Return null to appear as invalid token
    }
  }

  // Hash the raw token to match stored tokenHash
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  try {
    const result = await pool`
      SELECT
        i.id,
        i.email,
        i.client_id,
        i.org_id,
        i.status,
        i.expires_at,
        i.accepted_at,
        o.id AS organization_id,
        o.name AS organization_name,
        o.slug AS organization_slug,
        c.id AS client_id_,
        c.company_name AS client_company_name,
        c.contact_name AS client_contact_name,
        c.email AS client_email
      FROM invitations i
      INNER JOIN organizations o ON i.org_id = o.id
      INNER JOIN clients c ON i.client_id = c.id
      WHERE i.token_hash = ${tokenHash}
        AND i.type = 'client'
        AND i.status = 'pending'
        AND i.expires_at > NOW()
      LIMIT 1
    `;

    const row = result[0];
    if (!row) {
      return null;
    }

    const invitation: InvitationWithDetails = {
      id: row.id,
      email: row.email,
      clientId: row.client_id,
      orgId: row.org_id,
      status: row.status,
      expiresAt: row.expires_at,
      acceptedAt: row.accepted_at,
      organization: {
        id: row.organization_id,
        name: row.organization_name,
        slug: row.organization_slug,
      },
      client: {
        id: row.client_id_,
        companyName: row.client_company_name,
        contactName: row.client_contact_name,
        email: row.client_email,
      },
    };

    return invitation;
  } catch (error) {
    console.error("[getInvitationByToken] Query failed:", error);
    return null;
  }
}

/**
 * Reserves invitation token for acceptance flow.
 * Uses SELECT FOR UPDATE NOWAIT + immediate status=in_use update.
 */
export async function reserveInvitationByToken(
  rawToken: string,
): Promise<InvitationWithDetails | null> {
  const ip = await getRequestIp();

  if (!shouldBypassTokenRateLimit(ip)) {
    const rateLimitResult = tokenValidationRateLimit(ip);
    if (!rateLimitResult.allowed) {
      console.warn(
        `[reserveInvitationByToken] Rate limit exceeded for IP: ${ip}`,
      );
      return null;
    }
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  try {
    const lockResult = await pool`
      WITH locked AS (
        SELECT id
        FROM invitations
        WHERE token_hash = ${tokenHash}
          AND type = 'client'
          AND status = 'pending'
          AND expires_at > NOW()
        FOR UPDATE NOWAIT
      )
      UPDATE invitations i
      SET status = 'in_use'
      FROM locked
      WHERE i.id = locked.id
      RETURNING i.id, i.email, i.client_id, i.org_id, i.status, i.expires_at, i.accepted_at
    `;

    const row = lockResult[0];
    if (!row) {
      return null;
    }

    const detailsResult = await pool`
      SELECT
        i.id,
        i.email,
        i.client_id,
        i.org_id,
        i.status,
        i.expires_at,
        i.accepted_at,
        o.id AS organization_id,
        o.name AS organization_name,
        o.slug AS organization_slug,
        c.id AS client_id_,
        c.company_name AS client_company_name,
        c.contact_name AS client_contact_name,
        c.email AS client_email
      FROM invitations i
      INNER JOIN organizations o ON i.org_id = o.id
      INNER JOIN clients c ON i.client_id = c.id
      WHERE i.id = ${row.id}
      LIMIT 1
    `;

    const details = detailsResult[0] ?? null;

    if (!details) {
      await pool`
        UPDATE invitations
        SET status = 'pending'
        WHERE id = ${row.id}
          AND status = 'in_use'
      `;
      return null;
    }

    return {
      id: details.id,
      email: details.email,
      clientId: details.client_id,
      orgId: details.org_id,
      status: details.status,
      expiresAt: details.expires_at,
      acceptedAt: details.accepted_at,
      organization: {
        id: details.organization_id,
        name: details.organization_name,
        slug: details.organization_slug,
      },
      client: {
        id: details.client_id_,
        companyName: details.client_company_name,
        contactName: details.client_contact_name,
        email: details.client_email,
      },
    };
  } catch (error) {
    console.warn("[reserveInvitationByToken] Token lock failed:", error);
    return null;
  }
}
