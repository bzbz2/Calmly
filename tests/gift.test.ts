import { describe, expect, test } from "bun:test";
import { PHOTOS } from "../src/lib/critter/photos";
import { cleanText, giftHeadline, giftLine, giftMessage, giftPhoto, GIFT_PHRASES, MAX_CUSTOM, PHRASES } from "../src/lib/gift/gifts";
import { newToken } from "../src/lib/gift/server";

describe("send a buddy", () => {
  test("hugs come with a koala, and every phrase has real photos", () => {
    expect(giftPhoto("hug")).toBe("koala-yawn");
    for (const p of GIFT_PHRASES) for (const id of PHRASES[p].photos) expect(PHOTOS[id]).toBeDefined();
  });
  test("'another animal' cycles the phrase's photos", () => {
    const n = PHRASES.cheer.photos.length;
    expect(giftPhoto("cheer", n)).toBe(giftPhoto("cheer", 0));
    expect(giftPhoto("cheer", 1)).not.toBe(giftPhoto("cheer", 0));
    expect(giftPhoto("cheer", -1)).toBe(PHRASES.cheer.photos[n - 1]);
  });
  test("preset phrases in both languages", () => {
    expect(GIFT_PHRASES.filter((p) => p !== "custom").map((p) => giftMessage(p, "zh"))).toEqual(["想你了", "加油", "抱抱", "辛苦了", "生日快乐"]);
    expect(giftMessage("hug", "en")).toBe("Hugs");
  });
  test("the receiver's line", () => {
    expect(giftLine({ senderName: "小明", photoId: "koala-yawn", message: "抱抱", lang: "zh" })).toBe("小明送你一只考拉：抱抱 🐨");
    expect(giftLine({ senderName: "Ming", photoId: "otter-float", message: "Hugs", lang: "en" })).toBe("Ming sent you an otter: Hugs 🦦");
    expect(giftHeadline("", "koala-yawn", "zh")).toBe("一位朋友送你一只考拉");
  });
  test("custom text is cleaned: one line, no links, short", () => {
    expect(cleanText("  hi\n\nthere  ", 40)).toBe("hi there");
    expect(cleanText("see https://evil.example/x now", 40)).toBe("see now");
    expect(cleanText("a‮b", 40)).toBe("a b");
    expect(giftMessage("custom", "en", "x".repeat(100)).length).toBe(MAX_CUSTOM);
    expect(cleanText(42, 10)).toBe("");
  });
  test("links are unguessable and URL-safe", () => {
    const a = newToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(newToken()).not.toBe(a);
  });
});

describe("week recap image", () => {
  test("leaves out triggers and the not-enough-data note", async () => {
    const { weekCardLines } = await import("../src/lib/personal/share");
    const lines = weekCardLines([
      { id: "days", text: "本周已陪你 3 天" },
      { id: "avg", text: "本周平均心情 6.0，比上周高 2.0" },
      { id: "stress", text: "压力最高的一天是周三（8/10）" },
      { id: "triggers", text: "最常提到：工作" },
    ]);
    expect(lines).toEqual(["本周已陪你 3 天", "本周平均心情 6.0，比上周高 2.0", "压力最高的一天是周三（8/10）"]);
  });
  test("credits each CC BY author once", async () => {
    const { photoCredits } = await import("../src/lib/personal/share");
    const c = photoCredits([PHOTOS["koala-yawn"], PHOTOS["koala-yawn"], PHOTOS["basset-bench"], PHOTOS["samoyed-smile"]]);
    expect(c).toBe("Photos: Eric Kilby, VirtualWolf · Wikimedia Commons (CC BY / BY-SA)");
  });
});

describe("safe redirects after login", () => {
  test("only same-site paths", async () => {
    const { safeNext } = await import("../src/lib/safeNext");
    expect(safeNext("/gift?reply=abc")).toBe("/gift?reply=abc");
    expect(safeNext("//evil.example")).toBe("/chat");
    expect(safeNext("https://evil.example")).toBe("/chat");
    expect(safeNext("/\\evil.example")).toBe("/chat");
    expect(safeNext(null)).toBe("/chat");
  });
});
