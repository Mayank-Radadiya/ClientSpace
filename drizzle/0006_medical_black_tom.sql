CREATE TYPE "public"."milestone_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TABLE "project_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_notes_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
ALTER TABLE "project_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "status" "milestone_status" DEFAULT 'todo' NOT NULL;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "priority" "milestone_priority" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "assignee_id" uuid;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "sub_tasks" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_notes_org_project_idx" ON "project_notes" USING btree ("org_id","project_id");--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "milestones_status_idx" ON "milestones" USING btree ("project_id","status");