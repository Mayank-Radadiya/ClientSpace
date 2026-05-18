import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients } from "@/db/schema";
import { ProjectList } from "../../../features/projects/components/ProjectList";
import { createTRPCContext } from "@/lib/trpc/init";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const ctx = await createTRPCContext();
  if (!ctx) redirect("/onboarding");

  // Only fetch the lightweight clients dropdown data (id, name, email)
  // The heavy project data is handled client-side by React Query cache
  const orgClients = await withRLS(ctx, async (tx) =>
    tx
      .select({
        id: clients.id,
        companyName: clients.companyName,
        email: clients.email,
      })
      .from(clients)
      .where(eq(clients.orgId, ctx.orgId)),
  );

  return (
    <div className="-m-4 min-h-screen bg-[#F0F0F5] p-6 dark:bg-[#08080E] md:-m-6 md:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <ProjectList
          clients={orgClients}
          userRole={ctx.role as "admin" | "owner" | "member" | "client"}
        />
      </div>
    </div>
  );
}
