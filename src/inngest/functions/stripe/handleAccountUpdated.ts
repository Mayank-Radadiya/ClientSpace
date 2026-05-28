// src/inngest/functions/stripe/handleAccountUpdated.ts
// Handles stripe/account.updated events dispatched by the webhook handler.
// Syncs Stripe Connect account status to the organizations table.
// This ensures stripeOnboardingComplete stays accurate even if Stripe verification
// takes time after the initial callback redirect.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { inngest } from "@/inngest/client";

export const handleAccountUpdated = inngest.createFunction(
  {
    id: "stripe-account-updated",
    retries: 3,
  },
  { event: "stripe/account.updated" },
  async ({ event, step }) => {
    const { stripeAccountId, chargesEnabled } = event.data as {
      stripeAccountId: string;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
    };

    // Find the org with this Stripe account ID
    const org = await step.run("resolve-org", async () => {
      return db.query.organizations.findFirst({
        where: eq(organizations.stripeAccountId, stripeAccountId),
        columns: { id: true, stripeOnboardingComplete: true },
      });
    });

    if (!org) {
      console.warn(
        `[handleAccountUpdated] No org found for stripeAccountId: ${stripeAccountId}`,
      );
      return { ok: true, skipped: "org_not_found" };
    }

    // Update onboarding status based on charges_enabled
    await step.run("update-org", async () => {
      await db
        .update(organizations)
        .set({
          stripeOnboardingComplete: chargesEnabled,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, org.id));
    });

    return { ok: true, orgId: org.id, chargesEnabled };
  },
);
