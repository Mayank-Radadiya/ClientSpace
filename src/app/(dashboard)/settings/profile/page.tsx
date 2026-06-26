import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { users } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { ProfileSettingsClient } from "./ProfileSettingsClient";

export const metadata = { title: "Profile Settings" };

export default async function ProfileSettingsPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/onboarding");

  // Fetch full user record within RLS context
  const user = await withRLS(ctx, async (tx) => {
    return tx.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
      },
    });
  });

  if (!user) {
    redirect("/onboarding");
  }

  return <ProfileSettingsClient user={user} />;
}
