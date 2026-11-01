import { describe, expect, test } from "bun:test";
import { matchIntent, selectMoodAnimation, validateMoodText, MAX_MOOD_LENGTH } from "../../src/lib/critter/match";
import { SCENES } from "../../src/lib/critter/catalog";

describe("spec examples map to their scenes", () => {
  const cases: [string, string][] = [
    ["I'm so done with meetings.", "meeting_fatigue"],
    ["I have too much to do.", "task_overload"],
    ["People are exhausting.", "social_battery"],
    ["Nobody noticed how hard I worked.", "unseen_effort"],
    ["I finally finished that task!", "tiny_victory"],
  ];
  for (const [input, intent] of cases) test(input, () => expect(matchIntent(input).intent).toBe(intent as never));
});

describe("paraphrases", () => {
  const cases: [string, string][] = [
    ["Another meeting that could have been an email", "meeting_fatigue"],
    ["Back to back calls all day, send help", "meeting_fatigue"],
    ["My calendar is just wall to wall syncs", "meeting_fatigue"],
    ["I'm drowning in work", "task_overload"],
    ["So much on my plate right now", "task_overload"],
    ["My to-do list is endless", "task_overload"],
    ["I need to be alone after that party", "social_battery"],
    ["Small talk drains me", "social_battery"],
    ["My social battery is dead", "social_battery"],
    ["No one appreciates my work", "unseen_effort"],
    ["My boss took credit for my project", "unseen_effort"],
    ["I feel so invisible at work", "unseen_effort"],
    ["So proud of myself today", "tiny_victory"],
    ["I did it! Passed my exam", "tiny_victory"],
    ["Got promoted!!", "tiny_victory"],
  ];
  for (const [input, intent] of cases) test(input, () => expect(matchIntent(input).intent).toBe(intent as never));
});

describe("safe general fallback", () => {
  for (const input of ["hmm idk", "The weather is weird today", "I feel something", "blah"]) {
    test(`vague: ${input}`, () => expect(matchIntent(input).intent).toBe("general"));
  }
  test("negation is respected", () => {
    expect(matchIntent("I'm not overwhelmed at all, just bored").intent).toBe("general");
    expect(matchIntent("I'm not proud of this").intent).toBe("general");
  });
  test("won't is not 'won'", () => {
    expect(matchIntent("I won't be home tonight").intent).toBe("general");
  });
  test("ambiguous ties fall back to general", () => {
    expect(matchIntent("too many meetings and too much to do").intent).toBe("general");
  });
});

describe("selectMoodAnimation", () => {
  test("enabled scene renders its own art", () => {
    const s = selectMoodAnimation("I'm so done with meetings.");
    expect(s.sceneId).toBe("meeting_fatigue");
    expect(s.comingSoon).toBe(false);
    expect(SCENES.meeting_fatigue.captions).toContain(s.caption);
  });
  test("disabled scene falls back to general art but keeps the matched intent and caption", () => {
    const s = selectMoodAnimation("I have too much to do.");
    expect(s.moodIntent).toBe("task_overload");
    expect(s.sceneId).toBe("general");
    expect(s.comingSoon).toBe(true);
    expect(s.alt).toBe(SCENES.general.alt); // alt describes what is actually shown
    expect(SCENES.task_overload.captions).toContain(s.caption);
  });
  test("variant cycles captions", () => {
    const n = SCENES.meeting_fatigue.captions.length;
    const a = selectMoodAnimation("meetings", { variant: 0 });
    const b = selectMoodAnimation("meetings", { variant: 1 });
    const c = selectMoodAnimation("meetings", { variant: n });
    expect(a.caption).not.toBe(b.caption);
    expect(c.caption).toBe(a.caption);
    expect(selectMoodAnimation("meetings", { variant: -3 }).variant).toBeGreaterThanOrEqual(0);
  });
});

describe("validateMoodText", () => {
  test("rejects empty / whitespace / non-string", () => {
    expect(validateMoodText("").ok).toBe(false);
    expect(validateMoodText("   ").ok).toBe(false);
    expect(validateMoodText(42).ok).toBe(false);
    expect(validateMoodText(undefined).ok).toBe(false);
  });
  test("enforces length limit", () => {
    expect(validateMoodText("a".repeat(MAX_MOOD_LENGTH)).ok).toBe(true);
    expect(validateMoodText("a".repeat(MAX_MOOD_LENGTH + 1)).ok).toBe(false);
  });
  test("trims", () => {
    const r = validateMoodText("  hi  ");
    expect(r.ok && r.text).toBe("hi");
  });
});
