// Deterministic mood -> scene matching. No LLM call, no network, no storage.
// Matches situation + nuance (e.g. "nobody noticed" -> unseen_effort, not "sad").

import { SCENES, type MoodIntent } from "./catalog";

export const MAX_MOOD_LENGTH = 240;
const MIN_SCORE = 3;

type Rule = { re: RegExp; w: number; negatable?: boolean };
type ScoredIntent = Exclude<MoodIntent, "general">;

const RULES: Record<ScoredIntent, Rule[]> = {
  meeting_fatigue: [
    { re: /\bmeetings?\b/, w: 3 },
    { re: /\b(syncs?|standups?|stand ups?|zoom|huddles?|calls?|call after call)\b/, w: 2 },
    { re: /\b(calendar|back to back|wall to wall)\b/, w: 2 },
    { re: /\b(done with|tired of|sick of|so many|another|endless|too many|enough)\b/, w: 1 },
  ],
  task_overload: [
    { re: /\b(too much|so much) (to do|work|going on|on my plate|stuff)\b/, w: 4 },
    { re: /\bon my plate\b/, w: 2 },
    { re: /\b(overwhelm\w*|swamped|buried|drowning|snowed under|piling up|piled up|stacking up|behind on)\b/, w: 3 },
    { re: /\b(to do list|to-do list|todo list|to-dos?|todos?|backlog|workload)\b/, w: 2 },
    { re: /\b(no time|not enough time|can'?t keep up)\b/, w: 2 },
    { re: /\b(deadlines?|tasks?|emails?|inbox|chores|errands|assignments?|projects?)\b/, w: 1 },
    { re: /\b(endless|never ending|never ends|non ?stop)\b/, w: 1 },
  ],
  social_battery: [
    { re: /\bsocial battery\b/, w: 5 },
    { re: /\bpeople\b.*\b(exhausting|draining|tiring|too much|annoying|overwhelming|a lot)\b/, w: 4 },
    { re: /\b(peopled out|peopling|people-ing|small talk|socializing|socialising|socially)\b/, w: 3 },
    { re: /\b(need|want|wanna) (some )?(alone time|to be alone|space|quiet)\b/, w: 3 },
    { re: /\b(introvert\w*|party|parties|crowds?|networking)\b/, w: 2 },
    { re: /\b(exhausting|draining|drained|drains me|exhausted)\b/, w: 1 },
  ],
  unseen_effort: [
    { re: /\b(nobody|no one|noone|no-one)\b.*\b(notic\w*|appreciat\w*|cares?|saw|sees|seen|thank\w*|recogni[sz]\w*|acknowledg\w*|credit)\b/, w: 5, negatable: false },
    { re: /\b(didn'?t|don'?t|doesn'?t|never|won'?t)\b.*\b(notic\w*|appreciat\w*|thank\w*|recogni[sz]\w*|acknowledg\w*)\b/, w: 4, negatable: false },
    { re: /\b(unappreciated|underappreciated|under appreciated|invisible|unnoticed|thankless|taken for granted|overlooked|unseen|unrecogni[sz]ed)\b/, w: 4 },
    { re: /\btook (the |all the )?credit\b/, w: 4 },
    { re: /\b(credit|recognition)\b/, w: 2 },
    { re: /\bhow hard i (work|worked|tried)\b/, w: 2 },
  ],
  tiny_victory: [
    { re: /\bfinally\b/, w: 2 },
    { re: /\b(finished|completed|shipped|submitted|nailed it|crushed it|did it|got it done|pulled it off|passed|aced|launched|wrapped up)\b/, w: 3 },
    { re: /\b(proud|accomplished|victory|win|won|yay|woohoo|hooray|celebrat\w*)\b/, w: 3 },
    { re: /\bpromot(ed|ion)\b/, w: 3 },
  ],
};

// Negator right before a match, allowing one word in between ("not overwhelmed", "not really proud").
const NEGATION = /\b(not|never|no longer|hardly|isn'?t|aren'?t|wasn'?t|weren'?t|don'?t|doesn'?t|didn'?t|won'?t|haven'?t|hasn'?t|can'?t|couldn'?t)\s+(?:[\w-]+\s+)?$/;

// Lowercase, drop apostrophes ("won't" -> "wont" so \bwon\b can't match it), strip punctuation.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’‘`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ruleMatches(s: string, rule: Rule): boolean {
  const re = new RegExp(rule.re.source, "g");
  for (const m of s.matchAll(re)) {
    if (rule.negatable === false) return true;
    if (!NEGATION.test(s.slice(0, m.index) + " ")) return true;
  }
  return false;
}

export function scoreIntents(text: string): Record<ScoredIntent, number> {
  const s = normalize(text);
  const out = {} as Record<ScoredIntent, number>;
  for (const intent of Object.keys(RULES) as ScoredIntent[]) {
    out[intent] = RULES[intent].reduce((sum, r) => (ruleMatches(s, r) ? sum + r.w : sum), 0);
  }
  return out;
}

/** Best intent, or `general` when nothing scores high enough or the top two tie (ambiguous). */
export function matchIntent(text: string): { intent: MoodIntent; confidence: number } {
  const ranked = Object.entries(scoreIntents(text)).sort((a, b) => b[1] - a[1]) as [ScoredIntent, number][];
  const [top, second] = ranked;
  if (top[1] < MIN_SCORE || top[1] === second[1]) return { intent: "general", confidence: 0 };
  return { intent: top[0], confidence: Math.round(((top[1] - second[1]) / top[1]) * 100) / 100 };
}

export type ValidationResult = { ok: true; text: string } | { ok: false; error: string };

export function validateMoodText(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, error: "Tell me how you feel in a few words." };
  const text = raw.trim();
  if (text.length > MAX_MOOD_LENGTH) return { ok: false, error: `Keep it to one sentence (${MAX_MOOD_LENGTH} characters max).` };
  return { ok: true, text };
}

export type AnimationSelection = {
  sceneId: MoodIntent; // which art to render
  moodIntent: MoodIntent; // what we understood
  confidence: number;
  caption: string;
  alt: string;
  durationMs: number;
  variant: number;
  variantCount: number;
  comingSoon: boolean; // matched an intent whose original art isn't produced yet
};

export function selectMoodAnimation(text: string, opts: { variant?: number } = {}): AnimationSelection {
  const { intent, confidence } = matchIntent(text);
  const intentScene = SCENES[intent];
  const art = intentScene.enabled ? intentScene : SCENES.general;
  const captions = intentScene.captions;
  const variant = Math.abs(Math.trunc(opts.variant ?? 0)) % captions.length;
  return {
    sceneId: art.sceneId,
    moodIntent: intent,
    confidence,
    caption: captions[variant],
    alt: art.alt,
    durationMs: art.durationMs,
    variant,
    variantCount: captions.length,
    comingSoon: !intentScene.enabled,
  };
}
