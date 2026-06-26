import { redirect } from "next/navigation";
import WorkspaceShell from "./_components/DashboardShell";
import { DashboardClientExtras } from "./_components/DashboardClientExtras";
import { getUser } from "@/lib/auth/getUser";
import { requireOrg } from "@/lib/auth/requireOrg";
import { createTRPCContext } from "@/lib/trpc/init";
import { GlobalRealtimeProvider } from "@/lib/realtimeProvider";
import { CommandPalette } from "@/components/global/CommandPalette";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  await requireOrg(user.id);

  // Role guard: Redirect clients to client portal
  const ctx = await createTRPCContext();

  if (ctx?.role === "client") {
    redirect("/portal");
  }

  // Get current org info for org switcher
  const currentOrg = ctx?.availableOrgs.find((org) => org.orgId === ctx.orgId);

  return (
    <GlobalRealtimeProvider orgId={ctx?.orgId ?? ""}>
      <div className="relative h-full min-h-screen w-full overflow-hidden bg-muted">
        <WorkspaceShell
          organizations={ctx?.availableOrgs ?? []}
          currentOrgId={ctx?.orgId ?? ""}
          currentOrgName={currentOrg?.orgName ?? ""}
          currentRole={ctx?.role ?? ""}
        >
          {children}
        </WorkspaceShell>
        <DashboardClientExtras />
      </div>
      <CommandPalette />
    </GlobalRealtimeProvider>
  );
}
