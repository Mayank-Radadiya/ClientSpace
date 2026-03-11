import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { CreateOrganizationForm } from "@/features/onboarding/components/CreateOrgForm";

export const metadata = {
  title: "Create your workspace — ClientSpace",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fast check: Check optimistic cookie first
  const cookieStore = await cookies();
  const hasOrg = cookieStore.get("has_org")?.value === "true";

  if (hasOrg) {
    redirect("/dashboard");
  }

  // Slow check: Database fallback
  const existingMembership = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, user.id),
      });
    },
  );

  if (existingMembership) {
    redirect("/dashboard");
  }

  return (
    <main className="flex w-full items-center justify-center p-4">
      <CreateOrganizationForm />
    </main>
  );
}
