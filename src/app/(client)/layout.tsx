import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, organizations } from "@/db/schema";
import { ClientHeader } from "@/features/portal/components/ClientHeader";
import { PortalThemeProvider } from "@/features/portal/components/PortalThemeProvider";
import { GlobalRealtimeProvider } from "@/lib/realtimeProvider";
import "./portal.css";

export const dynamic = "force-dynamic";

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

  // Read the x-custom-domain header injected by middleware.
  // When present, this portal is being accessed via a white-labeled domain.
  const requestHeaders = await headers();
  const customDomain = requestHeaders.get("x-custom-domain");
  const isCustomDomain = !!customDomain;

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

  // Fetch all white-label branding columns server-side to prevent FOUC.
  // This data is passed as a prop to PortalThemeProvider (not fetched client-side).
  const org = await withRLS(
    { userId: user.id, orgId: client.orgId },
    async (tx) => {
      return tx.query.organizations.findFirst({
        where: eq(organizations.id, client.orgId),
        columns: {
          name: true,
          plan: true,
          logoUrl: true,
          logoMarkUrl: true,
          accentColor: true,
          accentColorDark: true,
          brandName: true,
          faviconUrl: true,
          poweredByHidden: true,
        },
      });
    },
  );

  if (!org) {
    redirect("/login");
  }

  const effectiveBrandName = org.brandName ?? org.name;

  // SSR inline style: inject accent color on first paint to prevent FOUC.
  // PortalThemeProvider will also inject the full computed palette client-side.
  const ssrAccentStyle: CSSProperties = org.accentColor
    ? ({
        "--portal-accent": org.accentColor,
        "--portal-accent-dark": org.accentColorDark ?? undefined,
      } as CSSProperties)
    : {};

  const theme = {
    accentColor: org.accentColor ?? null,
    accentColorDark: org.accentColorDark ?? null,
    logoUrl: org.logoUrl ?? null,
    logoMarkUrl: org.logoMarkUrl ?? null,
    brandName: effectiveBrandName,
    poweredByHidden: org.poweredByHidden,
    faviconUrl: org.faviconUrl ?? null,
  };

  // Show "Powered by ClientSpace" only on starter plan, not hidden, and NOT on custom domains
  const showPoweredBy =
    !org.poweredByHidden && org.plan === "starter" && !isCustomDomain;

  // Canonical URL: on custom domains, point canonical to the custom domain URL
  // to prevent duplicate-content SEO issues between the two portal URLs.
  const canonicalUrl =
    isCustomDomain && customDomain ? `https://${customDomain}` : undefined;

  return (
    <GlobalRealtimeProvider orgId={client.orgId}>
      {canonicalUrl && (
        <head>
          <link rel="canonical" href={canonicalUrl} />
        </head>
      )}
      <PortalThemeProvider theme={theme}>
        <div className="bg-background min-h-screen" style={ssrAccentStyle}>
          <ClientHeader
            orgName={effectiveBrandName}
            orgLogoUrl={org.logoUrl ?? undefined}
            clientName={client.contactName ?? client.email}
          />
          <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
            {children}
          </main>

          {showPoweredBy ? (
            <footer className="text-muted-foreground py-6 text-center text-xs">
              <a
                href="https://clientspace.qzz.io?ref=powered-by"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Powered by ClientSpace
              </a>
            </footer>
          ) : null}
        </div>
      </PortalThemeProvider>
    </GlobalRealtimeProvider>
  );
}
