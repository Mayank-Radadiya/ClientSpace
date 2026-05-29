ALTER TABLE "organizations" ADD COLUMN "logo_mark_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "accent_color_dark" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "brand_name" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "favicon_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "powered_by_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_email_domain" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_email_from_name" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_email_domain_id" text;