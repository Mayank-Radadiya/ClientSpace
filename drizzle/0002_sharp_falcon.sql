CREATE TABLE "plan_limits" (
	"plan" "plan" PRIMARY KEY NOT NULL,
	"max_projects" integer NOT NULL,
	"max_clients" integer NOT NULL,
	"max_storage_gb" integer NOT NULL,
	"max_members" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "auto_approve_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "assets_auto_approve_idx" ON "assets" USING btree ("auto_approve_at");--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "auto_approve_days";