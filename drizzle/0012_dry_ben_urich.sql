ALTER TABLE "comments" ADD COLUMN "resolved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "comments_asset_resolved_idx" ON "comments" USING btree ("asset_id","resolved");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");