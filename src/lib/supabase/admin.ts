import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase Admin client with the Service Role Key.
 * * ⚠️ WARNING: This client bypasses ALL Row Level Security (RLS) policies.
 * It should ONLY be used in secure Server Actions, API routes, or background jobs
 * for administrative tasks like updating `app_metadata` or syncing webhooks.
 * * DO NOT use this for standard database queries where user permissions apply.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Admin clients on the server shouldn't manage or persist sessions
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
