ALTER TABLE "comments"
ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comments_parent_id_comments_id_fk'
  ) THEN
    ALTER TABLE "comments"
      ADD CONSTRAINT "comments_parent_id_comments_id_fk"
      FOREIGN KEY ("parent_id")
      REFERENCES "comments"("id")
      ON DELETE SET NULL;
  END IF;
END $$;
