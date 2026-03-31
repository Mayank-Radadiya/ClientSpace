export const metadata = { title: "Invoices — Client Portal" };

export default function ClientInvoicesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground text-sm">
          View and download your invoices.
        </p>
      </header>

      <div className="rounded-lg border bg-white/50 p-8 backdrop-blur-sm dark:bg-neutral-900/50">
        <p className="text-muted-foreground text-center text-sm">
          No invoices to display. Your invoices will appear here once they are
          issued.
        </p>
      </div>
    </div>
  );
}
