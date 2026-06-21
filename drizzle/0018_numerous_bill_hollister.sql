ALTER TYPE "public"."auth_event" ADD VALUE 'signup' BEFORE 'password_change';--> statement-breakpoint
ALTER TYPE "public"."auth_event" ADD VALUE 'mfa_enrollment' BEFORE 'role_change';--> statement-breakpoint
ALTER TYPE "public"."auth_event" ADD VALUE 'mfa_verification' BEFORE 'role_change';