// Deterministic crisis pre-screen for the critter feature. Runs before any
// whimsical output so a joke animation is never the only response to distress.
// This is a coarse net (keyword-based). The chat agent's LLM risk check stays the
// primary safety path; on a hit we steer the user to support resources + chat.

import { normalize } from "./match";

const SELF_HARM =
  /\b(kill(ing)? my ?self|suicid\w*|end (it all|my life)|take my (own )?life|want(ed|ing)? to die|wanna die|wish i (was|were) dead|wish i wasn'?t (here|alive)|don'?t want to (live|be alive|be here|exist|wake up)|better off (dead|without me)|self-? ?harm\w*|hurt(ing)? my ?self|cut(ting)? my ?self|no reason to live|not worth living|overdos\w*)\b/;

export function screenCrisis(text: string): boolean {
  return SELF_HARM.test(normalize(text));
}
