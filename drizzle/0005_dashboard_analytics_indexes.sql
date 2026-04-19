CREATE INDEX IF NOT EXISTS "invoices_org_status_idx"
  ON "invoices" USING btree ("org_id", "status");

CREATE INDEX IF NOT EXISTS "invoices_org_paid_at_idx"
  ON "invoices" USING btree ("org_id", "paid_at")
  WHERE "status" = 'paid';
