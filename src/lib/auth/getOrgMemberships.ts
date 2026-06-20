import { cache } from "react";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Request-scoped cached org membership fetch.
 * ponytail: one query per request instead of two (session.ts + init.ts both need this)
 */
export const getOrgMemberships = cache(async (userId: string) => {
  return withRLS(
    { userId, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findMany({
        where: eq(orgMemberships.userId, userId),
        columns: { orgId: true, role: true },
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
});
