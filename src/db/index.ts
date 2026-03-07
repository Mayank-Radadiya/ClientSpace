import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// prepare: false is required for Supabase Transaction Pooler (port 6543).
// If you switch to Session Pooler (port 5432), you can remove this option.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

// ⚠️ WARNING: This `db` export bypasses Row Level Security.
// It is ONLY for use in seed scripts and drizzle-kit migrations.
// All application code must use createDrizzleClient(session) from ./createDrizzleClient.ts
