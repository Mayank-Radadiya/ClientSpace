-- ============================================================
-- Setup: org-assets Supabase Storage bucket + RLS policies
-- ============================================================
-- Run this directly in the Supabase SQL editor or via a
-- Supabase migration (supabase/migrations/).
--
-- Bucket purpose: Stores agency logo, logo mark, and favicon
-- assets for the white-label portal theming system.
-- ============================================================

-- ─── 1. Create the bucket (idempotent) ──────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-assets',
  'org-assets',
  true,              -- Public: logos must be accessible on client portals without auth
  5242880,           -- 5MB limit
  ARRAY[
    'image/png',
    'image/svg+xml',
    'image/webp',
    'image/x-icon'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
      'image/png',
      'image/svg+xml',
      'image/webp',
      'image/x-icon'
    ];

-- ─── 2. RLS policies ─────────────────────────────────────────

-- DROP existing policies if re-running (idempotent)
DROP POLICY IF EXISTS "Org assets public read" ON storage.objects;
DROP POLICY IF EXISTS "Org assets authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Org assets authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Org assets authenticated delete" ON storage.objects;

-- SELECT: anyone can read public logos (required for client portals with no auth)
CREATE POLICY "Org assets public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'org-assets');

-- INSERT: authenticated users can only upload to paths starting with their org_id.
-- Org ID is looked up via org_memberships to verify the user belongs to that org.
-- Path format enforced by application: {orgId}/{filename}
CREATE POLICY "Org assets authenticated insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets'
    AND (
      -- The first segment of the storage path must equal an org the user belongs to
      EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id::text = split_part(name, '/', 1)
          AND om.role IN ('owner', 'admin')
      )
    )
  );

-- UPDATE: same check — must be owner/admin of the org that owns the path
CREATE POLICY "Org assets authenticated update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.org_id::text = split_part(name, '/', 1)
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'org-assets'
    AND EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.org_id::text = split_part(name, '/', 1)
        AND om.role IN ('owner', 'admin')
    )
  );

-- DELETE: same ownership check
CREATE POLICY "Org assets authenticated delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.org_id::text = split_part(name, '/', 1)
        AND om.role IN ('owner', 'admin')
    )
  );
