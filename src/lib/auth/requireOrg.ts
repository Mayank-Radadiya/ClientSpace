// lib/auth/requireOrg.ts

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireOrg(userId: string) {
  const cookieStore = await cookies();
  const hasOrgCookie = cookieStore.get("has_org")?.value === "true";

  // 🚀 Fast path (no DB hit)
  if (hasOrgCookie) return;

  // 🐢 Slow path (DB check)
  const existingMembership = await withRLS(
    { userId, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, userId),
      });
    },
  );

  if (!existingMembership) {
    redirect("/onboarding");
  }
}
