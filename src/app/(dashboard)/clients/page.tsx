import { redirect } from "next/navigation";
import { ClientsPageClient } from "@/features/clients/components/ClientsPageClient";
import { createTRPCContext } from "@/lib/trpc/init";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const ctx = await createTRPCContext();
  if (!ctx) redirect("/onboarding");

  if (ctx.role === "client") {
    redirect("/portal");
  }

  return (
    <ClientsPageClient
      role={ctx.role as "owner" | "admin" | "member" | "client"}
    />
  );
}
