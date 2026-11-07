import { describe, expect, test } from "bun:test";
import { CRISIS_MESSAGE } from "../../src/lib/safety";
import { hasMoodSignal, selectMoodAnimation } from "../../src/lib/critter/match";
import { sessionMood, sessionSelection, type SessionMessage } from "../../src/lib/critter/session";

const u = (content: string): SessionMessage => ({ role: "user", content });
const a = (content: string): SessionMessage => ({ role: "assistant", content });

describe("hasMoodSignal", () => {
  test("clear feelings and situations count", () => {
    expect(hasMoodSignal("I'm so exhausted")).toBe(true);
    expect(hasMoodSignal("I'm so done with meetings.")).toBe(true);
    expect(hasMoodSignal("我今天好开心")).toBe(true);
  });
  test("neutral lines don't", () => {
    expect(hasMoodSignal("ok")).toBe(false);
    expect(hasMoodSignal("what should I do next?")).toBe(false);
  });
});

describe("sessionMood: the buddy follows the latest clear mood", () => {
  test("empty session: no buddy", () => {
    expect(sessionMood([])).toBeNull();
    expect(sessionMood([u("   ")])).toBeNull();
  });
  test("first message picks the buddy", () => {
    const m = sessionMood([u("I'm so exhausted")])!;
    expect(m.selection).toEqual(selectMoodAnimation("I'm so exhausted"));
    expect(m.sourceIndex).toBe(0);
  });
  test("a new clear mood updates the buddy", () => {
    const m = sessionMood([u("I'm so exhausted"), a("That sounds draining."), u("Actually I'm so happy now!")])!;
    expect(m.selection.feeling).toBe("happy");
    expect(m.sourceIndex).toBe(2);
  });
  test("neutral follow-ups keep the current buddy", () => {
    const m = sessionMood([u("I'm so exhausted"), a("…"), u("ok"), a("…"), u("what should I do next?")])!;
    expect(m.selection.feeling).toBe("tired");
    expect(m.sourceIndex).toBe(0);
  });
  test("no clear mood anywhere: fall back to the first message", () => {
    const m = sessionMood([u("hello"), a("hi!"), u("ok")])!;
    expect(m.sourceIndex).toBe(0);
    expect(m.selection.feeling).toBe("mixed");
  });
  test("Chinese messages work too", () => {
    expect(sessionMood([u("明明不是我的错，却要我来扛")])!.selection.feeling).toBe("wronged");
  });
  test("deterministic, so reopening a chat shows the same buddy", () => {
    const msgs = [u("I'm so done with meetings."), a("…"), u("ok")];
    expect(sessionMood(msgs)).toEqual(sessionMood(msgs));
  });
  test("variant cycles the caption, keeps the feeling", () => {
    const x = sessionMood([u("I'm so exhausted")], { variant: 0 })!.selection;
    const y = sessionMood([u("I'm so exhausted")], { variant: 1 })!.selection;
    expect(y.feeling).toBe(x.feeling);
    expect(y.caption).not.toBe(x.caption);
  });
  test("long messages still match on their opening", () => {
    expect(sessionMood([u("I'm so exhausted. " + "blah ".repeat(2000))])!.selection.feeling).toBe("tired");
  });
});

describe("sessionMood safety", () => {
  test("crisis keywords in the latest message hide the buddy", () => {
    expect(sessionMood([u("I'm so exhausted"), a("…"), u("I want to kill myself")])).toBeNull();
    expect(sessionMood([u("我真的不想活了")])).toBeNull();
  });
  test("agent replied with the crisis message: no buddy", () => {
    expect(sessionMood([u("everything is pointless"), a(CRISIS_MESSAGE)])).toBeNull();
  });
  test("neutral messages after a crisis keep it hidden", () => {
    expect(sessionMood([u("I want to die"), a(CRISIS_MESSAGE), u("ok")])).toBeNull();
  });
  test("a clear new mood after a crisis brings the buddy back", () => {
    const m = sessionMood([u("I want to die"), a(CRISIS_MESSAGE), u("I'm so exhausted")])!;
    expect(m.selection.feeling).toBe("tired");
  });
});

describe("sessionSelection (history thumbnails from the title)", () => {
  test("matches a single line", () => {
    expect(sessionSelection("I'm so exhausted")?.feeling).toBe("tired");
    expect(sessionSelection(undefined)).toBeNull();
    expect(sessionSelection("I want to kill myself")).toBeNull();
  });
});
