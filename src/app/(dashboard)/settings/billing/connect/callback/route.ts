// src/app/(dashboard)/settings/billing/connect/callback/route.ts
// Stripe Express onboarding callback — GET handler.
// Stripe redirects here after the agency completes onboarding.
// For Express accounts: no OAuth token exchange needed.
// We simply mark stripeOnboardingComplete = true and check live account status.

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/auth/orgSwitcher";
import { stripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login`);
    }

    const orgId = await getActiveOrgId();
    if (!orgId) {
      return NextResponse.redirect(`${appUrl}/dashboard`);
    }

    // Fetch org to get the stripeAccountId we stored during createConnectLink
    const org = await withRLS(
      { userId: user.id, orgId },
      async (tx) => {
        return tx.query.organizations.findFirst({
          where: eq(organizations.id, orgId),
          columns: { stripeAccountId: true, stripeOnboardingComplete: true },
        });
      },
    );

    if (!org?.stripeAccountId) {
      // No account ID stored — something went wrong, send back to start
      return NextResponse.redirect(
        `${appUrl}/settings/billing?error=no_account`,
      );
    }

    // Re-check live status from Stripe — don't trust the redirect alone
    let chargesEnabled = false;
    try {
      const account = await stripe.accounts.retrieve(org.stripeAccountId);
      chargesEnabled = account.charges_enabled;
    } catch (err) {
      // Log only ID, never full object
      console.error(
        `[billing/callback] Failed to retrieve account ${org.stripeAccountId}:`,
        (err as Error).message,
      );
    }

    // Mark onboarding complete — account.updated webhook will sync the final
    // chargesEnabled state asynchronously via Inngest if it changes later
    await withRLS({ userId: user.id, orgId }, async (tx) => {
      await tx
        .update(organizations)
        .set({ stripeOnboardingComplete: true })
        .where(eq(organizations.id, orgId));
    });

    const successParam = chargesEnabled ? "connected" : "pending";

    return NextResponse.redirect(
      `${appUrl}/settings/billing?success=${successParam}`,
    );
  } catch (err) {
    console.error(
      "[billing/callback] Unhandled error:",
      (err as Error).message,
    );
    return NextResponse.redirect(`${appUrl}/settings/billing?error=unknown`);
  }
}
