import { redirect } from "next/navigation";
import WorkspaceShell from "./_components/DashboardShell";
import { DashboardClientExtras } from "./_components/DashboardClientExtras";
import { getUser } from "@/lib/auth/getUser";
import { requireOrg } from "@/lib/auth/requireOrg";
import { createTRPCContext } from "@/lib/trpc/init";
import { GlobalRealtimeProvider } from "@/lib/realtimeProvider";

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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />
      <div className="relative h-full min-h-screen w-full overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950/20 dark:text-neutral-100 ">
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
    </GlobalRealtimeProvider>
  );
}
