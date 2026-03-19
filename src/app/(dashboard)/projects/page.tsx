import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships, clients } from "@/db/schema";
import { ProjectList } from "../../../features/projects/components/ProjectList";
import { getUser } from "@/lib/auth/getUser";

export const metadata = { title: "Projects — ClientSpace" };

export default async function ProjectsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Single RLS call: resolve membership
  const membership = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) =>
      tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, user.id),
      }),
  );
  if (!membership) redirect("/onboarding");

  // Fetch only the client list (lightweight — needed for the create-project form)
  const orgClients = await withRLS(
    { userId: user.id, orgId: membership.orgId },
    async (tx) =>
      tx
        .select({
          id: clients.id,
          companyName: clients.companyName,
          email: clients.email,
        })
        .from(clients)
        .where(eq(clients.orgId, membership.orgId)),
  );

  return (
    <div className="space-y-6">
      <ProjectList clients={orgClients} userRole={membership.role} />
    </div>
  );
}
