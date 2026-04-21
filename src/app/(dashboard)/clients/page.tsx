import { redirect } from "next/navigation";
import { ClientsPageClient } from "@/features/clients/components/ClientsPageClient";
import { createTRPCContext } from "@/lib/trpc/init";
import { getServerCaller } from "@/lib/trpc/server";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const ctx = await createTRPCContext();
  if (!ctx) redirect("/onboarding");

  if (ctx.role === "client") {
    redirect("/portal");
  }

  const caller = await getServerCaller();
  const bootstrap = caller
    ? await caller.client.getBootstrap()
    : {
        clients: [],
        stats: {
          totalClients: 0,
          activeClients: 0,
          activeProjects: 0,
          outstandingInvoicesCents: 0,
        },
      };

  return (
    <ClientsPageClient
      initialClients={bootstrap.clients}
      initialStats={bootstrap.stats}
      role={ctx.role as "owner" | "admin" | "member" | "client"}
    />
  );
}
