import type { SceneId } from "@/lib/story/scenes";

/**
 * Empty space above each scene, in viewBox units (the canvas is 200 × 200): the
 * highest point any part of the drawing reaches over the whole animation, at any
 * intensity. The caption goes in a band at the top of the tile; a scene with this
 * much free sky lets the band overlap it instead of making the tile taller.
 *
 * Measured in /lab/stories by scrubbing every scene in 40 ms steps at intensity
 * 1-3 and taking the top of every visible shape's bounding box, minus 2 for the
 * stroke. Re-measure after moving anything near the top of a scene.
 */
export const HEADROOM: Record<SceneId, number> = {
  todo_grows: 0,
  calendar_attack: 24,
  one_more_meeting: 19,
  people_pillow: 12,
  kidding_me: 21,
  everything_fine: 0,
  dnd_blanket: 0,
  brain_logoff: 7,
  vacation_suitcase: 0,
  what_if: 0,
  upside_map: 9,
  email_close: 28,
  email_sent: 0,
  survived_monday: 0,
  life_together: 93,
  files_double: 0,
  penguin_hug: 38,
  cat_flatten: 22,
  can_startle: 0,
  peek_hello: 31,
  waiting_phone: 47,
  message_arrives: 30,
  neutral_surprise: 0,
};

/** Height of the caption band, in the same units: two lines of text plus padding. */
export const CAPTION_BAND = 46;

/**
 * Extra space to add above the scene so the caption band never covers the drawing,
 * as a percentage of the tile's width (CSS padding percentages are of the width).
 */
export function captionPad(id: SceneId): number {
  return (Math.max(0, CAPTION_BAND - (HEADROOM[id] ?? 0)) / 200) * 100;
}
