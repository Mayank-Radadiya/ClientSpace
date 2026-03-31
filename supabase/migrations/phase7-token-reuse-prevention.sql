-- ============================================================================
-- ClientSpace — Phase 7: Token Reuse Prevention
-- ============================================================================
-- Goal: prevent same invitation token from being accepted concurrently.
--
-- Changes:
-- 1) Add 'in_use' invitation status
-- 2) Add index to speed lock/update lookups by token_hash/status
-- ============================================================================

-- 1) Add enum value (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'invitation_status'
      AND e.enumlabel = 'in_use'
  ) THEN
    ALTER TYPE invitation_status ADD VALUE 'in_use';
  END IF;
END $$;

-- 2) Optional performance index for token workflows
CREATE INDEX IF NOT EXISTS invitations_token_status_idx
  ON invitations (token_hash, status, expires_at);
