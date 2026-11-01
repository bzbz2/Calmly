// Deterministic crisis pre-screen for the critter feature. Runs before any
// whimsical output so a joke animation is never the only response to distress.
// This is a coarse net (keyword-based). The chat agent's LLM risk check stays the
// primary safety path; on a hit we steer the user to support resources + chat.
// Covers English and Chinese, since the critter page accepts both.

import { normalize } from "./match";

const SELF_HARM =
  /\b(kill(ing)? my ?self|suicid\w*|end (it all|my life)|take my (own )?life|want(ed|ing)? to die|wanna die|wish i (was|were) dead|wish i wasn'?t (here|alive)|don'?t want to (live|be alive|be here|exist|wake up)|better off (dead|without me)|self-? ?harm\w*|hurt(ing)? my ?self|cut(ting)? my ?self|no reason to live|not worth living|overdos\w*)\b/;

// Errs on the side of caution: "想死你了" (miss you to death) also matches, which only
// shows the support message instead of an animation.
const ZH_SELF_HARM =
  /(想死|不想活|活不下去|活着没意思|活着没意义|活着有什么意思|自杀|轻生|寻死|结束生命|结束自己|了结自己|了断|伤害自己|自残|自伤|割腕|跳楼|不想醒来|没有活下去|不如死了|死了算了|一了百了)/;

export function screenCrisis(text: string): boolean {
  return SELF_HARM.test(normalize(text)) || ZH_SELF_HARM.test(text);
}
