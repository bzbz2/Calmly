import { describe, expect, test } from "bun:test";
import { FEELINGS } from "../src/lib/critter/catalog";
import { selectMoodAnimation } from "../src/lib/critter/match";
import { FEELING_PHOTOS, PHOTOS, type PhotoId } from "../src/lib/critter/photos";
import { sessionMood } from "../src/lib/critter/session";
import { animalOf, favouriteAnimal, preferredPhoto, sanitizePrefs, updatePrefs } from "../src/lib/personal/animals";
import { buildCheckIn } from "../src/lib/personal/checkin";
import { diaryDays } from "../src/lib/personal/diary";
import { feelingOfEntry, localDay } from "../src/lib/personal/moods";
import { describePattern, findPatterns, patternsForPrompt } from "../src/lib/personal/patterns";
import { quickReplies } from "../src/lib/personal/quickReplies";
import { shareFileName, wrapLines } from "../src/lib/personal/share";

const NOW = new Date("2026-11-09T15:00:00Z"); // a Monday
const at = (iso: string, feeling: string | null, stress = 5, label = feeling ?? "okay") => ({ createdAt: iso, feeling, stress, label, emotions: [] as string[] });

describe("LLM feeling drives the buddy", () => {
  test("selectMoodAnimation accepts a feeling override", () => {
    const s = selectMoodAnimation("today was a lot", { feeling: "overwhelmed" });
    expect(s.feeling).toBe("overwhelmed");
    expect(s.sceneId).toBe("feel_overwhelmed");
  });
  test("override keeps the situation story when it fits", () => {
    const s = selectMoodAnimation("I'm so done with meetings.", { feeling: "tired" });
    expect(s.sceneId).toBe("meeting_fatigue");
  });
  test("sessionMood prefers the stored feeling over keywords", () => {
    const m = sessionMood([{ role: "user", content: "I guess it's fine, whatever", feeling: "dejected" }])!;
    expect(m.selection.feeling).toBe("dejected");
    expect(m.source).toBe("llm");
  });
  test("'none' marks a neutral message even if keywords fire", () => {
    const m = sessionMood([
      { role: "user", content: "I'm so exhausted", feeling: "tired" },
      { role: "assistant", content: "…" },
      { role: "user", content: "so happy to ask: what next?", feeling: "none" },
    ])!;
    expect(m.selection.feeling).toBe("tired");
  });
  test("unanalysed messages (no feeling yet) fall back to keywords", () => {
    const m = sessionMood([{ role: "user", content: "I'm so anxious about tomorrow" }])!;
    expect(m.source).toBe("keywords");
    expect(m.selection.feeling).toBe("anxious");
  });
  test("invalid stored feelings are ignored", () => {
    expect(sessionMood([{ role: "user", content: "I'm so exhausted", feeling: "hungry" }])!.selection.feeling).toBe("tired");
  });
});

describe("favourite animals", () => {
  test("animalOf groups breeds", () => {
    expect(animalOf("shiba-smile")).toBe("dog");
    expect(animalOf("persian-frown")).toBe("cat");
    expect(animalOf("capybara-front")).toBe("capybara");
    expect(animalOf("redpanda-curious")).toBe("red panda");
    expect(animalOf("panda-cub")).toBe("panda");
  });
  test("settling counts more than skipping, scores are clamped", () => {
    let p = updatePrefs({}, { photoId: "capybara-front", action: "settle" });
    p = updatePrefs(p, { photoId: "kitten-yawn", action: "skip" });
    expect(p).toEqual({ capybara: 2, cat: -1 });
    for (let i = 0; i < 20; i++) p = updatePrefs(p, { photoId: "capybara-front", action: "settle" });
    expect(p.capybara).toBe(10);
  });
  test("preferredPhoto starts each feeling with the favourite animal", () => {
    expect(preferredPhoto("tired", undefined)).toBe(FEELING_PHOTOS.tired[0]);
    expect(preferredPhoto("tired", { cat: 3 })).toBe("kitten-yawn");
    expect(preferredPhoto("relaxed", { capybara: 1 })).toBe("capybara-tray");
    expect(preferredPhoto("tired", { koala: -5, dog: 1 })).toBe("dog-nap");
  });
  test("every feeling has a valid preferred photo", () => {
    for (const f of FEELINGS) expect(PHOTOS[preferredPhoto(f, { cat: 5, dog: -2 })]).toBeDefined();
  });
  test("sanitizePrefs drops junk", () => {
    expect(sanitizePrefs({ cat: 3, unicorn: 9, dog: "x", capybara: 99 })).toEqual({ cat: 3, capybara: 10 });
    expect(sanitizePrefs(null)).toEqual({});
  });
  test("favouriteAnimal needs a clear lead", () => {
    expect(favouriteAnimal({ cat: 2 })).toBeNull();
    expect(favouriteAnimal({ cat: 2, capybara: 6 })).toBe("capybara");
  });
});

