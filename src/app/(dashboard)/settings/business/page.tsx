import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { BusinessSettingsClient } from "./BusinessSettingsClient";

export const metadata = { title: "Business Settings" };

export default async function BusinessSettingsPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/onboarding");

  // Fetch organization record within RLS context
  const org = await withRLS(ctx, async (tx) => {
    return tx.query.organizations.findFirst({
      where: eq(organizations.id, ctx.orgId),
      columns: {
        id: true,
        name: true,
        logoUrl: true,
        address: true,
        taxNumber: true,
      },
    });
  });

  if (!org) {
    redirect("/onboarding");
  }

  const isOwnerOrAdmin = ctx.role === "owner" || ctx.role === "admin";

  return <BusinessSettingsClient org={org} isOwnerOrAdmin={isOwnerOrAdmin} />;
}
