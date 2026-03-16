import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  // Bootstrap with SYSTEM sentinel to read membership (no real org yet in context)
  const membership = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, user.id),
      });
    },
  );

  if (!membership) return null;

  return {
    userId: user.id,
    orgId: membership.orgId,
    role: membership.role as "owner" | "admin" | "member" | "client",
  };
}
