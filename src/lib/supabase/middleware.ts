// src/lib/supabase/middleware.ts
// Middleware-specific client that refreshes the auth token on every request.
// Returns the response with updated cookies AND the resolved user object
// so the root middleware can use it for rate limiting and redirects.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

const ADMIN_ROLES = new Set(["owner", "admin", "member"]);

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
}> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Always use getUser() instead of getSession() in middleware.
  // getUser() validates the token against the Supabase Auth server,
  // which prevents spoofed JWTs from bypassing middleware checks.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Protect Dashboard & Settings Routes — redirect unauthenticated users to login
  if (
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/update-password")) &&
    !user
  ) {
    const redirectResp = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((c) => {
      redirectResp.cookies.set(c.name, c.value, c);
    });
    return {
      response: redirectResp,
      user: null,
    };
  }

  // 1c. Protect new portal route: unauthenticated users go to login with return path
  if (request.nextUrl.pathname.startsWith("/portal") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);

    const redirectResp = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((c) => {
      redirectResp.cookies.set(c.name, c.value, c);
    });
    return {
      response: redirectResp,
      user: null,
    };
  }

  // 1d. Portal role split: team users are redirected back to dashboard
  if (request.nextUrl.pathname.startsWith("/portal") && user) {
    const orgRole = (user.app_metadata as Record<string, unknown> | undefined)
      ?.org_role;

    if (typeof orgRole === "string" && ADMIN_ROLES.has(orgRole)) {
      const redirectResp = NextResponse.redirect(
        new URL("/dashboard", request.url),
      );
      response.cookies.getAll().forEach((c) => {
        redirectResp.cookies.set(c.name, c.value, c);
      });
      return {
        response: redirectResp,
        user,
      };
    }
  }

  // 1e. Client role cannot access dashboard clients route
  if (request.nextUrl.pathname.startsWith("/dashboard/clients") && user) {
    const orgRole = (user.app_metadata as Record<string, unknown> | undefined)
      ?.org_role;

    if (orgRole === "client") {
      const redirectResp = NextResponse.redirect(new URL("/portal", request.url));
      response.cookies.getAll().forEach((c) => {
        redirectResp.cookies.set(c.name, c.value, c);
      });
      return {
        response: redirectResp,
        user,
      };
    }
  }

  // 1b. Protect Client Portal Routes — redirect unauthenticated users to client auth
  if (request.nextUrl.pathname.startsWith("/client-portal") && !user) {
    const redirectResp = NextResponse.redirect(
      new URL("/client/auth", request.url),
    );
    response.cookies.getAll().forEach((c) => {
      redirectResp.cookies.set(c.name, c.value, c);
    });
    return {
      response: redirectResp,
      user: null,
    };
  }

  // 2. Protect Auth Routes — redirect authenticated users to dashboard
  // Exception: /client/auth is allowed even for authenticated users
  // (multi-org scenario: existing user accepting new client invitation)
  if (
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup") ||
      request.nextUrl.pathname.startsWith("/reset-password") ||
      request.nextUrl.pathname.startsWith("/verify")) &&
    user
  ) {
    const redirectResp = NextResponse.redirect(
      new URL("/dashboard", request.url),
    );
    response.cookies.getAll().forEach((c) => {
      redirectResp.cookies.set(c.name, c.value, c);
    });
    return {
      response: redirectResp,
      user,
    };
  }

  // Note: /client/auth is NOT redirected for authenticated users
  // This allows existing users to accept client invitations to new orgs

  return { response, user };
}
