import { describe, expect, test } from "bun:test";
import { screenCrisis } from "../../src/lib/critter/safety";

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
