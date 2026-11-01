// Request handling for POST /api/critter, kept free of auth/Next imports so it
// can be unit-tested. Privacy: the user's text is never stored, logged, or echoed.

import { CRISIS_MESSAGE } from "../safety";
import { selectMoodAnimation, validateMoodText, type AnimationSelection } from "./match";
import { screenCrisis } from "./safety";

export type CritterResponse =
  | { status: 400; body: { error: string } }
  | { status: 200; body: { crisis: true; message: string } }
  | { status: 200; body: { crisis: false; selection: AnimationSelection } };

export function handleCritterRequest(body: unknown): CritterResponse {
  const b = (body && typeof body === "object" ? body : {}) as { text?: unknown; variant?: unknown };
  const v = validateMoodText(b.text);
  if (!v.ok) return { status: 400, body: { error: v.error } };
  if (screenCrisis(v.text)) return { status: 200, body: { crisis: true, message: CRISIS_MESSAGE } };
  const variant = typeof b.variant === "number" && Number.isFinite(b.variant) ? b.variant : 0;
  return { status: 200, body: { crisis: false, selection: selectMoodAnimation(v.text, { variant }) } };
}
