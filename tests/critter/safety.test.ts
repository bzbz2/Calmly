import { describe, expect, test } from "bun:test";
import { screenCrisis } from "../../src/lib/critter/safety";
import { handleCritterRequest } from "../../src/lib/critter/service";

describe("screenCrisis", () => {
  const risky = [
    "I want to die",
    "I've been thinking about killing myself",
    "I just want to end it all",
    "everyone would be better off without me",
    "I keep hurting myself",
    "I don't want to wake up tomorrow",
    "thinking about self-harm again",
  ];
  const benign = [
    "I'm dying of boredom in this meeting",
    "this meeting is killing me",
    "I could die of embarrassment",
    "I killed it at work today",
    "I'm so done with meetings.",
  ];
  for (const t of risky) test(`flags: ${t}`, () => expect(screenCrisis(t)).toBe(true));
  for (const t of benign) test(`ignores: ${t}`, () => expect(screenCrisis(t)).toBe(false));
});

describe("handleCritterRequest", () => {
  test("400 on missing/empty/too-long text", () => {
    expect(handleCritterRequest(null).status).toBe(400);
    expect(handleCritterRequest({ text: "   " }).status).toBe(400);
    expect(handleCritterRequest({ text: "x".repeat(500) }).status).toBe(400);
  });
  test("crisis input returns support message, never an animation", () => {
    const r = handleCritterRequest({ text: "I want to die, so done with meetings" });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ crisis: true });
    expect("selection" in r.body).toBe(false);
    expect((r.body as { message: string }).message).toContain("988");
  });
  test("normal input returns a selection", () => {
    const r = handleCritterRequest({ text: "I'm so done with meetings.", variant: 2 });
    expect(r.body).toMatchObject({ crisis: false, selection: { sceneId: "meeting_fatigue", variant: 2 } });
  });
  test("privacy: response never echoes the user's text", () => {
    const secret = "my manager Priya keeps scheduling meetings";
    const r = handleCritterRequest({ text: secret });
    expect(JSON.stringify(r.body)).not.toContain("Priya");
  });
  test("bad variant is ignored", () => {
    const r = handleCritterRequest({ text: "meetings", variant: "lol" });
    expect(r.body).toMatchObject({ selection: { variant: 0 } });
  });
});
