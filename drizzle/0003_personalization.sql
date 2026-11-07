-- Personalization: LLM-picked feelings, user corrections, favourite animals.
-- Additive and idempotent; safe to re-run.

-- Feeling the LLM picked for a user message (one of the 29 feelings, or 'none'
-- when the message has no clear feeling). NULL = not analysed (older messages).
-- A user correction overwrites it.
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "feeling" text;

ALTER TABLE "mood_entries" ADD COLUMN IF NOT EXISTS "feeling" text;
ALTER TABLE "mood_entries" ADD COLUMN IF NOT EXISTS "message_id" uuid REFERENCES "messages"("id") ON DELETE SET NULL;

-- Favourite animals learned from "Another photo": { "capybara": 3, "cat": -1, ... }
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "animal_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL;

-- When users correct the buddy's feeling. Shows where matching gets it wrong.
CREATE TABLE IF NOT EXISTS "feeling_corrections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "message_id" uuid NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "matcher_feeling" text,
  "llm_feeling" text,
  "corrected_feeling" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "corr_user_idx" ON "feeling_corrections" ("user_id","created_at");
