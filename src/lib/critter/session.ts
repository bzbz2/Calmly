// The chat session's mood buddy. It follows the user's LATEST clear mood:
// each new message that expresses a feeling (or a known situation) updates the
// buddy, while neutral messages ("ok", "what should I do?") keep the current one.
// Pure and deterministic, so nothing extra is stored: reopening a conversation
// recomputes the same buddy from history.

import { CRISIS_MESSAGE } from "../safety";
import { hasMoodSignal, selectMoodAnimation, type AnimationSelection } from "./match";
import { screenCrisis } from "./safety";

/** Matching only needs the opening of a message; keeps long pastes cheap. */
const MAX_MATCH_CHARS = 600;

export type SessionMessage = { role: "user" | "assistant"; content: string };
export type SessionMood = { selection: AnimationSelection; sourceIndex: number };

const clip = (text: string) => text.trim().slice(0, MAX_MATCH_CHARS);

/**
 * The buddy for the current state of a session, or null when there is nothing to show.
 * Walks user messages from newest to oldest:
 * - a crisis message (keyword pre-screen, or the agent replied with the crisis message)
 *   met before any clear mood hides the buddy; safety wins over cute;
 * - the first message with a clear mood signal is the source;
 * - if no message has a clear signal, the session's first message is used (a gentle "mixed").
 * `sourceIndex` is the index of the source message in `msgs`.
 */
export function sessionMood(msgs: SessionMessage[], opts: { variant?: number } = {}): SessionMood | null {
  let fallback: number | undefined;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role !== "user") continue;
    const text = clip(msgs[i].content);
    if (!text) continue;
    const reply = msgs.slice(i + 1).find((m) => m.role === "assistant")?.content;
    if (screenCrisis(text) || reply === CRISIS_MESSAGE) return null;
    if (hasMoodSignal(text)) return { selection: selectMoodAnimation(text, { variant: opts.variant }), sourceIndex: i };
    fallback = i;
  }
  if (fallback === undefined) return null;
  return { selection: selectMoodAnimation(clip(msgs[fallback].content), { variant: opts.variant }), sourceIndex: fallback };
}

/** Buddy for a single line of text (used for chat-history thumbnails from the title). */
export function sessionSelection(text: string | undefined, opts: { variant?: number } = {}): AnimationSelection | null {
  return sessionMood(text ? [{ role: "user", content: text }] : [], opts)?.selection ?? null;
}
