import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "./orgSwitcher";
import { requireMfaSatisfied, MfaRequiredError } from "./mfa";
export { MfaRequiredError };
import { getOrgMemberships } from "./getOrgMemberships";

/**
 * Resolves the current user's session and org context.
 * Returns the necessary Tenant IDs. The database operations must use withRLS.
 *
 * Used by ALL Server Actions across the application.
 * Never use the bare `db` export from @/db in Server Actions.
 *
 * Returns null if the user is unauthenticated or has no org membership.
 * Throws MfaRequiredError if MFA is required but not satisfied.
 */
export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // ponytail: use shared cached query instead of duplicating the membership fetch
  const memberships = await getOrgMemberships(user.id);

  if (!memberships || memberships.length === 0) return null;

  // Get active org from cookie
  const activeOrgId = await getActiveOrgId();

  // Find membership for active org (validate it belongs to user)
  let activeMembership = activeOrgId
    ? memberships.find((m) => m.orgId === activeOrgId)
    : undefined;

  // Fallback to first membership if cookie invalid/missing
  if (!activeMembership) {
    activeMembership = memberships[0]!; // Safe: we already checked memberships.length > 0
  }

  // ponytail: MFA enforcement — throws MfaRequiredError if not satisfied
  await requireMfaSatisfied(activeMembership.role, user.id);

  return {
    userId: user.id,
    orgId: activeMembership.orgId,
    role: activeMembership.role as "owner" | "admin" | "member" | "client",
    availableOrgs: memberships.map((m) => ({
      orgId: m.orgId,
      orgName: m.organization.name,
      orgSlug: m.organization.slug,
      role: m.role,
    })),
  };
}
