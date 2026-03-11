import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { pool } from "./pool";

export const db = drizzle(pool, { schema });

// ⚠️ WARNING: This `db` export bypasses Row Level Security.
// It is ONLY for use in seed scripts and drizzle-kit migrations.
// All application code must use withRLS() from ./createDrizzleClient.ts
