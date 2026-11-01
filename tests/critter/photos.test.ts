import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FEELINGS, FEELING_SCENES, SITUATION_SCENES } from "../../src/lib/critter/catalog";
import { FEELING_PHOTOS, PHOTOS, defaultPhoto, needsCredit, nextPhoto, type PhotoId } from "../../src/lib/critter/photos";
import { selectMoodAnimation } from "../../src/lib/critter/match";

const ids = Object.keys(PHOTOS) as PhotoId[];

describe("photos", () => {
  test("every feeling has at least one photo", () => {
    for (const f of FEELINGS) expect(FEELING_PHOTOS[f].length).toBeGreaterThan(0);
  });
  test("every photo has a self-hosted file", () => {
    for (const id of ids) expect(existsSync(join(import.meta.dir, "../../public/critters", `${id}.jpg`))).toBe(true);
  });
  test("every photo has alt text and a Commons source", () => {
    for (const id of ids) {
      expect(PHOTOS[id].alt.length).toBeGreaterThan(5);
      expect(PHOTOS[id].source).toStartWith("https://commons.wikimedia.org/");
    }
  });
  test("CC BY / BY-SA photos carry an author and license link", () => {
    for (const id of ids) {
      const p = PHOTOS[id];
      if (!needsCredit(p)) continue;
      expect(p.author.length).toBeGreaterThan(0);
      expect(p.licenseUrl).toStartWith("https://creativecommons.org/");
    }
  });
  test("every photo is used by at least one feeling", () => {
    const used = new Set(Object.values(FEELING_PHOTOS).flat());
    for (const id of ids) expect(used.has(id)).toBe(true);
  });
  test("calm defaults to a capybara", () => expect(defaultPhoto("calm")).toStartWith("capybara"));
  test("only open licenses", () => {
    for (const id of ids) expect(PHOTOS[id].license).toMatch(/^(CC0|CC BY(-SA)? \d\.\d|Public domain)/i);
  });
  test("nextPhoto cycles within the feeling and wraps", () => {
    for (const f of FEELINGS) {
      const list = FEELING_PHOTOS[f];
      let p = defaultPhoto(f);
      const seen = new Set<string>();
      for (let i = 0; i < list.length; i++) {
        seen.add(p);
        p = nextPhoto(f, p);
      }
      expect(seen.size).toBe(list.length);
      expect(p).toBe(defaultPhoto(f));
    }
  });
});

describe("feeling scenes", () => {
  test("every feeling has labels and 3+ captions in both languages", () => {
    for (const f of FEELINGS) {
      const s = FEELING_SCENES[f];
      expect(s.label.en.length).toBeGreaterThan(0);
      expect(s.label.zh.length).toBeGreaterThan(0);
      expect(s.captions.en.length).toBeGreaterThanOrEqual(3);
      expect(s.captions.zh.length).toBeGreaterThanOrEqual(3);
      expect(s.durationMs).toBeLessThanOrEqual(2400);
    }
  });
  test("situations have captions in both languages", () => {
    for (const s of Object.values(SITUATION_SCENES)) {
      expect(s.captions.en.length).toBeGreaterThan(0);
      expect(s.captions.zh.length).toBeGreaterThan(0);
    }
  });
});

describe("selection carries the feeling's photo", () => {
  const cases: [string, PhotoId][] = [
    ["I'm so exhausted", "koala-yawn"],
    ["I'm so relaxed on my day off", "capybara-tray"],
    ["I'm so jealous of her", "tabby-sideeye"],
    ["我今天好开心", "samoyed-smile"],
  ];
  for (const [text, id] of cases) test(`${text} -> ${id}`, () => expect(selectMoodAnimation(text).photoId).toBe(id));
  test("alt text comes from the photo", () => {
    const s = selectMoodAnimation("I'm so exhausted");
    expect(s.alt).toBe(PHOTOS[s.photoId].alt);
  });
});
