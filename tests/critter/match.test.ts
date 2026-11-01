import { describe, expect, test } from "bun:test";
import { matchIntent, selectMoodAnimation, validateMoodText, MAX_MOOD_LENGTH } from "../../src/lib/critter/match";
import { FEELING_SCENES, SITUATION_SCENES } from "../../src/lib/critter/catalog";
import { detectFeeling } from "../../src/lib/critter/match";

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

describe("detectFeeling", () => {
  const cases: [string, string][] = [
    ["I'm so exhausted I can barely think", "tired"],
    ["I feel really down today", "sad"],
    ["I've been crying all morning", "sad"],
    ["not feeling great honestly", "sad"],
    ["I'm so anxious about tomorrow", "anxious"],
    ["Can't stop overthinking everything", "anxious"],
    ["I'm so frustrated with my roommate", "indignant"],
    ["Everything is too much right now", "overwhelmed"],
    ["I feel so lonely lately", "lonely"],
    ["I miss my friends back home", "lonely"],
    ["I'm so happy right now", "happy"],
    ["happy but also really sad", "mixed"],
    ["idk", "mixed"],
  ];
  for (const [input, feeling] of cases) test(input, () => expect(detectFeeling(input).feeling).toBe(feeling as never));
  test("negated happiness is not happy", () => expect(detectFeeling("I'm not happy").feeling).toBe("sad"));
  test("needing space is not loneliness", () => expect(detectFeeling("I need to be alone").feeling).not.toBe("lonely"));
});

describe("selectMoodAnimation mirrors the user's feeling", () => {
  test("situation scene with art plays when it fits the feeling", () => {
    const s = selectMoodAnimation("I'm so done with meetings.");
    expect(s.sceneId).toBe("meeting_fatigue");
    expect(SITUATION_SCENES.meeting_fatigue.captions.en).toContain(s.caption);
  });
  test("situation without art mirrors its feeling, keeps the situation caption", () => {
    const s = selectMoodAnimation("I have too much to do.");
    expect(s.moodIntent).toBe("task_overload");
    expect(s.feeling).toBe("overwhelmed");
    expect(s.sceneId).toBe("feel_overwhelmed");
    expect(s.photoId).toBe("hamster-flat");
    expect(SITUATION_SCENES.task_overload.captions.en).toContain(s.caption);
  });
  test("each spec example mirrors the right feeling", () => {
    expect(selectMoodAnimation("People are exhausting.").sceneId).toBe("feel_tired");
    expect(selectMoodAnimation("Nobody noticed how hard I worked.").sceneId).toBe("feel_wronged");
    expect(selectMoodAnimation("I finally finished that task!").sceneId).toBe("feel_happy");
  });
  test("a conflicting feeling beats the situation scene", () => {
    const s = selectMoodAnimation("Meetings make me so anxious");
    expect(s.moodIntent).toBe("meeting_fatigue");
    expect(s.sceneId).toBe("feel_anxious");
    expect(FEELING_SCENES.anxious.captions.en).toContain(s.caption);
  });
  test("pure feeling with no situation", () => {
    const s = selectMoodAnimation("I feel so lonely lately");
    expect(s.sceneId).toBe("feel_lonely");
    expect(FEELING_SCENES.lonely.captions.en).toContain(s.caption);
  });
  test("vague text mirrors 'mixed', never a comforting response scene", () => {
    expect(selectMoodAnimation("hmm idk").sceneId).toBe("feel_mixed");
  });
  test("captions are in the user's voice (first person), never addressed to them", () => {
    const all = [...Object.values(SITUATION_SCENES).flatMap((x) => x.captions.en), ...Object.values(FEELING_SCENES).flatMap((x) => x.captions.en)];
    for (const c of all) expect(c).not.toMatch(/\byou('re|r)?\b/i);
  });
  test("variant cycles captions", () => {
    const n = SITUATION_SCENES.meeting_fatigue.captions.en.length;
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
