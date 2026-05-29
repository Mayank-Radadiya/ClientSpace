-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 0011: Contracts E-Signing System
-- Replaces the Phase 2 stub contracts table with the full e-signing schema.
-- 
-- What changes:
--   1. Add contract_status enum
--   2. Drop old stub columns (signer_id, ip_address, document_url)
--   3. Add all new e-signing columns (client_id, title, status enum, body,
--      signing_token, signer data, timestamps, pdf_url)
--   4. Add forward-only status check constraint comment (enforce in app layer)
--   5. Add compound indexes for RLS-scoped queries and token lookup hot path
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Create the contract_status enum
DO $$ BEGIN
  CREATE TYPE "public"."contract_status" AS ENUM (
    'draft', 'sent', 'viewed', 'signed', 'declined', 'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Drop old stub columns that no longer exist in the schema
ALTER TABLE "contracts" DROP COLUMN IF EXISTS "signer_id";
ALTER TABLE "contracts" DROP COLUMN IF EXISTS "ip_address";
ALTER TABLE "contracts" DROP COLUMN IF EXISTS "document_url";

-- 3. Drop old default on status (was text 'pending', now enum 'draft')
ALTER TABLE "contracts" ALTER COLUMN "status" DROP DEFAULT;

-- 4. Rename old text status to a temp column so we can replace with enum
ALTER TABLE "contracts" ALTER COLUMN "status" TYPE "public"."contract_status" 
  USING 'draft'::"public"."contract_status";

-- 5. Set new default
ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."contract_status";
ALTER TABLE "contracts" ALTER COLUMN "status" SET NOT NULL;

-- 6. Add clientId (required) — backfill with org's first client if stub rows exist
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "client_id" uuid;
-- NOTE: If you have live stub contract rows, backfill client_id before adding NOT NULL.
-- In dev, the table is empty so this is safe:
ALTER TABLE "contracts" ALTER COLUMN "client_id" SET NOT NULL;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" 
  FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- 7. Add title
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "title" text NOT NULL DEFAULT '';

-- 8. Add body columns
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "body_html" text NOT NULL DEFAULT '';
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "body_plain_text" text NOT NULL DEFAULT '';

-- 9. Add signing token columns
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signing_token" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signing_token_expires_at" timestamp with time zone;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_signing_token_unique" UNIQUE("signing_token");

-- 10. Add signer capture columns
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signer_name" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signer_email" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signature_image_url" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signature_hash" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signer_ip" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signer_user_agent" text;

-- 11. Add lifecycle timestamps
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "viewed_at" timestamp with time zone;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "declined_at" timestamp with time zone;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "decline_reason" text;

-- 12. Add PDF output column
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "pdf_url" text;

-- 13. Add updatedAt
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

-- 14. Add compound indexes
CREATE INDEX IF NOT EXISTS "contracts_org_client_idx" ON "contracts" ("org_id", "client_id");
CREATE INDEX IF NOT EXISTS "contracts_org_project_idx" ON "contracts" ("org_id", "project_id");
CREATE INDEX IF NOT EXISTS "contracts_signing_token_idx" ON "contracts" ("signing_token");

-- 15. Ensure RLS is enabled (already set in schema, belt+suspenders)
ALTER TABLE "contracts" ENABLE ROW LEVEL SECURITY;

-- ── Status forward-only constraint ────────────────────────────────────────────
-- NOTE: Status regression (e.g. signed → sent) is enforced at the tRPC layer.
-- If you want a DB-level guard, add this manually after reviewing your Postgres version:
-- ALTER TABLE "contracts" ADD CONSTRAINT "contracts_status_valid" 
--   CHECK (status IN ('draft','sent','viewed','signed','declined','expired'));
