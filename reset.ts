import { db } from "./src/db";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

async function reset() {
  try {
    console.log("Resetting database...");
    
    // We'll run a dynamic PL/pgSQL block to truncate all tables in the public schema
    // except for 'drizzle_migrations' if it exists there.
    const query = sql`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'drizzle_migrations') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `;
    
    await db.execute(query);
    console.log("✅ Successfully deleted all data from Supabase!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to delete data:", error);
    process.exit(1);
  }
}

reset();
