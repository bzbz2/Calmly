import { describe, expect, test } from "bun:test";
import { FEELINGS } from "../src/lib/critter/catalog";
import { selectMoodAnimation } from "../src/lib/critter/match";
import { dailySeries, describeWeather, innerGaps, moodWeather, segments, weekInsights, WEATHER_MIN_PEOPLE } from "../src/lib/personal/trend";
import { moodChips, welcomeText } from "../src/lib/personal/welcome";

const NOW = new Date("2026-11-07T18:00:00Z"); // a Saturday
const row = (iso: string, score: number, stress: number, label = "tired", triggers: string[] = []) => ({ createdAt: iso, score, stress, label, feeling: null, emotions: [] as string[], triggers });

describe("daily series", () => {
  test("merges a day's check-ins and keeps empty days empty", () => {
    const s = dailySeries([row("2026-11-07T09:00:00Z", 4, 8), row("2026-11-07T15:00:00Z", 6, 6), row("2026-11-04T09:00:00Z", 3, 7)], NOW, 0, 7);
    expect(s.length).toBe(7);
    expect(s[0].key).toBe("2026-11-01");
    expect(s[6]).toMatchObject({ key: "2026-11-07", isToday: true, mood: 5, stress: 7 });
    expect(s[6].entries.length).toBe(2);
    expect(s[5].mood).toBeNull();
    expect(s[3].mood).toBe(3);
  });
  test("uses the local day", () => {
    // 03:00 UTC Nov 7 is still Nov 6 in California.
    const s = dailySeries([row("2026-11-07T03:00:00Z", 5, 5)], NOW, 480, 7);
    expect(s.find((d) => d.mood !== null)?.key).toBe("2026-11-06");
  });
  test("lines never bridge a gap", () => {
    const v = [null, 5, 6, null, null, 4, 3];
    expect(segments(v)).toEqual([[1, 2], [5, 6]]);
    expect(innerGaps(v)).toEqual([[3, 4]]);
    expect(innerGaps([null, 5, null])).toEqual([]); // leading/trailing gaps aren't labelled
  });
});

describe("week insights", () => {
  test("not enough data: a gentle nudge only", () => {
    const i = weekInsights([row("2026-11-07T09:00:00Z", 5, 5)], NOW, 0, "zh");
    expect(i).toEqual([{ id: "more", icon: "🌱", text: "再记录几天，我就能发现你的规律了。" }]);
  });
  test("days, week-over-week mood, stress peak, common triggers", () => {
    const rows = [
      row("2026-10-27T09:00:00Z", 4, 5), row("2026-10-29T09:00:00Z", 4, 5), // last week, avg 4
      row("2026-11-03T09:00:00Z", 6, 4, "ok", ["workload"]), row("2026-11-04T09:00:00Z", 5, 8, "ok", ["workload"]), row("2026-11-07T09:00:00Z", 7, 3),
    ];
    const en = weekInsights(rows, NOW, 0, "en").map((x) => x.text);
    expect(en).toEqual([
      "I've been with you 3 days this week",
      "Average mood this week: 6.0, up 2.0 from last week",
      "Your most stressful day was Wednesday (8/10)",
      "What came up most: workload",
    ]);
    const zh = weekInsights(rows, NOW, 0, "zh").map((x) => x.text);
    expect(zh.slice(0, 3)).toEqual(["本周已陪你 3 天", "本周平均心情 6.0，比上周高 2.0", "压力最高的一天是周三（8/10）"]);
  });
});

describe("mood weather", () => {
  test("hidden below the anonymity threshold", () => {
    const w = moodWeather(Array(WEATHER_MIN_PEOPLE - 1).fill("tired"));
    expect(w.top).toBeNull();
    expect(describeWeather(w, "zh")).toBe("今天来的人还不多，晚点再来看看。");
  });
  test("share of the most common feeling, one vote per person", () => {
    const w = moodWeather(["tired", "tired", "tired", "happy", null, "anxious", "tired", "tired"]);
    expect(w).toEqual({ people: 8, top: { feeling: "tired", percent: 63 } });
    expect(describeWeather(w, "zh")).toBe("今天 63% 的人感到累");
    expect(describeWeather(w, "en")).toBe("Today 63% of people feel tired");
  });
});

describe("first screen", () => {
  test("greeting and placeholder", () => {
    expect(welcomeText("en").title).toBe("How's your day going?");
    expect(welcomeText("en").sub).toBe("Tell me how you feel and see who shows up.");
    expect(welcomeText("en").placeholder).toBe("My calendar is attacking me…");
    expect(welcomeText("zh").title).toBe("今天过得怎么样？");
  });
  test("4 mood chips, each a valid feeling whose text matches it", () => {
    for (const lang of ["en", "zh"] as const) {
      const chips = moodChips(lang);
      expect(chips.map((c) => c.emoji)).toEqual(["😫", "😐", "😊", "😰"]);
      for (const c of chips) {
        expect(FEELINGS).toContain(c.feeling);
        expect(selectMoodAnimation(c.send, { feeling: c.feeling }).feeling).toBe(c.feeling);
      }
    }
    expect(moodChips("zh").map((c) => c.label)).toEqual(["累坏了", "一般", "还不错", "焦虑"]);
  });
});
