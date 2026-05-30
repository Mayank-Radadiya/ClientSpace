// src/app/(dashboard)/analytics/page.tsx
// Analytics dashboard page.

import { createTRPCContext } from "@/lib/trpc/init";
import { redirect } from "next/navigation";
import { AnalyticsPageClient } from "./_components/AnalyticsPageClient";

// FIX: Analytics page was completely missing — no route existed for viewing analytics

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  return <AnalyticsPageClient />;
}
