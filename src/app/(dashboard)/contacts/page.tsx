import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, contacts } from "@/db/schema";
import { createTRPCContext } from "@/lib/trpc/init";
import { ContactsPageClient } from "@/features/contacts/components/ContactsPageClient";

export const metadata = { title: "Contact Book" };

export default async function ContactsPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  // Fetch organization clients and contacts in parallel
  const [orgClients, orgContacts] = await Promise.all([
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
      tx.query.contacts.findMany({
        where: eq(contacts.orgId, ctx.orgId),
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
  const formattedContacts = orgContacts.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString()
  }));

  return (
    <ContactsPageClient
      clients={orgClients}
      initialContacts={formattedContacts}
    />
  );
}
