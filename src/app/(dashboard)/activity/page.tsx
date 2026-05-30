// src/app/(dashboard)/activity/page.tsx
// Full-page activity log view.

import { createTRPCContext } from "@/lib/trpc/init";
import { redirect } from "next/navigation";
import { ActivityPageClient } from "./_components/ActivityPageClient";

// FIX: Activity page was completely missing — no route existed for viewing the activity log

export const metadata = { title: "Activity" };

export default async function ActivityPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  return <ActivityPageClient />;
}
