ALTER TABLE "invoices" ADD COLUMN "pdf_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "pdf_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX "invoices_pdf_status_idx" ON "invoices" USING btree ("org_id","pdf_status");