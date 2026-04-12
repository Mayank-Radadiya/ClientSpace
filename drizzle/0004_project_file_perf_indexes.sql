-- Migration: improve filtered project list and project files queries.
-- 1) Speeds up /projects filtered list by (org, status, priority, created_at).
-- 2) Speeds up project files listing by (project, folder, deleted, updated_at).
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_org_status_priority_created_idx"
  ON "projects" USING btree ("org_id", "status", "priority", "created_at" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "assets_project_folder_deleted_updated_idx"
  ON "assets" USING btree ("project_id", "folder_id", "deleted_at", "updated_at" DESC);
