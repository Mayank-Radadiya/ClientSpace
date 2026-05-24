// src/app/(dashboard)/invoices/page.tsx
// Invoice management page — Modern SaaS UI with search, filters, and modal create flow.

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, projects } from "@/db/schema";
import { createTRPCContext } from "@/lib/trpc/init";
import { InvoicesPageClient } from "@/features/invoices/components/InvoicesPageClient";
import { getInvoiceList } from "@/features/invoices/server/queries";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  // Fetch dropdown data and prefetch invoices list server-side
  const [orgClients, orgProjects, rawInvoices] = await Promise.all([
    withRLS(ctx, async (tx) =>
      tx
        .select({
          id: clients.id,
          companyName: clients.companyName,
          contactName: clients.contactName,
          email: clients.email,
        })
        .from(clients)
        .where(eq(clients.orgId, ctx.orgId)),
    ),
    withRLS(ctx, async (tx) =>
      tx
        .select({
          id: projects.id,
          clientId: projects.clientId,
          name: projects.name,
        })
        .from(projects)
        .where(eq(projects.orgId, ctx.orgId)),
    ),
    getInvoiceList(ctx.orgId, ctx.userId),
  ]);

  const isOwnerOrAdmin = ctx.role === "owner" || ctx.role === "admin";
  const initialInvoices = {
    items: rawInvoices,
  };

  return (
    <InvoicesPageClient
      clients={orgClients}
      projects={orgProjects}
      isOwnerOrAdmin={isOwnerOrAdmin}
      userRole={ctx.role}
      initialInvoices={initialInvoices}
    />
  );
}
