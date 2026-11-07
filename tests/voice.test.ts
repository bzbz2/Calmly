import { describe, expect, test } from "bun:test";
import { CRISIS_MESSAGE } from "../src/lib/safety";
import { chunkForSpeech, cleanForSpeech, defaultVoiceLang, pickVoice } from "../src/lib/voice";

describe("cleanForSpeech", () => {
  test("drops markdown and bullets, reads links as their domain", () => {
    const out = cleanForSpeech("• **In the US:** call **988**.\n• Find a line at https://findahelpline.com/countries");
    expect(out).toBe("In the US: call 988.\nFind a line at findahelpline.com");
  });
  test("the crisis message stays complete and readable", () => {
    const out = cleanForSpeech(CRISIS_MESSAGE);
    expect(out).toContain("988");
    expect(out).toContain("741741");
    expect(out).not.toContain("**");
  });
});

describe("chunkForSpeech", () => {
  test("splits on sentence ends in English and Chinese", () => {
    expect(chunkForSpeech("Hi there. How are you?", 12)).toEqual(["Hi there.", "How are you?"]);
    expect(chunkForSpeech("你好。今天怎么样？", 6)).toEqual(["你好。", "今天怎么样？"]);
  });
  test("merges tiny neighbours so speech isn't choppy", () => {
    expect(chunkForSpeech("Hi. Ok. Sure.")).toEqual(["Hi. Ok. Sure."]);
  });
  test("no chunk exceeds the limit", () => {
    const long = "This is a very long sentence, with commas, that keeps going and going without any full stop at all ".repeat(6);
    const chunks = chunkForSpeech(long, 80);
    expect(chunks.length).toBeGreaterThan(3);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(80);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(long.trim().replace(/\s+/g, " "));
  });
  test("empty text: nothing to say", () => expect(chunkForSpeech("   ")).toEqual([]));
});

describe("pickVoice", () => {
  const voices = [
    { name: "Alex", lang: "en-US" },
    { name: "Google US English", lang: "en-US" },
    { name: "Daniel", lang: "en-GB" },
    { name: "Mei-Jia", lang: "zh-TW" },
    { name: "Tingting", lang: "zh-CN" },
  ];
  test("prefers exact language and natural-sounding voices", () => {
    expect(pickVoice(voices, "en")?.name).toBe("Google US English");
    expect(pickVoice(voices, "zh")?.name).toBe("Tingting");
  });
  test("falls back to a same-language voice", () => {
    expect(pickVoice([{ name: "Mei-Jia", lang: "zh-TW" }], "zh")?.name).toBe("Mei-Jia");
  });
  test("no matching voice: let the browser choose", () => {
    expect(pickVoice([{ name: "Daniel", lang: "en-GB" }], "zh")).toBeUndefined();
  });
});

describe("defaultVoiceLang", () => {
  test("follows the user's last message, then the browser", () => {
    expect(defaultVoiceLang("zh", "en-US")).toBe("zh");
    expect(defaultVoiceLang(undefined, "zh-CN")).toBe("zh");
    expect(defaultVoiceLang(undefined, "en-GB")).toBe("en");
    expect(defaultVoiceLang(undefined, undefined)).toBe("en");
  });
});
