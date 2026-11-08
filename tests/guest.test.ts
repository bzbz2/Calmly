import { describe, expect, test } from "bun:test";
import { GUEST_DAILY_MESSAGES, GUEST_UI, guestMessagesLeft, mergeAnimalPrefs, signUpHref } from "../src/lib/guest";
import { accountOf } from "../src/lib/account";
import { safeNext } from "../src/lib/safeNext";

describe("guest mode", () => {
  test("10 messages a day, never negative", () => {
    expect(GUEST_DAILY_MESSAGES).toBe(10);
    expect(guestMessagesLeft(0)).toBe(10);
    expect(guestMessagesLeft(9)).toBe(1);
    expect(guestMessagesLeft(10)).toBe(0);
    expect(guestMessagesLeft(42)).toBe(0);
  });

  test("animal preferences add up when a guest joins an account", () => {
    expect(mergeAnimalPrefs({ cat_1: 2, dog_1: -1 }, { cat_1: 1, owl_1: 3 })).toEqual({ cat_1: 3, dog_1: -1, owl_1: 3 });
    expect(mergeAnimalPrefs({}, { x: Number.NaN } as Record<string, number>)).toEqual({});
  });

  test("sign-up comes straight back to where the guest was", () => {
    const href = signUpHref("/chat?c=0b6b3a52-1f7e-4b1c-9a59-6a0d0c4e2f11");
    expect(href).toBe("/register?next=%2Fchat%3Fc%3D0b6b3a52-1f7e-4b1c-9a59-6a0d0c4e2f11");
    const next = new URL(href, "https://x.test").searchParams.get("next");
    expect(safeNext(next)).toBe("/chat?c=0b6b3a52-1f7e-4b1c-9a59-6a0d0c4e2f11");
    expect(safeNext(new URL(signUpHref("/gift?reply=abc"), "https://x.test").searchParams.get("next"))).toBe("/gift?reply=abc");
  });

  test("prompts exist in both languages", () => {
    for (const lang of ["en", "zh"] as const) {
      const g = GUEST_UI[lang];
      for (const p of [g.keepBuddy, g.moodBanner, g.shareSave, g.limitReached, g.giftNeedsAccount]) {
        expect(p.text.length).toBeGreaterThan(5);
        expect(p.cta.length).toBeGreaterThan(1);
      }
      expect(g.limit(3)).toContain("3");
    }
    expect(GUEST_UI.zh.keepBuddy.text).toBe("喜欢这只小家伙吗？保存下来，明天还能看到它。");
    expect(GUEST_UI.zh.moodBanner.text).toBe("登录后，换手机也不会丢失记录。");
  });

  test("who's visiting", () => {
    expect(accountOf(null)).toBe("none");
    expect(accountOf({ user: { id: "u1", guest: true }, expires: "" })).toBe("guest");
    expect(accountOf({ user: { id: "u1" }, expires: "" })).toBe("user");
  });
});
