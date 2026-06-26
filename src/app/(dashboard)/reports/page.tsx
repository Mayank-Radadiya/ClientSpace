import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, invoices } from "@/db/schema";
import { createTRPCContext } from "@/lib/trpc/init";

import { ReportsPageClient } from "@/features/reports/components/ReportsPageClient";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  // Only allow owners and admins to view reports
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch clients and invoices in parallel
  const [orgClients, orgInvoices] = await Promise.all([
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
      tx.query.invoices.findMany({
        where: eq(invoices.orgId, ctx.orgId),
        with: {
          client: {
            columns: {
              id: true,
              companyName: true,
              contactName: true,
              email: true,
            },
          },
        },
      }),
    ),
  ]);

  // Format dates to string
  const formattedInvoices = orgInvoices.map((inv) => ({
    ...inv,
    dueDate: inv.dueDate || null,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
    paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
  }));

  return <ReportsPageClient clients={orgClients} invoices={formattedInvoices} />;
}
