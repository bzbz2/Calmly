import { describe, expect, test } from "bun:test";
import { CRISIS_MESSAGE } from "../../src/lib/safety";
import { selectMoodAnimation } from "../../src/lib/critter/match";
import { sessionOpening, sessionSelection } from "../../src/lib/critter/session";

describe("sessionOpening", () => {
  test("empty session has no opening", () => expect(sessionOpening([])).toEqual({}));
  test("picks the first user message and the reply after it", () => {
    const o = sessionOpening([
      { role: "user", content: "I'm so exhausted" },
      { role: "assistant", content: "That sounds draining." },
      { role: "user", content: "I'm so happy now!" },
    ]);
    expect(o).toEqual({ firstUser: "I'm so exhausted", firstReply: "That sounds draining." });
  });
  test("reply is undefined while Calmly is still thinking", () => {
    expect(sessionOpening([{ role: "user", content: "hi" }])).toEqual({ firstUser: "hi", firstReply: undefined });
  });
});

describe("sessionSelection: one buddy per session, from the first message", () => {
  test("no first message, no buddy", () => {
    expect(sessionSelection(undefined)).toBeNull();
    expect(sessionSelection("   ")).toBeNull();
  });
  test("matches the first message exactly like the critter matcher", () => {
    expect(sessionSelection("I'm so exhausted")).toEqual(selectMoodAnimation("I'm so exhausted"));
    expect(sessionSelection("明明不是我的错，却要我来扛")?.feeling).toBe("wronged");
  });
  test("deterministic, so reopening a chat shows the same buddy", () => {
    expect(sessionSelection("I'm so done with meetings.")).toEqual(sessionSelection("I'm so done with meetings."));
  });
  test("later messages don't change the buddy (it only reads the first)", () => {
    const first = sessionOpening([
      { role: "user", content: "I'm so exhausted" },
      { role: "assistant", content: "…" },
      { role: "user", content: "I'm so happy now!" },
    ]).firstUser;
    expect(sessionSelection(first)?.feeling).toBe("tired");
  });
  test("variant cycles the caption, keeps the feeling", () => {
    const a = sessionSelection("I'm so exhausted", { variant: 0 })!;
    const b = sessionSelection("I'm so exhausted", { variant: 1 })!;
    expect(b.feeling).toBe(a.feeling);
    expect(b.caption).not.toBe(a.caption);
  });
  test("long first messages still match on their opening", () => {
    expect(sessionSelection("I'm so exhausted. " + "blah ".repeat(2000))?.feeling).toBe("tired");
  });
  test("crisis keywords: no buddy", () => {
    expect(sessionSelection("I want to kill myself")).toBeNull();
    expect(sessionSelection("我真的不想活了")).toBeNull();
  });
  test("agent answered with the crisis message: no buddy", () => {
    expect(sessionSelection("everything is pointless", { firstReply: CRISIS_MESSAGE })).toBeNull();
  });
});
