import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";
import { getUser } from "@/lib/auth/getUser";
import { OrgSwitcherGrid } from "@/components/global/org-switcher/OrgSwitcherGrid";

export const metadata = { title: "Switch Organization" };

export default async function SwitchOrgPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const ctx = await createTRPCContext();

  if (!ctx) {
    redirect("/onboarding");
  }

  // If user only has one org, redirect to appropriate dashboard
  if (ctx.availableOrgs.length === 1) {
    if (ctx.role === "client") {
      redirect("/portal");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950/20 dark:text-neutral-100">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/15 blur-[120px]" />
        <div className="absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Switch Organization
          </h1>
          <p className="text-muted-foreground mt-2">
            Select an organization to view and manage its projects, clients, and
            invoices.
          </p>
        </header>

        <OrgSwitcherGrid
          organizations={ctx.availableOrgs}
          currentOrgId={ctx.orgId}
        />
      </div>
    </div>
  );
}
