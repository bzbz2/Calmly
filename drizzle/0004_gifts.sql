-- "Send a buddy": a friend gets a link with a short message and a matching animal.
-- Additive and idempotent; safe to re-run.

CREATE TABLE IF NOT EXISTS "gifts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  -- Opaque, unguessable link id (/g/<token>); never the row id.
  "token" text NOT NULL UNIQUE,
  "sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  -- Display name shown to the friend, copied at send time (no email, no user id).
  "sender_name" text NOT NULL,
  "to_name" text,
  "phrase" text NOT NULL,
  "message" text NOT NULL,
  "photo_id" text NOT NULL,
  "lang" text NOT NULL,
  -- Set when this gift answers another one ("send one back").
  "reply_to" uuid REFERENCES "gifts"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "opened_at" timestamp
);

CREATE INDEX IF NOT EXISTS "gift_sender_idx" ON "gifts" ("sender_id", "created_at");