describe("mood history helpers", () => {
  test("feelingOfEntry uses the stored feeling, else the label", () => {
    expect(feelingOfEntry(at("2026-11-09T10:00:00Z", "wronged"))).toBe("wronged");
    expect(feelingOfEntry({ ...at("2026-11-09T10:00:00Z", null), label: "exhausted" })).toBe("tired");
    expect(feelingOfEntry({ ...at("2026-11-09T10:00:00Z", null), label: "okay" })).toBeNull();
  });
  test("localDay respects the user's time zone", () => {
    // 2026-11-09 03:00 UTC is still Sunday evening in California (UTC-8).
    expect(localDay("2026-11-09T03:00:00Z", 480).weekday).toBe(0);
    expect(localDay("2026-11-09T03:00:00Z", 0).weekday).toBe(1);
  });
});

describe("patterns", () => {
  test("third tired Monday in a row", () => {
    const rows = [at("2026-10-26T09:00:00Z", "tired"), at("2026-11-02T09:00:00Z", "tired"), at("2026-11-09T09:00:00Z", "tired")];
    const [p] = findPatterns(rows, NOW, 0);
    expect(p).toEqual({ kind: "weekday", feeling: "tired", weekday: 1, count: 3 });
    expect(describePattern(p, "en")).toEqual({ text: "Third tired Monday in a row.", ask: "Want to look at what's draining your Mondays?" });
    expect(describePattern(p, "zh").text).toBe("连续第3个周一都觉得累了。");
  });
  test("two weeks isn't a pattern yet", () => {
    expect(findPatterns([at("2026-11-02T09:00:00Z", "tired"), at("2026-11-09T09:00:00Z", "tired")], NOW, 0)).toEqual([]);
  });
  test("heavy days in a row", () => {
    const same = findPatterns([at("2026-11-07T09:00:00Z", "sad"), at("2026-11-08T09:00:00Z", "sad"), at("2026-11-09T09:00:00Z", "sad")], NOW, 0);
    expect(same).toContainEqual({ kind: "days", feeling: "sad", count: 3 });
    const mixed = findPatterns([at("2026-11-07T09:00:00Z", "sad"), at("2026-11-08T09:00:00Z", "anxious"), at("2026-11-09T09:00:00Z", "tired")], NOW, 0);
    expect(mixed).toContainEqual({ kind: "days", feeling: null, count: 3 });
    expect(describePattern({ kind: "days", feeling: null, count: 3 }, "en").text).toBe("It's been 3 heavy days in a row.");
  });
  test("light days don't count as a heavy streak", () => {
    const rows = [at("2026-11-07T09:00:00Z", "happy"), at("2026-11-08T09:00:00Z", "happy"), at("2026-11-09T09:00:00Z", "happy")];
    expect(findPatterns(rows, NOW, 0).some((p) => p.kind === "days")).toBe(false);
  });
  test("stress climbing", () => {
    // Calm-ish stress (3) Nov 1-7, then 8 on Nov 8-9.
    const rows = [1, 2, 3, 4, 5, 6, 7].map((d) => at(`2026-11-0${d}T09:00:00Z`, null, 3));
    rows.push(at("2026-11-08T09:00:00Z", null, 8), at("2026-11-09T09:00:00Z", null, 8));
    const p = findPatterns(rows, NOW, 0).find((x) => x.kind === "stress");
    expect(p).toBeDefined();
    expect(patternsForPrompt([p!])).toBe("Your stress has been climbing the last few days.");
  });
});

