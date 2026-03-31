-- ============================================================================
-- ClientSpace — Phase 5: Security Hardening Migration
-- ============================================================================
-- Apply this migration to update existing RLS policies with security fixes.
-- This should be run AFTER the initial rls-policies.sql has been applied.
--
-- Security improvements:
--   1. Clients cannot create projects (role check)
--   2. Clients can only view projects if their status is 'active'
--   3. Clients can only view invoices if their status is 'active'
--   4. Clients cannot create invoices (owner/admin only)
--   5. Clients can only view their own client record if status is 'active'
-- ============================================================================

-- ================================================================
-- 1. Fix: Clients cannot create projects
-- ================================================================
DROP POLICY IF EXISTS "Org members can create projects" ON projects;
DROP POLICY IF EXISTS "Team can create projects (not clients)" ON projects;

CREATE POLICY "Team can create projects (not clients)"
ON projects FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = projects.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

-- ================================================================
-- 2. Fix: Check client status='active' in project visibility
-- ================================================================
DROP POLICY IF EXISTS "Role-based project viewing" ON projects;

CREATE POLICY "Role-based project viewing"
ON projects FOR SELECT
USING (
  -- 1. Owner/Admin: All projects in org
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = projects.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin')
  )
  OR
  -- 2. Member: Only projects they are explicitly assigned to
  (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = projects.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.role = 'member'
    )
    AND
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  )
  OR
  -- 3. Client: Only projects mapped to their client_id AND status is 'active'
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = projects.client_id
    AND clients.user_id = auth.uid()
    AND clients.status = 'active'
  )
);

-- ================================================================
-- 3. Fix: Check client status in invoice visibility
-- ================================================================
DROP POLICY IF EXISTS "Invoice visibility" ON invoices;

CREATE POLICY "Invoice visibility"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = invoices.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
  OR
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = invoices.client_id
    AND clients.user_id = auth.uid()
    AND clients.status = 'active'
  )
);

-- ================================================================
-- 4. Fix: Clients cannot create invoices (owner/admin only)
-- ================================================================
DROP POLICY IF EXISTS "Team manages invoices" ON invoices;
DROP POLICY IF EXISTS "Team can create invoices (not clients)" ON invoices;
DROP POLICY IF EXISTS "Team deletes invoices" ON invoices;

-- Split the ALL policy into separate policies for better control
CREATE POLICY "Team can create invoices (not clients)"
ON invoices FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = invoices.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Team manages invoices"
ON invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = invoices.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "Team deletes invoices"
ON invoices FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = invoices.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

-- ================================================================
-- 5. Fix: Clients can only view their own record if active
-- ================================================================
DROP POLICY IF EXISTS "Client visibility" ON clients;

CREATE POLICY "Client visibility"
ON clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = clients.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
  OR
  (user_id = auth.uid() AND status = 'active')
);

-- ================================================================
-- Verification Queries (Optional - Comment out in production)
-- ================================================================
-- Uncomment these to verify the policies are correctly applied:

-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'projects'
-- ORDER BY policyname;

-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'invoices'
-- ORDER BY policyname;

-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'clients'
-- ORDER BY policyname;
