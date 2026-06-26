import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { cache } from "react";
import { headers } from "next/headers";
import { getActiveOrgId } from "@/lib/auth/orgSwitcher";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import { createClient } from "@/lib/supabase/server";
import { checkMFARequirement, type MfaState } from "@/lib/auth/mfa";
import { getOrgMemberships } from "@/lib/auth/getOrgMemberships";


// Context shape available in all procedures
export type TRPCContext = {
  userId: string;
  orgId: string;
  role: string;
  mfaState: MfaState; // ponytail: expose state so callers can route
  availableOrgs: Array<{
    orgId: string;
    orgName: string;
    orgSlug: string;
    role: string;
  }>;
};

/**
 * Build context from the incoming request.
 *
 * Optimizations applied:
 *
 * 1. `cache()` — React's per-request memoization. When tRPC batches multiple
 *    procedures (e.g. project.getAll + client.getAll in one HTTP request),
 *    this function is called N times but executes only ONCE. All subsequent
 *    calls receive the memoized result instantly.
 *
 * 2. `getUser()` instead of `getSession()` — validates the user JWT against the
 *    Supabase Auth server, preventing spoofed JWTs from bypassing checks.
 *    While it adds a network round-trip (~200–400ms), it is required for strict security.
 *
 * 3. Fetches all memberships but only includes minimal org data (id, name, slug)
 *    to support multi-org switching without bloating the context.
 */
export const createTRPCContext = cache(
  async (): Promise<TRPCContext | null> => {
    let jwt: string | null = null;

    try {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        jwt = authHeader.substring(7);
      }

      if (!jwt) {
        const supabase = await createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        jwt = session?.access_token ?? null;
      }
    } catch (e) {
      console.error("[createTRPCContext] Failed to extract JWT:", e);
    }

    const user = jwt ? await getCachedUser(jwt) : null;
    if (!user) return null;

    const userId = user.id;

    // ponytail: shared cached query — same request won't hit DB twice
    const memberships = await getOrgMemberships(userId);

    if (!memberships || memberships.length === 0) return null;

    // Get active org from cookie
    const activeOrgId = await getActiveOrgId();

    // Find membership for active org (validate it belongs to user)
    let activeMembership = activeOrgId
      ? memberships.find((m) => m.orgId === activeOrgId)
      : undefined;

    // Fallback to first membership if cookie invalid/missing
    if (!activeMembership) {
      activeMembership = memberships[0]!; // Safe: we already checked memberships.length > 0
    }

    // MFA enforcement: check status, include in context
    const mfaResult = await checkMFARequirement(activeMembership.role, userId);
    const mfaState: MfaState = mfaResult?.state ?? "not_required";

    return {
      userId,
      orgId: activeMembership.orgId,
      role: activeMembership.role,
      mfaState,
      availableOrgs: memberships.map((m) => ({
        orgId: m.orgId,
        orgName: m.organization.name,
        orgSlug: m.organization.slug,
        role: m.role,
      })),
    };
  },
);

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;

// Base procedure — no auth check (for public endpoints if needed)
export const publicProcedure = t.procedure;

/**
 * Timing middleware — logs each procedure's name and duration.
 * Remove or gate behind NODE_ENV in production if log volume is a concern.
 */
const timingMiddleware = t.middleware(async ({ path, next }) => {
  const start = performance.now();
  const result = await next();
  const ms = (performance.now() - start).toFixed(1);
  if (process.env.NODE_ENV === "development") {
    console.log(`[tRPC] ${path} — ${ms}ms`);
  }
  return result;
});


/**
 * Protected procedure — requires an authenticated session.
 * Context is built once per request (see cache() above), not once per procedure.
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ next }) => {
    const ctx = await createTRPCContext();
    if (!ctx) throw new TRPCError({ code: "UNAUTHORIZED" });
    // ponytail: MFA gate — reject only if enrolled but session isn't AAL2. not_enrolled is allowed for new owner onboarding.
    if (ctx.mfaState === "enrolled_unverified") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `MFA required: ${ctx.mfaState}`,
      });
    }
    return next({ ctx });
  });

/**
 * Mutation procedure that applies user-scoped rate limiting (max 30 writes/min).
 */
export const rateLimitedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  try {
    const { mutationRateLimiter } = await import("@/lib/redis");
    if (mutationRateLimiter) {
      const { success } = await mutationRateLimiter.limit(ctx.userId);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You have exceeded the rate limit of 30 writes per minute. Please try again later.",
        });
      }
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[rateLimitedProcedure] Rate limiting check error:", error);
  }
  return next();
});
