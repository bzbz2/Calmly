// Shared helpers for reading the mood history (mood_entries) in the user's local time.

import { detectFeeling } from "../critter/match";
import { HEAVY_FEELINGS, LIGHT_FEELINGS, isFeeling, type Feeling } from "../critter/catalog";

export type MoodRow = {
  createdAt: string | Date;
  feeling?: string | null;
  label: string;
  emotions?: string[];
  stress: number;
  score?: number;
  triggers?: string[];
};

/** Feeling of a mood entry: the stored (LLM or corrected) feeling, else matched from its label. */
export function feelingOfEntry(r: MoodRow): Feeling | null {
  if (isFeeling(r.feeling)) return r.feeling;
  const guess = detectFeeling(`I feel ${r.label} ${(r.emotions ?? []).join(" ")}`).feeling;
  return guess === "mixed" ? null : guess;
}

/**
 * Local calendar day for a timestamp. `tzOffset` is Date#getTimezoneOffset() in
 * minutes (UTC minus local, e.g. 480 for PST), so server code can bucket days in
 * the user's time zone.
 */
export function localDay(t: string | Date, tzOffset: number): { key: string; weekday: number; dayIndex: number } {
  const ms = new Date(t).getTime() - tzOffset * 60_000;
  const d = new Date(ms);
  const key = d.toISOString().slice(0, 10);
  return { key, weekday: d.getUTCDay(), dayIndex: Math.floor(ms / 86_400_000) };
}

/** Dominant feeling per local day: most frequent; ties go to the later entry. */
export function feelingsByDay(rows: MoodRow[], tzOffset: number): Map<number, { feeling: Feeling; count: number; key: string; weekday: number }> {
  const days = new Map<number, { counts: Map<Feeling, { n: number; last: number }>; key: string; weekday: number }>();
  rows.forEach((r, order) => {
    const f = feelingOfEntry(r);
    if (!f) return;
    const d = localDay(r.createdAt, tzOffset);
    const day = days.get(d.dayIndex) ?? { counts: new Map(), key: d.key, weekday: d.weekday };
    const c = day.counts.get(f) ?? { n: 0, last: 0 };
    day.counts.set(f, { n: c.n + 1, last: order });
    days.set(d.dayIndex, day);
  });
  const out = new Map<number, { feeling: Feeling; count: number; key: string; weekday: number }>();
  for (const [idx, day] of days) {
    const [feeling, c] = [...day.counts.entries()].sort((a, b) => b[1].n - a[1].n || b[1].last - a[1].last)[0];
    out.set(idx, { feeling, count: c.n, key: day.key, weekday: day.weekday });
  }
  return out;
}

export const isHeavy = (f: Feeling) => HEAVY_FEELINGS.includes(f);
export const isLight = (f: Feeling) => LIGHT_FEELINGS.includes(f);