describe("gentle check-in", () => {
  const last = { feeling: "wronged" as const, trigger: "manager", createdAt: "2026-11-08T15:00:00Z", lang: "en" as const };
  test("heavy last mood a day ago: check in", () => {
    const c = buildCheckIn(last, NOW)!;
    expect(c.text).toBe("Last time you felt wronged about manager. How did it go?");
    expect(c.chips.map((x) => x.label)).toEqual(["Better now", "Still rough", "Something else"]);
    expect(c.chips[0].send).toContain("wronged");
  });
  test("Chinese check-in skips an English trigger", () => {
    expect(buildCheckIn({ ...last, lang: "zh" }, NOW)!.text).toBe("上次你觉得委屈。后来怎么样了？");
    expect(buildCheckIn({ ...last, lang: "zh", trigger: "加班" }, NOW)!.text).toBe("上次你觉得委屈，因为加班。后来怎么样了？");
  });
  test("no check-in for light moods, very recent chats, or old ones", () => {
    expect(buildCheckIn({ ...last, feeling: "happy" }, NOW)).toBeNull();
    expect(buildCheckIn({ ...last, createdAt: "2026-11-09T14:00:00Z" }, NOW)).toBeNull();
    expect(buildCheckIn({ ...last, createdAt: "2026-10-20T14:00:00Z" }, NOW)).toBeNull();
    expect(buildCheckIn(null, NOW)).toBeNull();
  });
});

describe("quick replies", () => {
  test("matched to the feeling, in the user's language", () => {
    expect(quickReplies("anxious", "en")[0].label).toBe("🫁 Breathe with me");
    expect(quickReplies("wronged", "en")[0].label).toBe("🗣️ Help me say it");
    expect(quickReplies("tired", "en")[0].label).toBe("🔋 Tiny reset");
    expect(quickReplies("wronged", "zh")[0].send).toContain("组织");
  });
  test("every feeling has 1-3 replies with text to send", () => {
    for (const f of FEELINGS) {
      const r = quickReplies(f, "en");
      expect(r.length).toBeGreaterThan(0);
      expect(r.length).toBeLessThanOrEqual(3);
      for (const x of r) expect(x.send.length).toBeGreaterThan(5);
    }
  });
});

describe("weekly photo diary", () => {
  test("7 days, oldest first, one feeling per day", () => {
    const rows = [at("2026-11-03T09:00:00Z", "tired"), at("2026-11-09T08:00:00Z", "sad"), at("2026-11-09T12:00:00Z", "happy"), at("2026-11-09T13:00:00Z", "happy")];
    const d = diaryDays(rows, NOW, 0);
    expect(d.length).toBe(7);
    expect(d[0].key).toBe("2026-11-03");
    expect(d[0].feeling).toBe("tired");
    expect(d[6]).toMatchObject({ key: "2026-11-09", isToday: true, feeling: "happy", entries: 3 });
    expect(d[3].feeling).toBeNull();
  });
});

describe("share card", () => {
  const measure = (s: string) => s.length * 10;
  test("wraps Latin text at spaces", () => {
    expect(wrapLines("Just one more thing said everyone", 130, measure)).toEqual(["Just one more", "thing said", "everyone"]);
  });
  test("wraps CJK between characters", () => {
    expect(wrapLines("明明不是我的错却要我来扛", 50, measure)).toEqual(["明明不是我", "的错却要我", "来扛"]);
  });
  test("truncates to max lines with an ellipsis", () => {
    const l = wrapLines("a b c d e f g h", 10, measure, 2);
    expect(l.length).toBe(2);
    expect(l[1].endsWith("…")).toBe(true);
  });
  test("file name has no user text", () => {
    expect(shareFileName("on_edge", NOW)).toBe("calmly-on_edge-2026-11-09.png");
  });
});

// Keep the photo set and the animal mapping in sync.
test("every photo maps to a known animal", () => {
  for (const id of Object.keys(PHOTOS) as PhotoId[]) expect(animalOf(id).length).toBeGreaterThan(0);
});
