CREATE TYPE "public"."contract_status" AS ENUM('draft', 'sent', 'viewed', 'signed', 'declined', 'expired');--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_signer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."contract_status";--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "status" SET DATA TYPE "public"."contract_status" USING "status"::"public"."contract_status";--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "client_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "body_html" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "body_plain_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signing_token" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signing_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signer_name" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signer_email" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signature_image_url" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signature_hash" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signer_ip" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signer_user_agent" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "declined_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "decline_reason" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contracts_org_client_idx" ON "contracts" USING btree ("org_id","client_id");--> statement-breakpoint
CREATE INDEX "contracts_org_project_idx" ON "contracts" USING btree ("org_id","project_id");--> statement-breakpoint
CREATE INDEX "contracts_signing_token_idx" ON "contracts" USING btree ("signing_token");--> statement-breakpoint
ALTER TABLE "contracts" DROP COLUMN "signer_id";--> statement-breakpoint
ALTER TABLE "contracts" DROP COLUMN "ip_address";--> statement-breakpoint
ALTER TABLE "contracts" DROP COLUMN "document_url";--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_signing_token_unique" UNIQUE("signing_token");