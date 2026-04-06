-- ============================================================================
-- Phase 9: Fix Users Table INSERT Policy
-- ============================================================================
-- Fixes: "Key is not present in table users" error during client signup
-- Root cause: Supabase auth trigger blocked by missing INSERT policy
--
-- Error Details:
--   - When clients sign up via invitation, supabase.auth.signUp() creates auth.users
--   - The trigger "on_auth_user_created" attempts to INSERT into public.users
--   - RLS is enabled on public.users but no INSERT policy exists
--   - Even though trigger is SECURITY DEFINER, RLS still applies
--   - Result: Trigger fails silently, user not created in public.users
--   - Later: org_memberships INSERT fails with FK constraint violation
--
-- This migration adds the missing INSERT policy that allows:
--   1. The auth trigger to create user profiles (runs as authenticated)
--   2. Authenticated users to insert their own profile (idempotent safety)
-- ============================================================================

-- Allow authenticated users to insert their own user record
-- This policy covers:
--   - The handle_new_user() trigger (which runs in authenticated context)
--   - Any manual user creation via authenticated sessions
-- Security: WITH CHECK (auth.uid() = id) ensures users can only create their own profile
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Verification query (run after applying):
-- SELECT * FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;
-- You should see three policies now:
--   1. "Users can insert own profile" (INSERT)
--   2. "Users can see own profile" (SELECT)
--   3. "Users can update own profile" (UPDATE)
