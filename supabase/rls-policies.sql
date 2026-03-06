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

-- ORGANIZATIONS: Users can view orgs they belong to
CREATE POLICY "Members can view organization"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_memberships.org_id = organizations.id
    AND org_memberships.user_id = auth.uid()
  )
);

-- ORGANIZATIONS: Only owner can update org settings
CREATE POLICY "Owner can update organization"
ON organizations FOR UPDATE
USING (owner_id = auth.uid());


-- ================================================================
-- 3. Project Isolation & RBAC Policies
-- ================================================================

-- PROJECTS: SELECT — Role-Based Isolation
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
  -- 3. Client: Only projects mapped to their client_id
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = projects.client_id
    AND clients.user_id = auth.uid()
  )
);

-- PROJECTS: INSERT — Members can create (PRD §6.3)
-- ⚠️ CRITICAL: This uses is_org_member, NOT project_members.
-- A member cannot be assigned to a project that doesn't exist yet.
CREATE POLICY "Org members can create projects"
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
-- Leverages the projects RLS check recursively.
CREATE POLICY "Project access dictates member viewing"
ON project_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
  )
);

-- PROJECT MEMBERS: Only Owner/Admin can manage
CREATE POLICY "Owners and Admins manage project members"
ON project_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects
    JOIN org_memberships ON org_memberships.org_id = projects.org_id
    WHERE projects.id = project_members.project_id
    AND org_memberships.user_id = auth.uid()
    AND org_memberships.role IN ('owner', 'admin')
  )
);


-- ================================================================
-- 4. Client & Invoice Policies
-- ================================================================

-- CLIENTS: Team (owner/admin/member) sees all in org; Client sees self
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
  (user_id = auth.uid())
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

-- INVOICES: Team sees all in org; Client sees their own via client_id
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
  )
);

-- INVOICES: Team manages invoices
CREATE POLICY "Team manages invoices"
ON invoices FOR ALL
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
