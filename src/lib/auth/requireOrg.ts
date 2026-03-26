// lib/auth/requireOrg.ts

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";

export async function requireOrg(_userId: string) {
  const cookieStore = await cookies();
  const hasOrgCookie = cookieStore.get("has_org")?.value === "true";

  // 🚀 Fast path — cookie already set, user has an org, skip DB entirely
  if (hasOrgCookie) return;

  // 🐢 Slow path — check DB for membership (uses React cache(), so free if already called this request)
  const ctx = await createTRPCContext();

  if (!ctx) {
    // No membership found → send to onboarding to create/join an org
    redirect("/onboarding");
  }
}
