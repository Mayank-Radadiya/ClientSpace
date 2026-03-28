// src/app/(dashboard)/invoices/page.tsx
// Invoice management page — Modern SaaS UI with search, filters, and modal create flow.

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, projects } from "@/db/schema";
import { trpc } from "@/lib/trpc/client";
import { getQueryClient } from "@/lib/trpc/query-client";
import { createTRPCContext } from "@/lib/trpc/init";
import { InvoicesPageClient } from "@/features/invoices/components/InvoicesPageClient";

export const metadata = { title: "Invoices — ClientSpace" };

export default async function InvoicesPage() {
  const ctx = await createTRPCContext();
  if (!ctx) redirect("/onboarding");

  const queryClient = getQueryClient();

  // Fetch clients (for InvoiceBuilder dropdown) + prefetch invoices in parallel
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

  const isOwnerOrAdmin = ctx.role === "owner" || ctx.role === "admin";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InvoicesPageClient
        clients={orgClients}
        projects={orgProjects}
        isOwnerOrAdmin={isOwnerOrAdmin}
        userRole={ctx.role}
      />
    </HydrationBoundary>
  );
}
