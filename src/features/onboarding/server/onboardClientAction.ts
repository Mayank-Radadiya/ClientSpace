"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { onboardClientSchema, type OnboardClientInput } from "../schemas";

export type OnboardClientState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof OnboardClientInput, string[]>>;
};

export async function onboardClientAction(
  _prevState: OnboardClientState,
  formData: FormData,
): Promise<OnboardClientState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to complete this action." };
  }

  const parsed = onboardClientSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as OnboardClientState["fieldErrors"],
    };
  }

  const { companyName, contactName, email } = parsed.data;

  try {
    // We must find the standard orgId given the user.
    // Fetch membership from the DB while using SYSTEM level orgId locally for cross-org reads (to find your own org first).
    const membership = await withRLS(
      { userId: user.id, orgId: "SYSTEM" },
      async (tx) => {
        return tx.query.orgMemberships.findFirst({
          where: eq(orgMemberships.userId, user.id),
        });
      },
    );

    if (!membership) {
      return { error: "No organization found for this account." };
    }

    // Connect with the user's explicit orgId
    await withRLS({ userId: user.id, orgId: membership.orgId }, async (tx) => {
      await tx.insert(clients).values({
        orgId: membership.orgId,
        companyName,
        contactName,
        email,
        status: "active",
      });
    });
  } catch (err) {
    console.error("onboardClientAction error:", err);
    return { error: "Something went wrong creating the client." };
  }

  redirect("/dashboard");
}
