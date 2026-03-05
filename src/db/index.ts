// src/db/index.ts
// Drizzle client singleton + factory re-export.
//
// ⚠️ Production code must NOT use `db` directly.
// Task 03 implements the `createDrizzleClient(session)` factory that sets
// `app.current_org_id` for RLS enforcement.
// Bare `db` usage is only permitted in seed scripts and migrations.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for Supabase Transaction Pooler compatibility
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema: { ...schema, ...relations } });

// Re-export the RLS-aware factory for production usage
export { createDrizzleClient } from "./createDrizzleClient";
