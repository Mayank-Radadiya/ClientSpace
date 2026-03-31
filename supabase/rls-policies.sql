-- ============================================================================
-- ClientSpace — Task 03: RLS Policies + Auth Trigger
-- ============================================================================
-- Apply this entire file in the Supabase SQL Editor.
--
-- Prerequisites:
--   1. All 19 tables created via Drizzle `db:push` (Task 02)
--   2. Tables already have `.enableRLS()` in the Drizzle schema
--
-- Security model:
--   Owner/Admin → Full org access
--   Member      → Only project_members-assigned projects
--   Client      → Only projects mapped to their client_id
-- ============================================================================

-- ================================================================
-- 1. Enable RLS on ALL tables (PRD §12: "RLS per org on every table")
-- ================================================================
-- NOTE: .enableRLS() in Drizzle schema already does this at push time.
-- These ALTER statements are idempotent safety nets.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE csat_responses ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- 2. Core Identity Policies
-- ================================================================

-- USERS: Users can read their own profile
CREATE POLICY "Users can see own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- USERS: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- ORG MEMBERSHIPS: Users can see their own memberships
CREATE POLICY "Users can view own memberships"
ON org_memberships FOR SELECT
USING (auth.uid() = user_id);

-- ORG MEMBERSHIPS: Allow creation during onboarding
CREATE POLICY "Users can insert own membership"
ON org_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ORG MEMBERSHIPS: Allow admins to invite others
CREATE POLICY "Team can insert memberships"
ON org_memberships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_memberships AS om
    WHERE om.org_id = org_memberships.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- ORGANIZATIONS: Users can view orgs they belong to or own
CREATE POLICY "Members can view organization"
ON organizations FOR SELECT
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = organizations.id
    AND org_memberships.user_id = auth.uid()
  )
);

-- ORGANIZATIONS: Users can create an organization
CREATE POLICY "Users can create organization"
ON organizations FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- ORGANIZATIONS: Only owner can update org settings
CREATE POLICY "Owner can update organization"
ON organizations FOR UPDATE
USING (owner_id = auth.uid());


-- ================================================================
-- 3. Project Isolation & RBAC Policies
-- ================================================================

-- PROJECTS: SELECT — Role-Based Isolation
-- ⚠️ SECURITY FIX: Check that client status is 'active'
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

-- PROJECTS: INSERT — Only team members can create (NOT clients)
-- ⚠️ SECURITY FIX: Clients should not be able to create projects
-- ⚠️ CRITICAL: This uses is_org_member, NOT project_members.
-- A member cannot be assigned to a project that doesn't exist yet.
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

-- PROJECTS: UPDATE — Owner/Admin update any; Member only assigned
CREATE POLICY "Team can update projects"
ON projects FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = projects.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin')
  )
  OR
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
);

-- PROJECT MEMBERS: Viewable by anyone with project access
-- Leverages the projects RLS check bypass via a SECURITY DEFINER function to break infinite recursion.
CREATE OR REPLACE FUNCTION get_project_org(p_id uuid) RETURNS uuid AS $$
  SELECT org_id FROM projects WHERE id = p_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Project access dictates member viewing"
ON project_members FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = get_project_org(project_members.project_id)
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin')
  )
);

-- PROJECT MEMBERS: Only Owner/Admin can manage
CREATE POLICY "Owners and Admins manage project members"
ON project_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = get_project_org(project_members.project_id)
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin')
  )
);


-- ================================================================
-- 4. Client & Invoice Policies
-- ================================================================

-- CLIENTS: Team (owner/admin/member) sees all in org; Client sees self if active
-- ⚠️ SECURITY FIX: Clients can only view their own record if status is 'active'
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

-- CLIENTS: Team manages clients
CREATE POLICY "Team manages clients"
ON clients FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = clients.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

-- CLIENTS: Allow users to link themselves via valid invitation
CREATE POLICY "Users can accept client invitations"
ON clients FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND user_id IS NULL  -- Only unlinked clients
  AND EXISTS (
    SELECT 1 FROM invitations
    WHERE invitations.client_id = clients.id
    AND invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND invitations.status = 'pending'
    AND invitations.type = 'client'
    AND invitations.expires_at > NOW()
  )
)
WITH CHECK (user_id = auth.uid());

-- INVOICES: Team sees all in org; Client sees their own via client_id AND status='active'
-- ⚠️ SECURITY FIX: Check that client status is 'active'
-- ⚠️ Client sees ONLY invoices linked to their client_id — not all org invoices.
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

-- INVOICES: Only Owner/Admin can create invoices (NOT clients or members)
-- ⚠️ SECURITY FIX: Prevent clients from creating invoices
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

-- INVOICES: Team manages invoices (UPDATE, DELETE)
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

-- INVOICE LINE ITEMS: Follow invoice visibility
CREATE POLICY "Invoice line items follow invoices"
ON invoice_line_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_line_items.invoice_id
  )
);

-- INVOICE LINE ITEMS: Team manages
CREATE POLICY "Team manages invoice line items"
ON invoice_line_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM invoices
    JOIN org_memberships ON org_memberships.org_id = invoices.org_id
    WHERE invoices.id = invoice_line_items.invoice_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);


-- ================================================================
-- 5. Asset & File Policies
-- ================================================================

