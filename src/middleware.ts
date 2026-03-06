// src/middleware.ts
// Root middleware for Next.js App Router.
// Handles: Session refresh, route guards, and Upstash rate limiting.

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ---------------------------------------------------------------------------
// Rate Limiting (Upstash)
// ---------------------------------------------------------------------------
// Lazy-initialized: only created if env vars exist.
// This allows local dev without Upstash credentials.

let authRateLimit: {
  limit: (key: string) => Promise<{ success: boolean }>;
} | null = null;
let apiRateLimit: {
  limit: (key: string) => Promise<{ success: boolean }>;
} | null = null;

async function getRateLimiters() {
  if (authRateLimit && apiRateLimit) return { authRateLimit, apiRateLimit };

  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // PRD: 20 requests per minute for auth endpoints
    authRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
    });

    // PRD: 100 requests per minute per authenticated user
    apiRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
    });
  }

  return { authRateLimit, apiRateLimit };
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";

  // ── 1. Rate limit auth endpoints (IP-based, 20/min) ──────────────────────
  const isAuthEndpoint =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth");

  if (isAuthEndpoint) {
    const { authRateLimit: limiter } = await getRateLimiters();
    if (limiter) {
      const { success } = await limiter.limit(`auth_${ip}`);
      if (!success) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
    }
  }

  // ── 2. Refresh session + route guards ────────────────────────────────────
  // updateSession() calls getUser(), handles redirects, and returns the user.
  const { response, user } = await updateSession(request);

  // If a redirect was issued by updateSession, return immediately.
  if (response.headers.get("location")) {
    return response;
  }

  // ── 3. Rate limit authenticated requests (user-ID based, 100/min) ────────
  // We already have user.id from the getUser() call above — no extra latency.
  if (
    user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/api/trpc"))
  ) {
    const { apiRateLimit: limiter } = await getRateLimiters();
    if (limiter) {
      const { success } = await limiter.limit(`user_${user.id}`);
      if (!success) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
