import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { CreateOrgForm } from "@/features/onboarding/components/CreateOrgForm";

export const metadata = {
  title: "Create your workspace — ClientSpace",
};

export default async function OnboardingPage() {
  // 1. Require authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const hasOrg = cookieStore.get("has_org")?.value === "true";

  if (hasOrg) {
    redirect("/dashboard");
  }

  // 2. If user already has an org in DB, they shouldn't be here.
  //    Just send them to dashboard. The middleware `sync-org` might be over-optimizing.
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

  // 3. No org — show the creation form
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <CreateOrgForm />
    </div>
  );
}
