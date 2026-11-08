import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SCENE_ART } from "../src/components/story/registry";
import { isSceneId, SCENE_IDS, sceneById, STORY_SCENES } from "../src/lib/story/scenes";
import { blink, frameAt, hideBetween, sample, shake, showBetween, transformOf, type Track } from "../src/lib/story/timeline";

describe("timeline", () => {
  const track: Track = { keys: [{ at: 100, x: 0, o: 1 }, { at: 200, x: 10, ease: "linear" }, { at: 300, y: 5, ease: "linear" }] };

  test("clamps before the first and after the last key", () => {
    expect(sample(track, 0).x).toBe(0);
    expect(sample(track, 999)).toMatchObject({ x: 10, y: 5 });
  });

  test("interpolates and carries missing fields forward", () => {
    expect(sample(track, 150).x).toBeCloseTo(5);
    expect(sample(track, 250)).toMatchObject({ x: 10, y: 2.5 });
    expect(sample(track, 250).sx).toBe(1);
  });

  test("keys are sorted by time", () => {
    const t: Track = { keys: [{ at: 200, x: 10, ease: "linear" }, { at: 0, x: 0 }] };
    expect(sample(t, 100).x).toBeCloseTo(5);
  });

  test("step easing holds until the key", () => {
    const t: Track = { keys: showBetween(500, 800) };
    expect(sample(t, 0).o).toBe(0);
    expect(sample(t, 499).o).toBe(0);
    expect(sample(t, 500).o).toBe(1);
    expect(sample(t, 700).o).toBe(1);
    expect(sample(t, 800).o).toBe(0);
    expect(sample({ keys: hideBetween(500) }, 600).o).toBe(0);
    expect(sample({ keys: hideBetween(500) }, 100).o).toBe(1);
  });

  test("blink closes then reopens", () => {
    const t: Track = { keys: blink(100, 200) };
    expect(sample(t, 190).sy).toBeCloseTo(0.08);
    expect(sample(t, 300).sy).toBe(1);
  });

  test("shake returns to rest", () => {
    const k = shake(0, 500, 4, 4);
    expect(k[0].x).toBe(0);
    expect(k.at(-1)).toMatchObject({ at: 500, x: 0 });
    expect(k.length).toBe(6);
  });

  test("transform pivots around the origin", () => {
    expect(transformOf({ x: 1, y: 2, rot: 90, sx: 1, sy: 1, o: 1 }, [10, 20])).toBe("translate(11 22) rotate(90) scale(1 1) translate(-10 -20)");
  });

  test("frameAt clamps opacity", () => {
    expect(frameAt({ a: { keys: [{ at: 0, o: 1.4 }] } }, 0).a.opacity).toBe(1);
  });
});

describe("scene catalog", () => {
  test("23 unique scenes, with captions in both languages", () => {
    expect(STORY_SCENES.length).toBe(23);
    expect(new Set(SCENE_IDS).size).toBe(23);
    for (const s of STORY_SCENES) {
      expect(s.caption.en.length).toBeGreaterThan(0);
      expect(s.caption.zh.length).toBeGreaterThan(0);
      expect(s.durationMs).toBeGreaterThanOrEqual(1000);
      expect(s.durationMs).toBeLessThanOrEqual(2500);
    }
    expect(isSceneId("files_double")).toBe(true);
    expect(isSceneId("nope")).toBe(false);
  });
});

describe("scene art", () => {
  for (const [id, art] of Object.entries(SCENE_ART)) {
    for (const intensity of [1, 2, 3] as const) {
      test(`${id} @${intensity}: every track has a part, every key fits in the scene`, () => {
        const html = renderToStaticMarkup(createElement("svg", null, art!.draw({ intensity })));
        const tracks = art!.tracks({ intensity });
        const dur = sceneById(id)!.durationMs;
        for (const [part, t] of Object.entries(tracks)) {
          expect(html).toContain(`data-part="${part}"`);
          for (const k of t.keys) expect(k.at).toBeLessThanOrEqual(dur);
        }
      });
    }
  }
});
