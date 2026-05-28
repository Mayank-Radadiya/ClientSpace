-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0008_perf_composite_indexes_invoices_assets
-- Purpose  : Add production-grade composite indexes to the invoices and assets
--            tables to guarantee sub-50ms query performance as the database
--            scales to millions of rows.
--
-- APPLY VIA  : Supabase dashboard SQL editor  OR  a CI migration step.
--              Do NOT run drizzle-kit push against production.
-- ROLLBACK   : DROP INDEX IF EXISTS invoices_org_status_paid_idx;
--              DROP INDEX IF EXISTS assets_project_deleted_updated_idx;
--
-- RLS COMPATIBILITY NOTE:
--   Both indexes are built on the exact tenant-isolation columns (org_id,
--   project_id) that existing RLS policies already filter on. Postgres indexes
--   accelerate the WHERE clause evaluation — they do not bypass or alter the
--   RLS policy enforcement. EXPLAIN ANALYZE after creation should show
--   "Index Scan" or "Bitmap Index Scan", not "Seq Scan".
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── INDEX 1: invoices ────────────────────────────────────────────────────────
-- Supports: Agency revenue dashboard query
--   SELECT * FROM invoices
--   WHERE org_id = $1 AND status IN ('paid', 'overdue')
--   ORDER BY paid_at DESC
--   LIMIT 50;
--
-- Rationale: The three-column composite covers the full WHERE + ORDER BY in
-- one index scan (org_id pins the tenant partition, status filters to relevant
-- rows, paid_at satisfies the sort). Without this index Postgres performs a
-- full table scan over all org invoices.
-- Does NOT replace existing indexes (invoices_org_client_idx,
-- invoices_overdue_idx, invoices_org_status_due_date_idx).

CREATE INDEX IF NOT EXISTS "invoices_org_status_paid_idx"
  ON "invoices"
  USING btree ("org_id", "status", "paid_at");

-- ── INDEX 2: assets ──────────────────────────────────────────────────────────
-- Supports: File manager query
--   SELECT * FROM assets
--   WHERE project_id = $1 AND deleted_at IS NULL
--   ORDER BY updated_at DESC;
--
-- Rationale: deleted_at IS NULL is extremely selective — the vast majority of
-- rows have a null deleted_at. Including deleted_at in the index allows the
-- planner to use a partial-like scan (nulls are indexed by btree and compared
-- efficiently). The existing assets_project_folder_deleted_updated_idx covers
-- (project_id, folder_id, deleted_at, updated_at); this new index omits
-- folder_id so the planner can use it for folder-agnostic file-manager queries.

CREATE INDEX IF NOT EXISTS "assets_project_deleted_updated_idx"
  ON "assets"
  USING btree ("project_id", "deleted_at", "updated_at");

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION (run after applying in staging/production)
-- ─────────────────────────────────────────────────────────────────────────────
-- EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM invoices
--   WHERE org_id = '<your-org-id>'
--     AND status IN ('paid', 'overdue')
--   ORDER BY paid_at DESC
--   LIMIT 50;
-- Expected plan: "Index Scan using invoices_org_status_paid_idx on invoices"
--
-- EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM assets
--   WHERE project_id = '<your-project-id>'
--     AND deleted_at IS NULL
--   ORDER BY updated_at DESC;
-- Expected plan: "Index Scan using assets_project_deleted_updated_idx on assets"
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- ADDITIONAL INDEXES TO CONSIDER (do NOT create yet — pending query profiling)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Client projects list
-- CREATE INDEX IF NOT EXISTS "projects_org_status_created_at_idx"
--   ON "projects"
--   USING btree ("org_id", "status", "created_at" DESC);

-- 2. Annotation thread loading
-- CREATE INDEX IF NOT EXISTS "comments_asset_created_idx"
--   ON "comments"
--   USING btree ("asset_id", "created_at");

-- 3. Timeline views
-- CREATE INDEX IF NOT EXISTS "milestones_project_due_completed_idx"
--   ON "milestones"
--   USING btree ("project_id", "due_date", "completed_at");