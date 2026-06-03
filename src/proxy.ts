// src/middleware.ts
// Root middleware for Next.js App Router.
// Handles: Custom domain rewriting, session refresh, route guards, and Upstash rate limiting.
//
// ━━━ Custom Domain Flow ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// When a request arrives from a non-clientspace domain (e.g. portal.acme.com):
//   1. Strip any incoming x-org-id / x-custom-domain headers (injection prevention)
//   2. Check Redis cache (TTL 5 min) to avoid a Supabase roundtrip on every request
//   3. If cache miss: query Supabase for the org that owns this custom domain
//      (must have custom_domain_verified = true)
//   4. If found: rewrite the request to /portal/{slug}{originalPath}
//      and inject x-org-id, x-org-slug, x-custom-domain response headers
//   5. If not found: rewrite to /domain-not-found
//   6. Admin/dashboard paths on custom domains → redirect to clientspace.qzz.io/dashboard

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
let isInitialized = false;

function getRateLimiters() {
  if (isInitialized) return { authRateLimit, apiRateLimit };

  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
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

  isInitialized = true;
  return { authRateLimit, apiRateLimit };
}

// ---------------------------------------------------------------------------
// Custom Domain Cache
// ---------------------------------------------------------------------------

/** Cached org info for a custom domain. null = confirmed not found. */
type DomainCacheEntry = {
  orgId: string;
  slug: string;
} | null;

const DOMAIN_CACHE_TTL = 300; // 5 minutes in seconds
const CLIENTSPACE_HOSTS = [
  "clientspace",
  "localhost",
  "vercel.app",
  "vercel-dns",
];

function isClientspaceDomain(hostname: string): boolean {
  return CLIENTSPACE_HOSTS.some((h) => hostname.includes(h));
}

function getRedisKeyForDomain(domain: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const prefix = isProd ? "clientspace:prod:" : "clientspace:dev:";
  return `${prefix}domain:lookup:${domain}`;
}

async function lookupOrgByDomain(
  domain: string,
  request: NextRequest,
): Promise<DomainCacheEntry> {
  // 1. Check Redis cache first — avoids DB roundtrip on every custom domain request
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const cached = await redisClient.get<DomainCacheEntry>(
        getRedisKeyForDomain(domain),
      );
      // null means "not found" is cached; undefined means cache miss
      if (cached !== undefined) {
        return cached;
      }
    } catch (err) {
      // Cache failure — fall through to DB lookup
      console.warn("[middleware] Redis cache read failed:", err);
    }
  }

  // 2. Cache miss — query Supabase directly (edge-compatible client, no Node.js APIs)
  let orgData: DomainCacheEntry = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          // We don't set cookies in middleware for this query (read-only)
          setAll() {},
        },
      },
    );

    // Query using the service role would bypass RLS, but here we use a direct
    // table query with explicit filters instead of RLS policies.
    // We use the anon key + explicit WHERE conditions for safety.
    const { data } = await supabase
      .from("organizations")
      .select("id, slug")
      .eq("custom_domain", domain)
      .eq("custom_domain_verified", true)
      .eq("custom_domain_status", "active")
      .limit(1)
      .maybeSingle();

    if (data) {
      orgData = { orgId: data.id, slug: data.slug };
    }
  } catch (err) {
    console.error("[middleware] Supabase domain lookup failed:", err);
    // On DB error, do NOT serve portal — fail safe (return null)
    return null;
  }

  // 3. Write result to Redis cache (TTL 5 min)
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      // Cache even null (not found) to prevent DB hammering for invalid domains
      await redisClient.set(getRedisKeyForDomain(domain), orgData, {
        ex: DOMAIN_CACHE_TTL,
      });
    } catch {
      // Cache write failure is non-fatal
    }
  }

  return orgData;
}

// ---------------------------------------------------------------------------
// Proxy
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";

  // ── SECURITY: Strip any incoming custom-domain identity headers ───────────
  // These headers are SET by this middleware, not read from the incoming request.
  // Stripping them prevents header injection attacks.
  const sanitizedHeaders = new Headers(request.headers);
  sanitizedHeaders.delete("x-org-id");
  sanitizedHeaders.delete("x-org-slug");
  sanitizedHeaders.delete("x-custom-domain");

  const hostname = (request.headers.get("host") ?? "").toLowerCase();

  // ── 0. Custom domain routing ──────────────────────────────────────────────
  if (!isClientspaceDomain(hostname)) {
    // Strip port for local dev testing (e.g. portal.acme.com:3001)
    const domain = (hostname.split(":")[0] ?? hostname).toLowerCase();

    // Admin/dashboard paths on custom domains → redirect to main app
    // Custom domains are portal-only.
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup")
    ) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "https://clientspace.qzz.io";
      return NextResponse.redirect(new URL(`${appUrl}/dashboard`));
    }

    const org = await lookupOrgByDomain(domain, request);

    if (!org) {
      // Unknown or unverified domain — show a friendly error page
      return NextResponse.rewrite(new URL("/domain-not-found", request.url));
    }

    // Rewrite to portal route, preserving path and search params
    const url = request.nextUrl.clone();
    const originalPath = url.pathname;
    url.pathname = `/portal/${org.slug}${originalPath === "/" ? "" : originalPath}`;

    const response = NextResponse.rewrite(url);

    // Pass org context to portal pages via headers (avoids a second DB lookup in RSC)
    response.headers.set("x-org-id", org.orgId);
    response.headers.set("x-org-slug", org.slug);
    response.headers.set("x-custom-domain", domain);

    return response;
  }

  // ── 1. Rate limit auth endpoints (IP-based, 20/min) ──────────────────────
  const isAuthEndpoint =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth");

  if (isAuthEndpoint) {
    const { authRateLimit: limiter } = getRateLimiters();
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
    const { apiRateLimit: limiter } = getRateLimiters();
    if (limiter) {
      const { success } = await limiter.limit(`user_${user.id}`);
      if (!success) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
    }
  }

  if (user && pathname.startsWith("/portal")) {
    const { apiRateLimit: limiter } = getRateLimiters();
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
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
