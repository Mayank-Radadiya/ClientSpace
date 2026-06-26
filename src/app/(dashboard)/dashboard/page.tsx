import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";
import { getUser } from "@/lib/auth/getUser";
import { DashboardPageClient } from "@/features/dashboard/components/DashboardPageClient";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) {
    redirect("/onboarding");
  }

  const user = await getUser();
  const userName = user?.user_metadata?.full_name ?? user?.email ?? "User";

  return <DashboardPageClient userName={userName} />;
}
