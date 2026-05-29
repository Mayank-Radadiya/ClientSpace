// src/features/organizations/server/router.ts
// tRPC router for custom domain management.
// Only owners and admins may manage the organization's custom domain.
// Rate limited: max 3 domain changes per org per 24 hours (stored in Redis).

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations } from "@/db/schema";
import {
  addDomainToVercel,
  getDomainVerificationStatus,
  removeDomainFromVercel,
} from "@/lib/vercel/domains";
import { redis, getRedisKey } from "@/lib/redis";

// ── Constants ────────────────────────────────────────────────────────────────

/** The CNAME value agencies must point their DNS records to. */
const CNAME_TARGET = "cname.vercel-dns.com";

/** Domains that must never be accepted as custom domains. */
const RESERVED_PATTERNS = [
  "clientspace",
  "vercel.app",
  "localhost",
  "vercel-dns",
];

/** Max domain changes allowed per org per 24 hours. */
const MAX_DOMAIN_CHANGES_PER_DAY = 3;
const RATE_LIMIT_WINDOW_SECONDS = 86400; // 24h

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireOwnerOrAdmin(role: string, action = "manage the custom domain") {
  if (role !== "owner" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Only owners and admins can ${action}.`,
    });
  }
}

/** Normalize a user-supplied domain: strip protocol, trailing slash, lowercase. */
function normalizeDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();
}

/** Basic hostname validation — must be a proper FQDN, not an IP, not a bare TLD. */
const domainSchema = z
  .string()
  .min(1, "Domain is required")
  .regex(
    /^[a-z0-9][a-z0-9.-]{1,250}[a-z0-9]\.[a-z]{2,}$/i,
    "Invalid domain format. Use the format: portal.youragency.com",
  );

/** Rejects IP addresses (simple IPv4 check). */
function rejectIpAddress(domain: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "IP addresses are not allowed. Use a proper hostname with a TLD.",
    });
  }
}

/** Rejects reserved domains that are not allowed as custom portals. */
function rejectReservedDomain(domain: string) {
  for (const pattern of RESERVED_PATTERNS) {
    if (domain.includes(pattern)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `The domain "${domain}" is not allowed as a custom portal domain.`,
      });
    }
  }
}

/** Rate limit helper — throws TRPCError if org has hit the daily limit. */
async function checkDomainChangeRateLimit(orgId: string) {
  const key = getRedisKey(`domain:ratelimit:${orgId}`);
  const current = await redis.get<number>(key);
  if (current !== null && current >= MAX_DOMAIN_CHANGES_PER_DAY) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `You have reached the maximum of ${MAX_DOMAIN_CHANGES_PER_DAY} domain changes per 24 hours. Please try again later.`,
    });
  }
}

async function incrementDomainChangeRateLimit(orgId: string) {
  const key = getRedisKey(`domain:ratelimit:${orgId}`);
  await redis.incr(key);
  // Only set TTL on first increment (prevents TTL reset on every change)
  const current = await redis.get<number>(key);
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }
}

/** Invalidate the middleware domain lookup cache for a given domain. */
async function invalidateDomainCache(domain: string) {
  const key = getRedisKey(`domain:lookup:${domain}`);
  await redis.del(key);
}

// ── Router ───────────────────────────────────────────────────────────────────

export const organizationsRouter = createTRPCRouter({
  /**
   * Submit a new custom domain for the organization.
   *
   * Validates → normalizes → checks uniqueness → calls Vercel API → updates DB.
   * Returns CNAME instructions for the agency to configure in their DNS provider.
   */
  addCustomDomain: protectedProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx.role);

      // Rate limit: 3 domain changes per 24h per org
      await checkDomainChangeRateLimit(ctx.orgId);

      // Normalize: strip protocol, trailing slash, lowercase
      const domain = normalizeDomain(input.domain);

      // Validate format after normalization
      const parseResult = domainSchema.safeParse(domain);
      if (!parseResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: parseResult.error.issues[0]?.message ?? "Invalid domain format.",
        });
      }

      // Reject IPs and reserved domains
      rejectIpAddress(domain);
      rejectReservedDomain(domain);

      // Check uniqueness — another org may not use this domain
      const conflict = await withRLS(
        { userId: ctx.userId, orgId: ctx.orgId },
        async (tx) => {
          return tx.query.organizations.findFirst({
            where: and(
              eq(organizations.customDomain, domain),
              ne(organizations.id, ctx.orgId),
            ),
            columns: { id: true },
          });
        },
      );

      if (conflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This domain is already configured by another workspace. If you believe this is an error, contact support.",
        });
      }

      // Add domain to Vercel project
      const vercelResult = await addDomainToVercel(domain);
      if (!vercelResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: vercelResult.error ?? "Failed to add domain to Vercel.",
        });
      }

      // Persist to DB
      await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
        await tx
          .update(organizations)
          .set({
            customDomain: domain,
            customDomainVerified: false,
            customDomainStatus: "pending",
            customDomainError: null,
            customDomainAddedAt: new Date(),
            customDomainVerifiedAt: null,
          })
          .where(eq(organizations.id, ctx.orgId));
      });

      // Increment rate limit counter
      await incrementDomainChangeRateLimit(ctx.orgId);

      // Determine subdomain part for instructions
      const parts = domain.split(".");
      // e.g. "portal.acmecreative.com" → subdomain is "portal"
      const subdomainPart =
        parts.length > 2 ? parts.slice(0, parts.length - 2).join(".") : "@";

      const instructions =
        `Create a CNAME record in your DNS provider:\n` +
        `  Type:  CNAME\n` +
        `  Name:  ${subdomainPart}\n` +
        `  Value: ${CNAME_TARGET}\n` +
        `  TTL:   3600\n\n` +
        `DNS changes can take up to 48 hours to propagate. We'll automatically check and activate your domain.`;

      return {
        cnameTarget: CNAME_TARGET,
        subdomainPart,
        domain,
        instructions,
      };
    }),

  /**
   * Poll Vercel for the current DNS verification status of the org's custom domain.
   * Called by the UI polling loop — must be fast (< 300ms on cache hit).
   *
   * If now active and not yet marked verified in DB, updates the org record.
   */
  checkDomainStatus: protectedProcedure.query(async ({ ctx }) => {
    requireOwnerOrAdmin(ctx.role);

    const org = await withRLS(
      { userId: ctx.userId, orgId: ctx.orgId },
      async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, ctx.orgId),
          columns: {
            customDomain: true,
            customDomainVerified: true,
            customDomainStatus: true,
            customDomainError: true,
            customDomainAddedAt: true,
            customDomainVerifiedAt: true,
          },
        });
      },
    );

    if (!org) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });
    }

    // No domain configured
    if (!org.customDomain) {
      return { status: "none" as const };
    }

    // Call Vercel API
    const vercelStatus = await getDomainVerificationStatus(org.customDomain);

    // If newly active, update the org record
    if (vercelStatus.status === "active" && !org.customDomainVerified) {
      await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
        await tx
          .update(organizations)
          .set({
            customDomainVerified: true,
            customDomainStatus: "active",
            customDomainError: null,
            customDomainVerifiedAt: new Date(),
          })
          .where(eq(organizations.id, ctx.orgId));
      });
    }

    // If error, persist the error message
    if (vercelStatus.status === "error" && vercelStatus.error) {
      await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
        await tx
          .update(organizations)
          .set({
            customDomainStatus: "error",
            customDomainError: vercelStatus.error,
          })
          .where(eq(organizations.id, ctx.orgId));
      });
    }

    return {
      status: vercelStatus.status,
      verified: vercelStatus.verified,
      domain: org.customDomain,
      cnameTarget: vercelStatus.cnameTarget ?? CNAME_TARGET,
      txtRecord: vercelStatus.txtRecord,
      error: vercelStatus.error ?? org.customDomainError,
      addedAt: org.customDomainAddedAt,
      verifiedAt: org.customDomainVerifiedAt,
    };
  }),

  /**
   * Remove the custom domain from the organization.
   * Calls Vercel API to de-provision, then clears DB columns.
   * Invalidates the Redis domain lookup cache.
   */
  removeCustomDomain: protectedProcedure.mutation(async ({ ctx }) => {
    requireOwnerOrAdmin(ctx.role);

    const org = await withRLS(
      { userId: ctx.userId, orgId: ctx.orgId },
      async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, ctx.orgId),
          columns: { customDomain: true },
        });
      },
    );

    if (!org?.customDomain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No custom domain is configured for this organization.",
      });
    }

    const domain = org.customDomain;

    // Remove from Vercel (best-effort)
    await removeDomainFromVercel(domain);

    // Invalidate Redis lookup cache so middleware stops routing this domain
    await invalidateDomainCache(domain);

    // Clear DB
    await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
      await tx
        .update(organizations)
        .set({
          customDomain: null,
          customDomainVerified: false,
          customDomainStatus: "none",
          customDomainError: null,
          customDomainAddedAt: null,
          customDomainVerifiedAt: null,
        })
        .where(eq(organizations.id, ctx.orgId));
    });

    return { success: true };
  }),

  /**
   * Returns the current org's custom domain settings.
   * Used to hydrate the settings page on initial load.
   */
  getDomainSettings: protectedProcedure.query(async ({ ctx }) => {
    requireOwnerOrAdmin(ctx.role);

    const org = await withRLS(
      { userId: ctx.userId, orgId: ctx.orgId },
      async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, ctx.orgId),
          columns: {
            slug: true,
            customDomain: true,
            customDomainVerified: true,
            customDomainStatus: true,
            customDomainError: true,
            customDomainAddedAt: true,
            customDomainVerifiedAt: true,
          },
        });
      },
    );

    if (!org) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });
    }

    return {
      slug: org.slug,
      customDomain: org.customDomain,
      customDomainVerified: org.customDomainVerified,
      customDomainStatus: org.customDomainStatus as
        | "none"
        | "pending"
        | "verifying"
        | "active"
        | "error",
      customDomainError: org.customDomainError,
      customDomainAddedAt: org.customDomainAddedAt,
      customDomainVerifiedAt: org.customDomainVerifiedAt,
      cnameTarget: CNAME_TARGET,
    };
  }),
});
