import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";

// const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Query DB to check if the user has any org membership
  const membership = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, user.id),
      });
    },
  );

  if (membership) {
    // Repair the cookie and forward to dashboard
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("has_org", "true", COOKIE_OPTIONS);
    return response;
  }

  // No org found — send back to onboarding to create one
  return NextResponse.redirect(new URL("/onboarding", request.url));
}
