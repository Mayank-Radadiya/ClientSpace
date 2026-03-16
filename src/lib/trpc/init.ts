import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";

// Context shape available in all procedures
export type TRPCContext = {
  userId: string;
  orgId: string;
  role: string;
};

// Build context from the incoming request (called per request)
export async function createTRPCContext(): Promise<TRPCContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const membership = await withRLS(
    { userId: user.id, orgId: "SYSTEM" },
    async (tx) => {
      return tx.query.orgMemberships.findFirst({
        where: eq(orgMemberships.userId, user.id),
      });
    },
  );

  if (!membership) return null;

  return {
    userId: user.id,
    orgId: membership.orgId,
    role: membership.role,
  };
}

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;

// Base procedure — no auth check (for public endpoints if needed)
export const publicProcedure = t.procedure;

// Protected procedure — requires authenticated session
export const protectedProcedure = t.procedure.use(async ({ next }) => {
  const ctx = await createTRPCContext();
  if (!ctx) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx });
});
