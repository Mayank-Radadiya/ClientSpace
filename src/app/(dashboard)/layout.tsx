import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { cookies } from "next/headers";
import WorkspaceShell from "./_components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Optimize lookup with cookie check first
  const cookieStore = await cookies();
  const hasOrgCookie = cookieStore.get("has_org")?.value === "true";

  if (!hasOrgCookie) {
    // If no cookie, check Database. It could be they just signed up or cookies were cleared.
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
    } else {
      // Missing cookie but membership exists? Let's self-heal.
      // (Note this self-healing requires sync-org or a separate component to fire since Next.js Server Components cannot set cookies)
      // Actually Server Components CANNOT set cookies unless it's a Server Action.
      // But we can just let them through anyway, reducing friction. Just checking DB costs +1 query.
    }
  }

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
