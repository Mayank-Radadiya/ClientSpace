import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations } from "@/db/schema";

// ─── Resend DNS record type ───────────────────────────────────────────────────

interface ResendDnsRecord {
  record: string;
  name: string;
  type: string;
  ttl: string;
  status: string;
  value: string;
  priority?: number;
}

interface ResendDomainResponse {
  id: string;
  name: string;
  status: string;
  records: ResendDnsRecord[];
}

// ─── Resend helper ────────────────────────────────────────────────────────────

async function resendRequest<T>(
  path: string,
  method: "GET" | "POST" | "DELETE" | "PATCH",
  body?: unknown,
): Promise<T> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "RESEND_API_KEY is not configured.",
    });
  }

  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Resend API error (${response.status}): ${text}`,
    });
  }

  return response.json() as Promise<T>;
}

// ─── Domain validator ─────────────────────────────────────────────────────────

const domainSchema = z
  .string()
  .min(4)
  .max(253)
  .regex(
    /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
    "Must be a valid domain name (e.g. acmecreative.com)",
  );

// ─── Router ───────────────────────────────────────────────────────────────────

export const organizationsRouter = createTRPCRouter({
  /**
   * Add a custom email sending domain via Resend.
   * Returns the DNS records the agency needs to add to their DNS provider.
   */
  addEmailDomain: protectedProcedure
    .input(z.object({ domain: domainSchema }))
    .mutation(async ({ ctx, input }) => {
      // Call Resend to create the domain
      const resendDomain = await resendRequest<ResendDomainResponse>(
        "/domains",
        "POST",
        { name: input.domain },
      );

      // Persist to DB
      await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
        await tx
          .update(organizations)
          .set({
            customEmailDomain: input.domain,
            customEmailDomainId: resendDomain.id,
            customEmailVerified: false,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, ctx.orgId));
      });

      return {
        domain: input.domain,
        domainId: resendDomain.id,
        status: resendDomain.status,
        records: resendDomain.records,
      };
    }),

  /**
   * Verify a previously added custom email domain.
   * Calls Resend's verify endpoint and updates the DB.
   */
  verifyEmailDomain: protectedProcedure
    .input(z.object({}))
    .mutation(async ({ ctx }) => {
      // Fetch current domain config
      const org = await withRLS(
        { userId: ctx.userId, orgId: ctx.orgId },
        async (tx) => {
          return tx.query.organizations.findFirst({
            where: eq(organizations.id, ctx.orgId),
            columns: {
              customEmailDomain: true,
              customEmailDomainId: true,
              customEmailVerified: true,
            },
          });
        },
      );

      if (!org?.customEmailDomainId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No email domain has been added. Add a domain first.",
        });
      }

      if (org.customEmailVerified) {
        return { verified: true, domain: org.customEmailDomain };
      }

      // Call Resend verify
      const result = await resendRequest<{ id: string; object: string }>(
        `/domains/${org.customEmailDomainId}/verify`,
        "POST",
      );

      // Fetch updated domain status
      const domainStatus = await resendRequest<ResendDomainResponse>(
        `/domains/${org.customEmailDomainId}`,
        "GET",
      );

      const verified = domainStatus.status === "verified";

      if (verified) {
        await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
          await tx
            .update(organizations)
            .set({ customEmailVerified: true, updatedAt: new Date() })
            .where(eq(organizations.id, ctx.orgId));
        });
      }

      return {
        verified,
        domain: org.customEmailDomain,
        status: domainStatus.status,
        records: domainStatus.records,
        _resendId: result.id,
      };
    }),

  /**
   * Remove a custom email sending domain.
   * Clears the DB columns and deletes from Resend.
   */
  removeEmailDomain: protectedProcedure
    .input(z.object({}))
    .mutation(async ({ ctx }) => {
      const org = await withRLS(
        { userId: ctx.userId, orgId: ctx.orgId },
        async (tx) => {
          return tx.query.organizations.findFirst({
            where: eq(organizations.id, ctx.orgId),
            columns: {
              customEmailDomainId: true,
              customEmailDomain: true,
            },
          });
        },
      );

      if (!org?.customEmailDomainId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No email domain is configured.",
        });
      }

      // Delete from Resend (best-effort — don't fail if already removed)
      try {
        await resendRequest(
          `/domains/${org.customEmailDomainId}`,
          "DELETE",
        );
      } catch (err) {
        console.warn("[removeEmailDomain] Resend domain delete failed:", err);
      }

      // Clear from DB
      await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
        await tx
          .update(organizations)
          .set({
            customEmailDomain: null,
            customEmailDomainId: null,
            customEmailVerified: false,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, ctx.orgId));
      });

      return { success: true, removedDomain: org.customEmailDomain };
    }),

  /**
   * Update all white-label branding fields via tRPC.
   * (Companion to the Server Action approach in brandingActions.ts)
   */
  updateBranding: protectedProcedure
    .input(
      z.object({
        brandName: z.string().max(50).nullable(),
        accentColor: z.string().max(100).nullable(),
        accentColorDark: z.string().max(100).nullable(),
        poweredByHidden: z.boolean(),
        customEmailFromName: z.string().max(100).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
        await tx
          .update(organizations)
          .set({
            brandName: input.brandName || null,
            accentColor: input.accentColor || null,
            accentColorDark: input.accentColorDark || null,
            poweredByHidden: input.poweredByHidden,
            customEmailFromName: input.customEmailFromName || null,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, ctx.orgId));
      });

      return { success: true };
    }),

  /**
   * Get current email domain status (for polling during DNS verification).
   */
  getEmailDomainStatus: protectedProcedure.query(async ({ ctx }) => {
    const org = await withRLS(
      { userId: ctx.userId, orgId: ctx.orgId },
      async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, ctx.orgId),
          columns: {
            customEmailDomain: true,
            customEmailDomainId: true,
            customEmailVerified: true,
            customEmailFromName: true,
          },
        });
      },
    );

    if (!org?.customEmailDomainId) {
      return { configured: false };
    }

    // Fetch live status from Resend
    let records: ResendDnsRecord[] = [];
    let status = "not_started";
    try {
      const domain = await resendRequest<ResendDomainResponse>(
        `/domains/${org.customEmailDomainId}`,
        "GET",
      );
      records = domain.records;
      status = domain.status;
    } catch {
      // If Resend is unreachable, return what we have in DB
    }

    return {
      configured: true,
      domain: org.customEmailDomain,
      verified: org.customEmailVerified,
      fromName: org.customEmailFromName,
      records,
      status,
    };
  }),
});