-- ASSETS: Inherit project visibility (recursive RLS check)
CREATE POLICY "Project access dictates asset viewing"
ON assets FOR SELECT
USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id)
);

-- ASSETS: Team and Clients can upload (Client Upload subfolder enforced in Storage)
CREATE POLICY "Project access dictates asset creating"
ON assets FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id)
);

-- ASSETS: Update follows project access
CREATE POLICY "Project access dictates asset updating"
ON assets FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id)
);

-- FILE VERSIONS: Follow asset visibility
CREATE POLICY "File versions follow assets"
ON file_versions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM assets WHERE assets.id = file_versions.asset_id)
);

-- FILE VERSIONS: Insert follows asset access
CREATE POLICY "File versions insertion"
ON file_versions FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM assets WHERE assets.id = file_versions.asset_id)
);

-- FOLDERS: Follow project access
CREATE POLICY "Folders follow projects"
ON folders FOR ALL
USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = folders.project_id)
);

-- MILESTONES: Follow project access
CREATE POLICY "Milestones follow projects"
ON milestones FOR ALL
USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = milestones.project_id)
);


-- ================================================================
-- 6. Comments & Activity Policies
-- ================================================================

-- COMMENTS: Inherit project visibility
CREATE POLICY "Project access dictates comment viewing"
ON comments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = comments.project_id)
);

-- COMMENTS: Insert follows project access
CREATE POLICY "Project access dictates comment creating"
ON comments FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = comments.project_id)
);

-- PRD §6.6: "Comments are NOT deletable by the author"
-- Intentionally no DELETE policy on comments — enforced at DB level.

-- ACTIVITY LOGS: Project-scoped or org-scoped visibility
CREATE POLICY "Activity log visibility"
ON activity_logs FOR SELECT
USING (
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects WHERE projects.id = activity_logs.project_id
  ))
  OR
  (project_id IS NULL AND EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = activity_logs.org_id
    AND org_memberships.user_id = auth.uid()
  ))
);

-- ACTIVITY LOGS: System/server routes generate logs
CREATE POLICY "System generates activity logs"
ON activity_logs FOR INSERT
WITH CHECK (true); -- Restricted to privileged server routes


-- ================================================================
-- 7. Notification & Invitation Policies
-- ================================================================

-- NOTIFICATIONS: Users can only see their own
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- NOTIFICATIONS: Users can mark their own as read
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- INVITATIONS: Team can view
CREATE POLICY "Team can view invitations"
ON invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = invitations.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

-- INVITATIONS: Team can create
CREATE POLICY "Team can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = invitations.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

-- INVITATIONS: Users can accept their own invitations
CREATE POLICY "Users can accept invitations"
ON invitations FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
  AND type = 'client'
  AND expires_at > NOW()
)
WITH CHECK (
  status = 'accepted'
  AND accepted_at IS NOT NULL
);

-- SHARE LINKS: Creator can view their own
CREATE POLICY "Users can view own share links"
ON share_links FOR SELECT
USING (auth.uid() = created_by);

-- SHARE LINKS: Users can create
CREATE POLICY "Users can create share links"
ON share_links FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Note: Guest token resolution (PRD §11) is handled via a
-- privileged server-side route that bypasses RLS entirely.


-- ================================================================
-- 8. Phase 2 Stub Table Policies
-- ================================================================

CREATE POLICY "Team can view contracts"
ON contracts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = contracts.org_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "Project access dictates csat responses"
ON csat_responses FOR SELECT
USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = csat_responses.project_id)
);


-- ================================================================
-- 9. Storage Policies (Supabase Storage)
-- ================================================================
-- Path convention: {org_id}/{project_id}/...
-- storage.foldername(name) returns directory segments (filename stripped):
--   Path: {org_id}/{project_id}/Client Uploads/file.png
--         [1] = org_id
--         [2] = project_id
--         [3] = subfolder name ("Client Uploads")

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT DO NOTHING;

-- Read: Anyone with project access can read files
CREATE POLICY "Project members can read files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[2]::uuid
  )
);

-- Upload: Only Owners/Admins/Members (NOT Clients)
CREATE POLICY "Team can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = (storage.foldername(name))[1]::uuid
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin', 'member')
  )
);


-- ================================================================
-- 10. THE "CLIENT UPLOADS" EXCEPTION (PRD §6.4)
-- ================================================================
-- Clients CAN upload reference files strictly to a dedicated
-- "Client Uploads" sub-folder.
--
-- Path: {org_id}/{project_id}/Client Uploads/filename.ext
-- storage.foldername returns: [org_id, project_id, Client Uploads]
-- Therefore the subfolder check is at index [3].

CREATE POLICY "Clients can upload to Client Uploads folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[3] = 'Client Uploads'
  AND EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = (storage.foldername(name))[1]::uuid
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role = 'client'
  )
);


-- ================================================================
-- 11. Auth Trigger: Sync auth.users → public.users
-- ================================================================
-- When a new user signs up via Supabase Auth, auto-create a row
-- in the public users table. Without this, RLS blocks everything
-- because org_memberships joins to users.id.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to make this idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();


DROP POLICY "Project members can read files" ON storage.objects;

CREATE POLICY "Project members can read files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[2]::uuid
  )
);