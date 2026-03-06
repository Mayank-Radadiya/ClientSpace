// src/db/index.ts
// Drizzle client singleton + RLS factory re-export.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚠️  PRODUCTION CODE MUST USE `withRLS()` — NOT `db` DIRECTLY.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// The `withRLS()` wrapper executes all queries within a transaction that
// sets `app.current_org_id` and `app.current_user_id` as Postgres session
// variables, enforcing Row Level Security at the database layer.
//
// Bare `db` usage is ONLY permitted in:
//   - Seed scripts (`src/db/seed.ts`)
//   - Drizzle migration runner
//   - Test fixtures
//
// See PRD §10.2 for the full architectural constraint.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for Supabase Transaction Pooler compatibility.
// This is the shared pool — reused by withRLS() internally.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema: { ...schema, ...relations } });

// Primary export for production usage — transaction-wrapped RLS enforcement.
export { withRLS } from "./createDrizzleClient";

// Deprecated shim — will be removed after full codebase migration.
export { createDrizzleClient } from "./createDrizzleClient";
