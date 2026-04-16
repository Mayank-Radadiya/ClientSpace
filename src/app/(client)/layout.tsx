import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, organizations } from "@/db/schema";
import { ClientHeader } from "@/features/portal/components/ClientHeader";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const client = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.clients.findFirst({
        where: eq(clients.userId, user.id),
        columns: { id: true, orgId: true, contactName: true, email: true },
      });
    },
  );

  if (!client) {
    redirect("/login");
  }

  const org = await withRLS(
    { userId: user.id, orgId: client.orgId },
    async (tx) => {
      return tx.query.organizations.findFirst({
        where: eq(organizations.id, client.orgId),
        columns: { name: true, logoUrl: true, accentColor: true, plan: true },
      });
    },
  );

  if (!org) {
    redirect("/login");
  }

  return (
    <div
      className="bg-background min-h-screen"
      style={
        org.accentColor
          ? ({ "--brand-accent": org.accentColor } as CSSProperties)
          : undefined
      }
    >
      <ClientHeader
        orgName={org.name}
        orgLogoUrl={org.logoUrl ?? undefined}
        clientName={client.contactName ?? client.email}
      />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">{children}</main>

      {org.plan === "starter" ? (
        <footer className="text-muted-foreground py-6 text-center text-xs">
          <a
            href="https://clientspace.app?ref=powered-by"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Powered by ClientSpace
          </a>
        </footer>
      ) : null}
    </div>
  );
}
