import { redirect } from "next/navigation";
import { getServerCaller } from "@/lib/trpc/server";
import { ClientInvoiceList } from "@/features/portal/components/ClientInvoiceList";

export const metadata = { title: "Invoices" };

export default async function PortalInvoicesPage() {
  const caller = await getServerCaller();
  if (!caller) redirect("/login");

  const invoices = await caller.portal.allInvoices();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View all invoice statuses and download PDFs.
        </p>
      </div>

      <ClientInvoiceList
        invoices={invoices}
        emptyMessage="No invoices available yet."
      />
    </div>
  );
}
