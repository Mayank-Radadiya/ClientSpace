import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth/session";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations } from "@/db/schema";
import { BrandingSettings } from "@/features/settings/components/BrandingSettings";

export const metadata: Metadata = {
  title: "Branding — Settings",
  description: "Customize your agency logo, colors, and email domain for the client portal.",
};

export default async function BrandingPage() {
  const ctx = await getSessionContext();
  if (!ctx) {
    redirect("/login");
  }

  const org = await withRLS(
    { userId: ctx.userId, orgId: ctx.orgId },
    async (tx) => {
      return tx.query.organizations.findFirst({
        where: eq(organizations.id, ctx.orgId),
        columns: {
          name: true,
          plan: true,
          brandName: true,
          logoUrl: true,
          logoMarkUrl: true,
          faviconUrl: true,
          accentColor: true,
          accentColorDark: true,
          poweredByHidden: true,
          customEmailFromName: true,
          customEmailDomain: true,
          customEmailVerified: true,
        },
      });
    },
  );

  if (!org) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Branding</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Customize your agency's brand for the client portal. Changes are
          applied immediately when clients refresh their portal.
        </p>
      </div>

      <BrandingSettings
        org={{
          name: org.name,
          plan: org.plan,
          brandName: org.brandName ?? null,
          logoUrl: org.logoUrl ?? null,
          logoMarkUrl: org.logoMarkUrl ?? null,
          faviconUrl: org.faviconUrl ?? null,
          accentColor: org.accentColor ?? null,
          accentColorDark: org.accentColorDark ?? null,
          poweredByHidden: org.poweredByHidden,
          customEmailFromName: org.customEmailFromName ?? null,
          customEmailDomain: org.customEmailDomain ?? null,
          customEmailVerified: org.customEmailVerified,
        }}
        orgId={ctx.orgId}
      />
    </div>
  );
}
