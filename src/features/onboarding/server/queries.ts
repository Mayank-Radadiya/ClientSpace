import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";

/**
 * Fetches the primary organization membership for a given user.
 */
export async function getUserExistingMembership(userId: string) {
  try {
    return await withRLS({ userId, orgId: "SYSTEM" }, async (tx) => {
      return tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, userId),
      });
    });
  } catch (error) {
    console.error("Error fetching user membership:", error);
    // Depending on your error handling strategy, throw or return null
    return null;
  }
}
