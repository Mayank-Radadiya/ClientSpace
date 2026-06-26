import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, projects } from "@/db/schema";
import { createTRPCContext } from "@/lib/trpc/init";
import { InvoiceCreateClient } from "./InvoiceCreateClient";

export const metadata = { title: "Create Invoice" };

export default async function CreateInvoicePage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    redirect("/invoices");
  }

  // Fetch dropdown data server-side
  const [orgClients, orgProjects] = await Promise.all([
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
  ]);

  return <InvoiceCreateClient clients={orgClients} projects={orgProjects} />;
}
