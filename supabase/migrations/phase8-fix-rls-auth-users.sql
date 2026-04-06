-- ============================================================================
-- ClientSpace — Phase 8: Fix auth.users references in RLS policies
-- ============================================================================
-- Apply this migration to fix the 'permission denied for table users' 
-- error when clients accept an invitation.
--
-- Security fixes:
--   1. Replaced `auth.users` with `public.users` in "Users can accept client invitations" policy
--   2. Replaced `auth.users` with `public.users` in "Users can accept invitations" policy
-- ============================================================================

-- Fix: Clients table policy
DROP POLICY IF EXISTS "Users can accept client invitations" ON clients;

CREATE POLICY "Users can accept client invitations"
ON clients FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND user_id IS NULL  -- Only unlinked clients
  AND EXISTS (
    SELECT 1 FROM invitations
    WHERE invitations.client_id = clients.id
    AND invitations.email = (SELECT email FROM public.users WHERE id = auth.uid())
    AND invitations.status = 'pending'
    AND invitations.type = 'client'
    AND invitations.expires_at > NOW()
  )
)
WITH CHECK (user_id = auth.uid());


-- Fix: Invitations table policy
DROP POLICY IF EXISTS "Users can accept invitations" ON invitations;

CREATE POLICY "Users can accept invitations"
ON invitations FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND email = (SELECT email FROM public.users WHERE id = auth.uid())
  AND status = 'pending'
  AND type = 'client'
  AND expires_at > NOW()
)
WITH CHECK (
  status = 'accepted'
  AND accepted_at IS NOT NULL
);
