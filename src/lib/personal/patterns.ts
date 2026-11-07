// Notice gentle patterns in the mood history, e.g. "Third tired Monday in a row."
// Used two ways: shown as a soft insight when a new chat starts, and passed to the
// agent's system prompt so Calmly can bring it up (as a question, never a diagnosis).

import { FEELING_SCENES, type Feeling, type Lang } from "../critter/catalog";
import { feelingsByDay, isHeavy, isLight, localDay, type MoodRow } from "./moods";

export type Pattern =
  | { kind: "weekday"; feeling: Feeling; weekday: number; count: number }
  | { kind: "days"; feeling: Feeling | null; count: number } // feeling null = several different heavy feelings
  | { kind: "stress"; recent: number; before: number };

const MIN_STREAK = 3;

/** Patterns in the last ~8 weeks, most notable first. `tzOffset` as in Date#getTimezoneOffset. */
export function findPatterns(rows: MoodRow[], now: Date, tzOffset: number): Pattern[] {
  const byDay = feelingsByDay(rows, tzOffset);
  const today = localDay(now, tzOffset).dayIndex;
  const out: Pattern[] = [];

  // 1. Same feeling on the same weekday, several weeks running (latest one in the past week).
  let bestWeekday: Extract<Pattern, { kind: "weekday" }> | null = null;
  for (let d = today; d > today - 7; d--) {
    const day = byDay.get(d);
    if (!day) continue;
    let count = 1;
    while (byDay.get(d - 7 * count)?.feeling === day.feeling) count++;
    if (count >= MIN_STREAK && (!bestWeekday || count > bestWeekday.count)) {
      bestWeekday = { kind: "weekday", feeling: day.feeling, weekday: day.weekday, count };
    }
  }
  if (bestWeekday) out.push(bestWeekday);

  // 2. Heavy days in a row, ending today or yesterday.
  const start = byDay.has(today) ? today : today - 1;
  const run: Feeling[] = [];
  for (let d = start; byDay.has(d) && isHeavy(byDay.get(d)!.feeling); d--) run.push(byDay.get(d)!.feeling);
  if (run.length >= MIN_STREAK) {
    out.push({ kind: "days", feeling: run.every((f) => f === run[0]) ? run[0] : null, count: run.length });
  }

  // 3. Stress climbing: last 3 days vs the 7 days before.
  const avg = (from: number, to: number) => {
    const xs = rows.filter((r) => {
      const d = localDay(r.createdAt, tzOffset).dayIndex;
      return d > today - to && d <= today - from;
    });
    return xs.length ? xs.reduce((a, r) => a + r.stress, 0) / xs.length : null;
  };
  const recent = avg(0, 3);
  const before = avg(3, 10);
  if (recent !== null && before !== null && recent >= 6 && recent - before >= 2) {
    out.push({ kind: "stress", recent: Math.round(recent * 10) / 10, before: Math.round(before * 10) / 10 });
  }

  return out;
}

const WEEKDAYS: Record<Lang, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
};
const ORDINAL = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth"];

/** A short, warm sentence plus an invitation, in the user's language. */
export function describePattern(p: Pattern, lang: Lang): { text: string; ask: string } {
  if (p.kind === "weekday") {
    const label = FEELING_SCENES[p.feeling].label[lang];
    const day = WEEKDAYS[lang][p.weekday];
    if (lang === "zh") {
      return isLight(p.feeling)
        ? { text: `连续第${p.count}个${day}都很${label}！`, ask: `${day}有什么好事？想多留住一点吗？` }
        : { text: `连续第${p.count}个${day}都觉得${label}了。`, ask: `想一起看看${day}是什么在消耗你吗？` };
    }
    const nth = ORDINAL[p.count] ?? `${p.count}th`;
    return isLight(p.feeling)
      ? { text: `${nth} ${label} ${day} in a row!`, ask: `What's making your ${day}s good? Want to keep more of it?` }
      : { text: `${nth} ${label} ${day} in a row.`, ask: `Want to look at what's draining your ${day}s?` };
  }
  if (p.kind === "days") {
    if (lang === "zh") {
      return p.feeling
        ? { text: `你已经连续${p.count}天觉得${FEELING_SCENES[p.feeling].label.zh}了。`, ask: "想聊聊是什么让它一直持续吗？" }
        : { text: `这${p.count}天你过得都不轻松。`, ask: "想聊聊最压着你的是哪件事吗？" };
    }
    return p.feeling
      ? { text: `You've felt ${FEELING_SCENES[p.feeling].label.en} ${p.count} days in a row.`, ask: "Want to talk about what's keeping it going?" }
      : { text: `It's been ${p.count} heavy days in a row.`, ask: "Want to talk about what's weighing on you most?" };
  }
  return lang === "zh"
    ? { text: "这几天你的压力在上升。", ask: "要不要一起找一件可以先放下的事？" }
    : { text: "Your stress has been climbing the last few days.", ask: "Want to find one thing to take off your plate?" };
}

/** Plain-English summary for the agent's system prompt. */
export function patternsForPrompt(patterns: Pattern[]): string {
  return patterns.map((p) => describePattern(p, "en").text).join(" ");
}
