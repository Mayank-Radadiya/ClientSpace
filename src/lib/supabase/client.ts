// src/lib/supabase/client.ts
// Browser client for Client Components.
// Uses the anon key — all queries are subject to RLS.
//
// Generic over Database so all query results carry full type inference.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/db/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
