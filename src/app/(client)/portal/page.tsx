import { redirect } from "next/navigation";
import { getServerCaller } from "@/lib/trpc/server";
import { ClientProjectCard } from "@/features/portal/components/ClientProjectCard";
import { ClientInvoiceList } from "@/features/portal/components/ClientInvoiceList";
import { ActivityFeed } from "@/features/portal/components/ActivityFeed";
import { PortalDashboardClient } from "./PortalDashboardClient";

export const metadata = { title: "Dashboard" };

export default async function PortalHomePage() {
  const caller = await getServerCaller();
  if (!caller) redirect("/login");

  const [projects, openInvoices, allInvoices, recentActivity] =
    await Promise.all([
      caller.portal.activeProjects(),
      caller.portal.openInvoices(),
      caller.portal.allInvoices(),
      caller.portal.recentActivity(),
    ]);

  const totalPaid = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amountCents, 0);

  const overviewCards = {
    activeProjects: projects.filter(
      (p) => p.status !== "completed" && p.status !== "archived",
    ).length,
    pendingInvoices: openInvoices.length,
    completedMilestones: projects.reduce(
      (s, p) => s + p.milestones.filter((m) => m.completed).length,
      0,
    ),
    totalEarned: totalPaid,
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Your Portal</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review project progress, files, and billing in one place.
        </p>
      </section>

      <PortalDashboardClient cards={overviewCards} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Projects</h2>
        </div>
        {projects.length === 0 ? (
          <div className="text-muted-foreground bg-card rounded-xl border p-6 text-sm">
            No active projects yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ClientProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Open Invoices</h2>
          {openInvoices.length > 0 && (
            <a
              href="/portal/invoices"
              className="text-primary text-sm font-medium"
            >
              View all
            </a>
          )}
        </div>
        <ClientInvoiceList
          invoices={openInvoices}
          emptyMessage="No open invoices. You're all caught up."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <ActivityFeed events={recentActivity} />
      </section>
    </div>
  );
}
