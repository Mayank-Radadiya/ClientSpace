CREATE TABLE "project_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"risk_score" text NOT NULL,
	"summary" text NOT NULL,
	"velocity_trend" text NOT NULL,
	"overdue_count" integer NOT NULL,
	"unresolved_annotations" integer NOT NULL,
	"open_change_requests" integer NOT NULL,
	"milestone_completion_rate" real NOT NULL,
	"raw_metrics" jsonb,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"model_used" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_health" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_health" ADD CONSTRAINT "project_health_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_health" ADD CONSTRAINT "project_health_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ph_project_generated_idx" ON "project_health" USING btree ("project_id","generated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "ph_org_risk_idx" ON "project_health" USING btree ("org_id","risk_score");