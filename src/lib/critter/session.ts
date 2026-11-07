// The chat session's mood buddy. It follows the user's LATEST clear mood:
// each new message that expresses a feeling (or a known situation) updates the
// buddy, while neutral messages ("ok", "what should I do?") keep the current one.
//
// Where the feeling comes from, best first:
//   1. `feeling` on the message: the user's correction, or the feeling the LLM picked
//      ("none" = the LLM saw no clear feeling, so the message counts as neutral);
//   2. keyword matching, for messages not analysed yet (instant, before the reply).
// Pure and deterministic, so reopening a conversation recomputes the same buddy.

import { CRISIS_MESSAGE } from "../safety";
import { isFeeling, type Feeling } from "./catalog";
import { hasMoodSignal, selectMoodAnimation, type AnimationSelection } from "./match";
import { screenCrisis } from "./safety";

/** Matching only needs the opening of a message; keeps long pastes cheap. */
const MAX_MATCH_CHARS = 600;

export type SessionMessage = { role: "user" | "assistant"; content: string; feeling?: string | null };
export type SessionMood = { selection: AnimationSelection; sourceIndex: number; source: "llm" | "keywords" };

const clip = (text: string) => text.trim().slice(0, MAX_MATCH_CHARS);

/**
 * The buddy for the current state of a session, or null when there is nothing to show.
 * Walks user messages from newest to oldest:
 * - a crisis message (keyword pre-screen, or the agent replied with the crisis message)
 *   met before any clear mood hides the buddy; safety wins over cute;
 * - the first message with a clear feeling is the source;
 * - if none has one, the session's first message is used (a gentle "mixed").
 */
export function sessionMood(msgs: SessionMessage[], opts: { variant?: number } = {}): SessionMood | null {
  const pick = (i: number, feeling: Feeling | undefined, source: SessionMood["source"]): SessionMood => ({
    selection: selectMoodAnimation(clip(msgs[i].content), { variant: opts.variant, feeling }),
    sourceIndex: i,
    source,
  });
  let fallback: number | undefined;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m.role !== "user") continue;
    const text = clip(m.content);
    if (!text) continue;
    const reply = msgs.slice(i + 1).find((x) => x.role === "assistant")?.content;
    if (screenCrisis(text) || reply === CRISIS_MESSAGE) return null;
    if (isFeeling(m.feeling)) return pick(i, m.feeling, "llm");
    if (m.feeling !== "none" && hasMoodSignal(text)) return pick(i, undefined, "keywords");
    fallback = i;
  }
  return fallback === undefined ? null : pick(fallback, undefined, "keywords");
}

/** Buddy for a single line of text (used for chat-history thumbnails from the title). */
export function sessionSelection(text: string | undefined, opts: { variant?: number } = {}): AnimationSelection | null {
  return sessionMood(text ? [{ role: "user", content: text }] : [], opts)?.selection ?? null;
}
