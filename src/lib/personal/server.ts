// Server-only data access for personalization (imports the DB).

import { and, desc, eq, gte } from "drizzle-orm";
import { db, messages, moodEntries, profiles } from "@/db";
import { detectLang } from "../critter/match";
import { sanitizePrefs, type AnimalPrefs } from "./animals";
import { feelingOfEntry } from "./moods";
import type { LastMood } from "./checkin";

export async function getAnimalPrefs(userId: string): Promise<AnimalPrefs> {
  const [p] = await db.select({ prefs: profiles.animalPrefs }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return sanitizePrefs(p?.prefs);
}

export async function saveAnimalPrefs(userId: string, prefs: AnimalPrefs) {
  await db
    .insert(profiles)
    .values({ userId, animalPrefs: prefs })
    .onConflictDoUpdate({ target: profiles.userId, set: { animalPrefs: prefs, updatedAt: new Date() } });
}

/** Mood entries for the last `days` days, oldest first, with only the fields the client needs. */
export async function getMoodRows(userId: string, days: number) {
  const rows = await db
    .select({
      createdAt: moodEntries.createdAt,
      feeling: moodEntries.feeling,
      label: moodEntries.label,
      emotions: moodEntries.emotions,
      stress: moodEntries.stress,
      score: moodEntries.score,
      triggers: moodEntries.triggers,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.createdAt, new Date(Date.now() - days * 86_400_000))))
    .orderBy(desc(moodEntries.createdAt))
    .limit(500);
  return rows.reverse();
}

/** The user's most recent mood, for a gentle check-in. Language comes from what they wrote. */
export async function getLastMood(userId: string): Promise<LastMood | null> {
  const [last] = await db
    .select()
    .from(moodEntries)
    .where(eq(moodEntries.userId, userId))
    .orderBy(desc(moodEntries.createdAt))
    .limit(1);
  if (!last) return null;
  const feeling = feelingOfEntry(last);
  if (!feeling) return null;

  let text: string | undefined;
  if (last.messageId) {
    const [m] = await db
      .select({ content: messages.content })
      .from(messages)
      .where(eq(messages.id, last.messageId))
      .limit(1);
    text = m?.content;
  } else if (last.conversationId) {
    const [m] = await db
      .select({ content: messages.content })
      .from(messages)
      .where(and(eq(messages.conversationId, last.conversationId), eq(messages.role, "user")))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    text = m?.content;
  }
  return { feeling, trigger: last.triggers[0] ?? null, createdAt: last.createdAt, lang: text ? detectLang(text) : "en" };
}
