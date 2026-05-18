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
    <div className="-m-4 min-h-screen bg-[#F0F0F5] p-6 dark:bg-[#0D0F16] md:-m-6 md:p-8 relative overflow-hidden">
      {/* 1% SVG noise/grain overlay so background isn't flat */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.012] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1400px] space-y-6">
        <ProjectList
          clients={orgClients}
          userRole={ctx.role as "admin" | "owner" | "member" | "client"}
        />
      </div>
    </div>
  );
}
