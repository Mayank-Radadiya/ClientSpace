// src/db/createDrizzleClient.ts
// ============================================================================
// PRD §10.2: Secure Drizzle Factory — Transaction-Based RLS Enforcement
// ============================================================================
//
// ⚠️ ARCHITECTURAL RULE: All database access outside of seed/migration scripts
//    MUST go through `withRLS()`. Direct usage of the bare `db` export is BANNED.
//
// Why a transaction wrapper and not a returned db instance?
// ────────────────────────────────────────────────────────
// `set_config('app.current_org_id', orgId, true)` is *transaction-local*.
// If we set it and return the db instance, the transaction ends immediately,
// and the next query will grab a fresh connection from the pool where the
// config is NULL — causing silent RLS data blocks.
//
// The `withRLS()` wrapper guarantees that `set_config` and all subsequent
// queries execute within the SAME transaction.
//
// Phase 2 Upgrade Path:
//   RLS policies will read `current_setting('app.current_org_id')` directly
//   for O(1) tenant checks, replacing inline org_memberships lookups.
// ============================================================================

import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

// ─── Shared connection pool ──────────────────────────────────────────────────
// This is the SAME pool used by src/db/index.ts.
// We instantiate it here to avoid a circular import:
//   createDrizzleClient.ts → @/db (index.ts) → createDrizzleClient.ts
const pool = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(pool, { schema: { ...schema, ...relations } });

type SessionContext = {
  userId: string;
  orgId: string;
};

type DbType = typeof db;
type TransactionScope = Parameters<Parameters<DbType["transaction"]>[0]>[0];

/**
 * Execute database operations within an RLS-scoped transaction.
 *
 * Sets `app.current_org_id` and `app.current_user_id` as transaction-local
 * Postgres config variables so that RLS policies can enforce tenant isolation.
 *
 * @example
 * ```ts
 * const projects = await withRLS(
 *   { userId: session.userId, orgId: session.orgId },
 *   async (tx) => {
 *     return tx.query.projects.findMany();
 *   }
 * );
 * ```
 */
export async function withRLS<T>(
  ctx: SessionContext,
  callback: (tx: TransactionScope) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // Inject the tenant context into the current transaction.
    // `true` = is_local → scoped to THIS transaction only.
    // Prevents cross-request leakage in pooled connections.
    await tx.execute(
      sql`SELECT set_config('app.current_org_id', ${ctx.orgId}, true)`,
    );
    await tx.execute(
      sql`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`,
    );

    // Execute the caller's query within the secured transaction.
    return callback(tx);
  });
}

// Re-export the old function name with deprecation for backward compatibility
// during migration from bare createDrizzleClient usage.
/**
 * @deprecated Use `withRLS()` instead. This exists only for migration compatibility.
 */
export async function createDrizzleClient(ctx: SessionContext) {
  // This is intentionally NOT safe — it returns a bare db instance.
  // Callers should migrate to withRLS().
  console.warn(
    "[DEPRECATED] createDrizzleClient() is deprecated. Use withRLS() instead.",
  );
  await db.execute(
    sql`SELECT set_config('app.current_org_id', ${ctx.orgId}, true)`,
  );
  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`,
  );
  return db;
}
