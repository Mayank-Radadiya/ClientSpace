// src/app/(dashboard)/settings/domain/page.tsx
// Custom domain settings page — agency white-label portal configuration.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { clients, organizations } from "@/db/schema";
import { CustomDomainSettings } from "@/features/organizations/components/CustomDomainSettings";

export const metadata: Metadata = {
  title: "Custom Domain — Settings — ClientSpace",
  description:
    "Connect your own domain to white-label the client portal for your agency.",
};

export const dynamic = "force-dynamic";

export default async function DomainSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the org from the user's membership
  const membership = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships?.findFirst({
        where: (om: { userId: any }, { eq }: { eq: Function }) =>
          eq(om.userId, user.id),
        columns: { orgId: true, role: true },
      });
    },
  );

  if (!membership) {
    redirect("/login");
  }

  // Only owner/admin can access this page
  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/dashboard");
  }

  const org = await withRLS(
    { userId: user.id, orgId: membership.orgId },
    async (tx) => {
      return tx.query.organizations.findFirst({
        where: eq(organizations.id, membership.orgId),
        columns: {
          slug: true,
          customDomain: true,
          customDomainVerified: true,
          customDomainStatus: true,
          customDomainError: true,
          customDomainAddedAt: true,
          customDomainVerifiedAt: true,
        },
      });
    },
  );

  if (!org) {
    redirect("/dashboard");
  }

  const initialSettings = {
    slug: org.slug,
    customDomain: org.customDomain ?? null,
    customDomainVerified: org.customDomainVerified,
    customDomainStatus: (org.customDomainStatus ?? "none") as
      | "none"
      | "pending"
      | "verifying"
      | "active"
      | "error",
    customDomainError: org.customDomainError ?? null,
    customDomainAddedAt: org.customDomainAddedAt ?? null,
    customDomainVerifiedAt: org.customDomainVerifiedAt ?? null,
    cnameTarget: "cname.vercel-dns.com",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Custom domain</h1>
        <p className="mt-1 text-sm text-zinc-500">
          White-label your client portal with your agency&apos;s own domain.
          Requires a Pro plan or higher.
        </p>
      </div>

      <CustomDomainSettings initialSettings={initialSettings} />
    </div>
  );
}
