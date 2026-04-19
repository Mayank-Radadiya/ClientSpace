import { InviteClientDialog } from "@/features/clients/components/InviteClientDialog";

export const metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm">
            Invite and manage your clients.
          </p>
        </div>
        <InviteClientDialog />
      </header>

      <p className="text-muted-foreground text-sm">Client list coming soon.</p>
    </div>
  );
}
