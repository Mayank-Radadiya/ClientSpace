CREATE TABLE "bounced_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"org_id" uuid,
	"reason" text,
	"bounce_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bounced_emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bounced_emails" ADD CONSTRAINT "bounced_emails_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bounced_emails_email_idx" ON "bounced_emails" USING btree ("email");--> statement-breakpoint
CREATE INDEX "bounced_emails_org_idx" ON "bounced_emails" USING btree ("org_id");