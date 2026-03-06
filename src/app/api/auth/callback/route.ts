// src/app/api/auth/callback/route.ts
// Auth callback route for Supabase email verification / magic link.
// Exchanges the `code` param for a session and redirects.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to login with an error indicator
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
