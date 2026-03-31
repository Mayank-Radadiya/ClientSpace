import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getActiveOrgId } from "./orgSwitcher";

/**
 * Resolves the current user's session and org context.
 * Returns the necessary Tenant IDs. The database operations must use withRLS.
 *
 * Used by ALL Server Actions across the application.
 * Never use the bare `db` export from @/db in Server Actions.
 *
 * Returns null if the user is unauthenticated or has no org membership.
 */
export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Bootstrap with SYSTEM sentinel to read memberships (no real org yet in context)
  const memberships = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findMany({
        where: eq(orgMemberships.userId, user.id),
        with: {
          organization: {
            columns: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    },
  );

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
