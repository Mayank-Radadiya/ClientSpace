"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";
import { setActiveOrg } from "@/lib/auth/orgSwitcher";

/**
 * Switch the active organization for the current user
 *
 * @param orgId - The organization ID to switch to
 * @returns void - Redirects to appropriate dashboard after switching
 */
export async function switchOrgAction(orgId: string) {
  const ctx = await createTRPCContext();

  if (!ctx) {
    throw new Error("Unauthorized");
  }

  // Validate that the user belongs to the target org
  const targetOrg = ctx.availableOrgs.find((org) => org.orgId === orgId);

  if (!targetOrg) {
    throw new Error("You do not have access to this organization");
  }

  // Set the active org cookie
  await setActiveOrg(orgId);

  // Revalidate all paths to force re-fetch with new org context
  revalidatePath("/", "layout");

  // Redirect based on role in the target org
  if (targetOrg.role === "client") {
    redirect("/portal");
  } else {
    redirect("/dashboard");
  }
}
