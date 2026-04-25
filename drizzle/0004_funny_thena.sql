ALTER TYPE "public"."invitation_status" ADD VALUE 'in_use' BEFORE 'accepted';--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_project_folder_deleted_updated_idx" ON "assets" USING btree ("project_id","folder_id","deleted_at","updated_at");--> statement-breakpoint
CREATE INDEX "projects_org_created_idx" ON "projects" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "projects_org_status_priority_created_idx" ON "projects" USING btree ("org_id","status","priority","created_at");