import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth/getUser";

// Context shape available in all procedures
export type TRPCContext = {
  userId: string;
  orgId: string;
  role: string;
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
 * 3. `columns` projection on membership query — fetches only the two fields
 *    we need instead of the full row.
 */
export const createTRPCContext = cache(
  async (): Promise<TRPCContext | null> => {
    // Uses the cached getUser to avoid duplicate network calls
    const user = await getUser();
    if (!user) return null;

    const userId = user.id;

    const membership = await withRLS(
      { userId, orgId: "SYSTEM" },
      async (tx) => {
        return tx.query.orgMemberships.findFirst({
          where: eq(orgMemberships.userId, userId),
          columns: { orgId: true, role: true },
        });
      },
    );

    if (!membership) return null;

    return {
      userId,
      orgId: membership.orgId,
      role: membership.role,
    };
  },
);

const t = initTRPC.context<TRPCContext>().create();

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
  console.log(`[tRPC] ${path} — ${ms}ms`);
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
    return next({ ctx });
  });
