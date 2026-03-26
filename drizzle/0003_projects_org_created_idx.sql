-- Migration: Add composite index for project.getAll hot path
-- The getAll query orders by created_at DESC scoped to an org (via RLS).
-- The existing projects_org_client_idx covers (org_id, client_id) but not the sort.
-- This index lets Postgres serve the query with an index scan instead of a seq scan + sort.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_org_created_idx"
  ON "projects" USING btree ("org_id", "created_at" DESC);
