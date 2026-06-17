CREATE TYPE "public"."auth_event" AS ENUM(
  'login_success',
  'login_failure',
  'logout',
  'password_change',
  'password_reset_request',
  'password_reset_complete',
  'role_change',
  'invite_accepted',
  'account_locked',
  'oauth_login',
  'contract_signed'
);

CREATE TABLE "auth_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "org_id" uuid,
  "event" "auth_event" NOT NULL,
  "ip" text,
  "user_agent" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "auth_events_user_idx" ON "auth_events" ("user_id");
CREATE INDEX "auth_events_org_idx" ON "auth_events" ("org_id");
CREATE INDEX "auth_events_created_idx" ON "auth_events" ("created_at");

ALTER TABLE "auth_events" ENABLE ROW LEVEL SECURITY;
