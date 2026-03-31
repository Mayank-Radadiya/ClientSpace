import { redirect } from "next/navigation";
import ClientPortalShell from "./_components/ClientPortalShell";
import { getUser } from "@/lib/auth/getUser";
import { createTRPCContext } from "@/lib/trpc/init";

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth guard: Redirect unauthenticated users to client auth
  const user = await getUser();

  if (!user) {
    redirect("/client/auth");
  }

  // Role guard: Only allow clients to access this portal
  const ctx = await createTRPCContext();

  if (!ctx) {
    // No org membership → redirect to client auth (they need an invite)
    redirect("/client/auth");
  }

  if (ctx.role !== "client") {
    // Team members should use the team dashboard
    redirect("/dashboard");
  }

  // Get current org info for org switcher
  const currentOrg = ctx.availableOrgs.find((org) => org.orgId === ctx.orgId);

  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950/20 dark:text-neutral-100">
      <ClientPortalShell
        organizations={ctx.availableOrgs}
        currentOrgId={ctx.orgId}
        currentOrgName={currentOrg?.orgName ?? ""}
        currentRole={ctx.role}
      >
        {children}
      </ClientPortalShell>
    </div>
  );
}
