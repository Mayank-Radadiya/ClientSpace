-- ============================================================================
-- ClientSpace — Task 10: Client Portal RLS hardening
-- ============================================================================

-- Keep existing visibility policies, but tighten file_versions INSERT so:
-- 1) Team can insert for any in-org asset
-- 2) Clients can insert only for assets inside "Client Uploads" folder

DROP POLICY IF EXISTS "File versions insertion" ON file_versions;
DROP POLICY IF EXISTS "Team inserts file versions" ON file_versions;
DROP POLICY IF EXISTS "Clients insert file versions to Client Uploads" ON file_versions;

CREATE POLICY "Team inserts file versions"
ON file_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM assets a
    JOIN org_memberships om ON om.org_id = a.org_id
    WHERE a.id = file_versions.asset_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "Clients insert file versions to Client Uploads"
ON file_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM assets a
    JOIN folders f ON f.id = a.folder_id
    JOIN projects p ON p.id = a.project_id
    JOIN clients c ON c.id = p.client_id
    WHERE a.id = file_versions.asset_id
      AND f.name = 'Client Uploads'
      AND c.user_id = auth.uid()
      AND c.status = 'active'
  )
);
 