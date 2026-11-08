-- Guest mode: a first-time visitor chats straight away on a guest account (no email,
-- no password). Signing up later upgrades or merges it.
-- Additive and idempotent; safe to re-run.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_guest" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ip_hash" text;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "users_guest_ip_idx" ON "users" ("ip_hash", "created_at") WHERE "is_guest";
CREATE INDEX IF NOT EXISTS "msg_user_idx" ON "messages" ("user_id", "created_at");
