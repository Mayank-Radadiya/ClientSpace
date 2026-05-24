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
import { pool } from "./pool";
import * as schema from "./schema";
import * as relations from "./relations";

const db = drizzle(pool, { schema: { ...schema, ...relations } });

type SessionContext = {
  userId: string;
  orgId: string;
};

const UUID_V4_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_V4_LIKE_REGEX.test(value);
}

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
    const jwtClaims = isUuid(ctx.userId) ? { sub: ctx.userId } : {};

    // 1. Switch to authenticated role
    // 2. Inject tenant context (orgId & userId) into transaction scope (is_local = true)
    // 3. Inject JWT claims so Supabase's auth.uid() function resolves naturally in RLS.
    //
    // Optimization: Executing all configuration variables in a single query saves 3 network round-trips per transaction.
    await tx.execute(sql`
      SELECT 
        set_config('role', 'authenticated', true),
        set_config('app.current_org_id', ${ctx.orgId}::text, true),
        set_config('app.current_user_id', ${ctx.userId}::text, true),
        set_config('request.jwt.claims', ${JSON.stringify(jwtClaims)}::text, true)
    `);

    // Execute the caller's query within the secured transaction.
    return callback(tx);
  });
}

function wrapQueryBuilder(builder: any, ctx: SessionContext): any {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === "then") {
        return (onfulfilled?: any, onrejected?: any) => {
          return withRLS(ctx, async (tx) => {
            target.session = (tx as any).session || tx;
            return target;
          }).then(onfulfilled, onrejected);
        };
      }
      if (prop === "execute") {
        return () => {
          return withRLS(ctx, async (tx) => {
            target.session = (tx as any).session || tx;
            return target.execute();
          });
        };
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return (...args: any[]) => {
          const nextBuilder = value.apply(target, args);
          return wrapQueryBuilder(nextBuilder, ctx);
        };
      }
      return value;
    }
  });
}

function wrapRelationalQuery(modelQueries: any, qProp: string, ctx: SessionContext): any {
  return new Proxy(modelQueries, {
    get(target, prop) {
      const method = target[prop as keyof typeof target];
      if (typeof method === "function") {
        return (...args: any[]) => {
          return withRLS(ctx, async (tx) => {
            const txModel = tx.query[qProp as keyof typeof tx.query];
            return (txModel as any)[prop](...args);
          });
        };
      }
      return Reflect.get(target, prop);
    }
  });
}

/**
 * Returns a secured, RLS-enforcing database client.
 * Uses ES Proxies to transparently wrap all queries in a transaction
 * where the active session context is injected.
 */
export async function createDrizzleClient(providedCtx?: SessionContext) {
  let ctx = providedCtx;
  if (!ctx) {
    const { getSessionContext } = await import("@/lib/auth/session");
    ctx = (await getSessionContext()) ?? undefined;
  }
  if (!ctx) {
    throw new Error("Unauthorized: No session context found");
  }

  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === "query") {
        return new Proxy(target.query, {
          get(qTarget, qProp) {
            const modelQueries = qTarget[qProp as keyof typeof qTarget];
            return wrapRelationalQuery(modelQueries, qProp as string, ctx);
          }
        });
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return (...args: any[]) => {
          const result = value.apply(target, args);
          if (result && typeof result === "object") {
            return wrapQueryBuilder(result, ctx);
          }
          return result;
        };
      }
      return value;
    }
  });
}
