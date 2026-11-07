// "My mood" trend: one point per local day (several check-ins merge into a day),
// empty days stay empty, and a few plain-language insights under the chart.

import { FEELING_SCENES, type Feeling, type Lang } from "../critter/catalog";
import { feelingOfEntry, feelingsByDay, localDay, type MoodRow } from "./moods";

export type TrendRow = MoodRow & { score: number; triggers?: string[] };
export type TrendDay<R extends TrendRow = TrendRow> = {
  key: string; // YYYY-MM-DD, local
  dayIndex: number;
  weekday: number;
  isToday: boolean;
  mood: number | null; // average of the day's check-ins, 1..10
  stress: number | null;
  feeling: Feeling | null; // the day's main feeling
  entries: R[];
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** The last `days` local days, oldest first. Days without check-ins have null values. */
export function dailySeries<R extends TrendRow>(rows: R[], now: Date, tzOffset: number, days: number): TrendDay<R>[] {
  const byDay = new Map<number, R[]>();
  for (const r of rows) {
    const d = localDay(r.createdAt, tzOffset).dayIndex;
    byDay.set(d, [...(byDay.get(d) ?? []), r]);
  }
  const feelings = feelingsByDay(rows, tzOffset);
  const today = localDay(now, tzOffset).dayIndex;
  const out: TrendDay<R>[] = [];
  for (let idx = today - days + 1; idx <= today; idx++) {
    const entries = byDay.get(idx) ?? [];
    const date = new Date(idx * 86_400_000);
    const m = avg(entries.map((e) => e.score));
    const s = avg(entries.map((e) => e.stress));
    out.push({
      key: date.toISOString().slice(0, 10),
      dayIndex: idx,
      weekday: date.getUTCDay(),
      isToday: idx === today,
      mood: m === null ? null : round1(m),
      stress: s === null ? null : round1(s),
      feeling: feelings.get(idx)?.feeling ?? null,
      entries,
    });
  }
  return out;
}

/** Runs of consecutive days with data (for drawing lines that never cross a gap). */
export function segments(values: (number | null)[]): number[][] {
  const out: number[][] = [];
  let cur: number[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push(i);
  });
  if (cur.length) out.push(cur);
  return out;
}

/** Empty runs between two days with data: [firstEmpty, lastEmpty] index pairs. */
export function innerGaps(values: (number | null)[]): [number, number][] {
  const out: [number, number][] = [];
  let lastData = -1;
  values.forEach((v, i) => {
    if (v === null) return;
    if (lastData >= 0 && i - lastData > 1) out.push([lastData + 1, i - 1]);
    lastData = i;
  });
  return out;
}

const WEEKDAY: Record<Lang, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
};

export type Insight = { id: string; icon: string; text: string };

/** Days with check-ins needed (in the last 14) before comparing weeks. */
export const MIN_DAYS_FOR_INSIGHTS = 3;

/**
 * Plain-language insights for the last 7 days vs the 7 before (rolling weeks, local time).
 * With too little data, a single "log a few more days" note.
 */
