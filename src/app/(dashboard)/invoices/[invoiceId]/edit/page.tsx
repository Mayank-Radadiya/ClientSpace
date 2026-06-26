import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, projects } from "@/db/schema";
import { createTRPCContext } from "@/lib/trpc/init";
import { getInvoiceDetail } from "@/features/invoices/server/queries";
import { InvoiceEditClient } from "./InvoiceEditClient";

export const metadata = { title: "Edit Invoice" };

interface EditInvoicePageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { invoiceId } = await params;
  
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    redirect("/invoices");
  }

  // Fetch invoice details, clients, and projects in parallel
  const [orgClients, orgProjects, invoice] = await Promise.all([
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
    getInvoiceDetail(ctx.orgId, ctx.userId, invoiceId),
  ]);

  if (!invoice) {
    notFound();
  }

  // Map quantity to string for type compliance (schema defines lineItems.quantity as string)
  const formattedInvoice = {
    ...invoice,
    taxRateBasisPoints: invoice.taxRateBasisPoints ?? 0,
    lineItems: invoice.lineItems.map(item => ({
      ...item,
      quantity: item.quantity.toString()
    }))
  };

  return (
    <InvoiceEditClient
      clients={orgClients}
      projects={orgProjects}
      invoice={formattedInvoice}
    />
  );
}
