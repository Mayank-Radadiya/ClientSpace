DROP INDEX "assets_auto_approve_idx";--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "auto_approve_days" integer;--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "auto_approve_at";