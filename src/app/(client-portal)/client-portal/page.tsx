import { createTRPCContext } from "@/lib/trpc/init";
import { getUser } from "@/lib/auth/getUser";

export const metadata = { title: "Client Portal — ClientSpace" };

export default async function ClientPortalPage() {
  const ctx = await createTRPCContext();
  const user = await getUser();

  // Get client name from user metadata
  const clientName =
    user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "there";

  // Get organization name from context
  const currentOrg = ctx?.availableOrgs.find((org) => org.orgId === ctx.orgId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, {clientName}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {currentOrg?.orgName
            ? `Viewing projects and invoices for ${currentOrg.orgName}`
            : "Your client portal"}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats Cards */}
        <div className="rounded-lg border bg-white/50 p-6 backdrop-blur-sm dark:bg-neutral-900/50">
          <h3 className="text-muted-foreground text-sm font-medium">
            Active Projects
          </h3>
          <p className="mt-2 text-3xl font-semibold">—</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Projects currently in progress
          </p>
        </div>

        <div className="rounded-lg border bg-white/50 p-6 backdrop-blur-sm dark:bg-neutral-900/50">
          <h3 className="text-muted-foreground text-sm font-medium">
            Pending Invoices
          </h3>
          <p className="mt-2 text-3xl font-semibold">—</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Invoices awaiting payment
          </p>
        </div>

        <div className="rounded-lg border bg-white/50 p-6 backdrop-blur-sm dark:bg-neutral-900/50">
          <h3 className="text-muted-foreground text-sm font-medium">
            Recent Files
          </h3>
          <p className="mt-2 text-3xl font-semibold">—</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Files shared with you
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white/50 p-6 backdrop-blur-sm dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="text-muted-foreground mt-4 text-sm">
          No recent activity to display.
        </p>
      </div>
    </div>
  );
}
