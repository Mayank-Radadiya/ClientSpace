import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

// PRD §10.2: All database access MUST go through this factory.
// It MUST be called with a sessionContext that carries the authenticated user's ID
// so that Drizzle can set the `app.current_user_id` Postgres config variable,
// which the RLS policies depend on.
//
// NEVER export a bare `drizzle(...)` instance from this file or src/db/index.ts.
// Direct instantiation bypasses Row Level Security and is BANNED.
export function createDrizzleClient(sessionContext: { userId: string }) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(sql, { schema: { ...schema, ...relations } });
  // TODO (Task 03): Execute `SET app.current_user_id = '${sessionContext.userId}'`
  // before returning db, to activate RLS policies.
  void sessionContext; // Remove this line once RLS is wired in Task 03.
  return db;
}
