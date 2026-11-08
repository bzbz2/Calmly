-- "Forgot password": one-time 6-digit codes sent by email. Only a keyed hash of the
-- code is stored. A code expires 5 minutes after it's sent (expires_at), allows a few
-- wrong tries (attempts), and is marked used once the new password is set (used_at).
-- Additive and idempotent; safe to re-run.
CREATE TABLE IF NOT EXISTS "password_reset_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "reset_email_idx" ON "password_reset_codes" ("email", "created_at");
