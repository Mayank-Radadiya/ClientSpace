import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";
import { ClientDetailPage } from "@/features/clients/client-detail/ClientDetailPage";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Client — ${id.slice(0, 8)}`,
  };
}

export default async function ClientDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await createTRPCContext();
  if (!ctx) redirect("/onboarding");
  if (ctx.role === "client") redirect("/portal");

  return (
    <ClientDetailPage
      clientId={id}
      role={ctx.role as "owner" | "admin" | "member" | "client"}
    />
  );
}
