/**
 * Server-side tRPC caller.
 *
 * Use this in Server Components to call tRPC procedures directly —
 * no HTTP round-trip, no serialization overhead. Goes straight to DB.
 *
 * Usage:
 *   const caller = await getServerCaller();
 *   if (caller) {
 *     const result = await caller.project.getAll({ limit: 50 });
 *   }
 */
import { appRouter } from "./root";
import { createTRPCContext } from "./init";

export async function getServerCaller() {
  const ctx = await createTRPCContext();
  if (!ctx) return null;
  // tRPC v11: createCaller is on the router instance directly
  return appRouter.createCaller(ctx);
}
