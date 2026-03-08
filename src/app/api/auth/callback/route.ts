import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
  maxAge: 60 * 60 * 24 * 30,
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check for existing org and set the middleware cookie
        const membership = await withRLS(
          { userId: user.id, orgId: "SYSTEM" },
          async (tx) => {
            return tx
              .select({ orgId: orgMemberships.orgId })
              .from(orgMemberships)
              .where(eq(orgMemberships.userId, user.id))
              .limit(1);
          },
        );

        if (membership.length > 0) {
          const cookieStore = await cookies();
          cookieStore.set("has_org", "true", COOKIE_OPTIONS);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
