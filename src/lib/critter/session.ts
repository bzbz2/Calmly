// One mood buddy per chat session, picked from the session's FIRST user message.
// Pure and deterministic: the same first message always gives the same buddy, so
// nothing extra is stored. Reopening a conversation recomputes it from history.

import { CRISIS_MESSAGE } from "../safety";
import { selectMoodAnimation, type AnimationSelection } from "./match";
import { screenCrisis } from "./safety";

/** Matching only needs the opening of a message; keeps long pastes cheap. */
const MAX_MATCH_CHARS = 600;

export type SessionMessage = { role: "user" | "assistant"; content: string };

/** The session's first user message and Calmly's first reply, if any. */
export function sessionOpening(msgs: SessionMessage[]): { firstUser?: string; firstReply?: string } {
  const i = msgs.findIndex((m) => m.role === "user");
  if (i < 0) return {};
  const reply = msgs.slice(i + 1).find((m) => m.role === "assistant");
  return { firstUser: msgs[i].content, firstReply: reply?.content };
}

/**
 * The buddy for a session, or null when there is nothing to show:
 * no first message yet, or the opening looks like a crisis (keyword pre-screen,
 * or the agent already answered with the crisis message). Safety wins over cute.
 */
export function sessionSelection(
  firstUser: string | undefined,
  opts: { variant?: number; firstReply?: string } = {},
): AnimationSelection | null {
  const text = firstUser?.trim().slice(0, MAX_MATCH_CHARS);
  if (!text) return null;
  if (screenCrisis(text) || opts.firstReply === CRISIS_MESSAGE) return null;
  return selectMoodAnimation(text, { variant: opts.variant });
}
