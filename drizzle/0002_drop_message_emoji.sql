-- Reverts 0001: the animated-emoji feature was replaced by critter animations,
-- which store nothing in the database.
ALTER TABLE "messages" DROP COLUMN IF EXISTS "emoji";
ALTER TABLE "messages" DROP COLUMN IF EXISTS "motion";
