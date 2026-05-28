// src/features/billing/server/router.ts
// tRPC router for Stripe Connect agency billing flows.
// All procedures require owner/admin role — clients cannot access these.

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations } from "@/db/schema";
import { stripe } from "@/lib/stripe/server";

// ── Role guard middleware ────────────────────────────────────────────────────
function requireOwnerOrAdmin(role: string) {
  if (role !== "owner" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners and admins can manage billing.",
    });
  }
}

export const billingRouter = createTRPCRouter({
  /**
   * Creates a Stripe Express Connect account (idempotent — reuses existing if
   * stripeAccountId already set), generates an account_links onboarding URL,
   * saves the accountId to the org record, and returns { url }.
   */
  createConnectLink: protectedProcedure.mutation(async ({ ctx }) => {
    requireOwnerOrAdmin(ctx.role);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Fetch current org to check if account already exists
    const org = await withRLS(
      { userId: ctx.userId, orgId: ctx.orgId },
      async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, ctx.orgId),
          columns: {
            id: true,
            stripeAccountId: true,
            stripeOnboardingComplete: true,
            name: true,
          },
        });
      },
    );

    if (!org) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });
    }

    let stripeAccountId = org.stripeAccountId;

    try {
      // Create a new Express account only if one doesn't exist yet
      if (!stripeAccountId) {
        const account = await stripe.accounts.create(
          {
            type: "express",
            metadata: {
              orgId: ctx.orgId,
              orgName: org.name,
            },
          },
          // Idempotency key scoped to the org
          { idempotencyKey: `connect_create_${ctx.orgId}` },
        );

        stripeAccountId = account.id;

        // Persist the accountId immediately — before generating the link
        // so a re-attempt doesn't create a duplicate account
        await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
          await tx
            .update(organizations)
            .set({ stripeAccountId })
            .where(eq(organizations.id, ctx.orgId));
        });
      }

      // Generate a fresh account_links URL (these expire in 5 minutes)
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${appUrl}/settings/billing/connect/refresh`,
        return_url: `${appUrl}/settings/billing/connect/callback`,
        type: "account_onboarding",
      });

      return { url: accountLink.url };
    } catch (err: any) {
      console.error("[billing.createConnectLink] Stripe/DB Connect flow failed:", err);

      const rawMessage = err?.message || "An unknown error occurred during Stripe Connect integration.";
      
      // If Stripe Connect is not enabled for the Stripe account
      if (rawMessage.includes("Connect")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Stripe Connect is not enabled for this Stripe account. Please sign up for Connect at https://dashboard.stripe.com/connect and verify your test mode settings.",
          cause: err,
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Stripe Integration Failed: ${rawMessage}`,
        cause: err,
      });
    }
  }),

  /**
   * Returns the live Connect status by calling stripe.accounts.retrieve.
   * Falls back gracefully if no account is connected yet.
   */
  getConnectStatus: protectedProcedure.query(async ({ ctx }) => {
    requireOwnerOrAdmin(ctx.role);

    const org = await withRLS(
      { userId: ctx.userId, orgId: ctx.orgId },
      async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, ctx.orgId),
          columns: {
            stripeAccountId: true,
            stripeOnboardingComplete: true,
          },
        });
      },
    );

    if (!org?.stripeAccountId) {
      return { connected: false, chargesEnabled: false, payoutsEnabled: false };
    }

    try {
      const account = await stripe.accounts.retrieve(org.stripeAccountId);

      return {
        connected: true,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        accountId: org.stripeAccountId,
      };
    } catch (err) {
      // Log only the ID, never the full error object
      console.error(`[billing.getConnectStatus] Failed to retrieve account ${org.stripeAccountId}:`, (err as Error).message);
      return { connected: false, chargesEnabled: false, payoutsEnabled: false };
    }
  }),

  /**
   * Creates a Stripe Express Dashboard login link so the agency can view
   * their payouts, balance, and bank account settings directly in Stripe.
   */
  createPortalLink: protectedProcedure.mutation(async ({ ctx }) => {
    requireOwnerOrAdmin(ctx.role);

    const org = await withRLS(
      { userId: ctx.userId, orgId: ctx.orgId },
      async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, ctx.orgId),
          columns: { stripeAccountId: true, stripeOnboardingComplete: true },
        });
      },
    );

    if (!org?.stripeAccountId || !org.stripeOnboardingComplete) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Stripe account not fully connected yet.",
      });
    }

    try {
      const loginLink = await stripe.accounts.createLoginLink(org.stripeAccountId);

      return { url: loginLink.url };
    } catch (err: any) {
      console.error("[billing.createPortalLink] Stripe portal link generation failed:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create Stripe portal login link: ${err?.message || "Unknown error"}`,
        cause: err,
      });
    }
  }),
});
