// Weekly photo diary: one buddy per day for the last 7 days (in the user's time zone).

import type { Feeling } from "../critter/catalog";
import { feelingsByDay, localDay, type MoodRow } from "./moods";

export type DiaryDay = { key: string; weekday: number; isToday: boolean; feeling: Feeling | null; entries: number };

export function diaryDays(rows: MoodRow[], now: Date, tzOffset: number, days = 7): DiaryDay[] {
  const byDay = feelingsByDay(rows, tzOffset);
  const counts = new Map<number, number>();
  for (const r of rows) {
    const d = localDay(r.createdAt, tzOffset).dayIndex;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const today = localDay(now, tzOffset);
  const out: DiaryDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const idx = today.dayIndex - i;
    const date = new Date(idx * 86_400_000);
    out.push({
      key: date.toISOString().slice(0, 10),
      weekday: date.getUTCDay(),
      isToday: i === 0,
      feeling: byDay.get(idx)?.feeling ?? null,
      entries: counts.get(idx) ?? 0,
    });
  }
  return out;
}