export function weekInsights(rows: TrendRow[], now: Date, tzOffset: number, lang: Lang): Insight[] {
  const days = dailySeries(rows, now, tzOffset, 14);
  const last = days.slice(0, 7).filter((d) => d.mood !== null);
  const cur = days.slice(7).filter((d) => d.mood !== null);
  const zh = lang === "zh";
  if (last.length + cur.length < MIN_DAYS_FOR_INSIGHTS || !cur.length) {
    return [{ id: "more", icon: "🌱", text: zh ? "再记录几天，我就能发现你的规律了。" : "Log a few more days and I'll start spotting your patterns." }];
  }
  const out: Insight[] = [];
  out.push({ id: "days", icon: "🤝", text: zh ? `本周已陪你 ${cur.length} 天` : `I've been with you ${cur.length} day${cur.length === 1 ? "" : "s"} this week` });

  const a = avg(cur.map((d) => d.mood!))!;
  const b = avg(last.map((d) => d.mood!));
  if (b === null) {
    out.push({ id: "avg", icon: "📈", text: zh ? `本周平均心情 ${a.toFixed(1)}（上周没有记录）` : `Average mood this week: ${a.toFixed(1)} (no entries last week)` });
  } else {
    const delta = round1(a - b);
    const diff = Math.abs(delta).toFixed(1);
    const text =
      Math.abs(delta) < 0.3
        ? zh ? `本周平均心情 ${a.toFixed(1)}，和上周差不多` : `Average mood this week: ${a.toFixed(1)}, about the same as last week`
        : delta > 0
          ? zh ? `本周平均心情 ${a.toFixed(1)}，比上周高 ${diff}` : `Average mood this week: ${a.toFixed(1)}, up ${diff} from last week`
          : zh ? `本周平均心情 ${a.toFixed(1)}，比上周低 ${diff}` : `Average mood this week: ${a.toFixed(1)}, down ${diff} from last week`;
    out.push({ id: "avg", icon: delta >= 0.3 ? "📈" : delta <= -0.3 ? "📉" : "➖", text });
  }

  const peak = [...cur].sort((x, y) => y.stress! - x.stress! || y.dayIndex - x.dayIndex)[0];
  if (peak && peak.stress! >= 5) {
    const day = peak.isToday ? (zh ? "今天" : "today") : WEEKDAY[lang][peak.weekday];
    out.push({ id: "stress", icon: "🌡️", text: zh ? `压力最高的一天是${day}（${Math.round(peak.stress!)}/10）` : `Your most stressful day was ${day} (${Math.round(peak.stress!)}/10)` });
  } else {
    out.push({ id: "stress", icon: "🌿", text: zh ? "这周压力都不高，真好。" : "Stress stayed low all week. Nice." });
  }

  const counts = new Map<string, number>();
  for (const d of cur) for (const e of d.entries) for (const t of e.triggers ?? []) counts.set(t.toLowerCase(), (counts.get(t.toLowerCase()) ?? 0) + 1);
  const top = [...counts.entries()].filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([t]) => t);
  if (top.length) out.push({ id: "triggers", icon: "💬", text: zh ? `最常提到：${top.join("、")}` : `What came up most: ${top.join(", ")}` });
  return out;
}

/** Feeling label for one check-in, in the page language (falls back to the raw label). */
export function entryLabel(r: MoodRow, lang: Lang): string {
  const f = feelingOfEntry(r);
  return f ? FEELING_SCENES[f].label[lang] : r.label;
}

// ---------------- anonymous mood weather ----------------

/** Fewer people than this today: show nothing about them (k-anonymity). */
export const WEATHER_MIN_PEOPLE = 5;

export type Weather = { people: number; top: { feeling: Feeling; percent: number } | null };

/**
 * Aggregate mood weather from each person's latest feeling today (one vote per person).
 * Returns only counts; below WEATHER_MIN_PEOPLE nothing about feelings is returned.
 */
export function moodWeather(latestPerPerson: (Feeling | null)[]): Weather {
  const people = latestPerPerson.length;
  if (people < WEATHER_MIN_PEOPLE) return { people, top: null };
  const counts = new Map<Feeling, number>();
  for (const f of latestPerPerson) if (f) counts.set(f, (counts.get(f) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best) return { people, top: null };
  return { people, top: { feeling: best[0], percent: Math.round((best[1] / people) * 100) } };
}

export function describeWeather(w: Weather, lang: Lang): string {
  if (!w.top) return lang === "zh" ? "今天来的人还不多，晚点再来看看。" : "Not enough people yet today. Check back later.";
  const label = FEELING_SCENES[w.top.feeling].label[lang];
  return lang === "zh" ? `今天 ${w.top.percent}% 的人感到${label}` : `Today ${w.top.percent}% of people feel ${label}`;
}
