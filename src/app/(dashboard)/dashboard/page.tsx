// src/app/(dashboard)/dashboard/page.tsx
// Main dashboard page - shows metrics, recent projects, and activity feed

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";
import { getUser } from "@/lib/auth/getUser";
import { DashboardPageClient } from "@/features/dashboard/components/DashboardPageClient";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";

export const metadata = { title: "Dashboard — ClientSpace" };

export default async function DashboardPage() {
  const ctx = await createTRPCContext();

  // Auth guard
  if (!ctx) {
    redirect("/login");
  }

  // Get user details for personalized greeting
  const user = await getUser();
  const userName =
    user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageClient userName={userName} />
    </Suspense>
  );
}
