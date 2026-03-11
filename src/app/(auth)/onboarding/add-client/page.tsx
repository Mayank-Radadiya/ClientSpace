import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { AddClientForm } from "@/features/onboarding/components/AddClientForm";

export const metadata = {
  title: "Add your first client — ClientSpace",
};

export default async function AddClientPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure user has an org before proceeding. We check using system context since we don't know the org ID yet.
  const existingMembership = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, user.id),
      });
    },
  );

  if (!existingMembership) {
    redirect("/onboarding");
  }

  return (
    <main className="flex w-full items-center justify-center p-4">
      <AddClientForm />
    </main>
  );
}
