import { blink, hideBetween, shake, showBetween, type Key } from "@/lib/story/timeline";
import { Dog } from "../characters";
import { Backdrop, Bubble, GROUND, Shadow, type SceneArt } from "../kit";

// Someone off-screen keeps talking at the shiba: one bubble, two, three… Its smile
// fades, it blinks, then blinks again, slowly. Then its head snaps round to face you,
// eyes half shut, and the camera pushes in while the bubbles keep on talking.
// Deadpan "are you kidding me?".

const TURN = 1450;

/** Pop a bubble in at `at`, then keep it wiggling (still talking) to the end. */
function talk(at: number, end: number, amp: number): Key[] {
  return [
    { at: 0, sx: 0.3, sy: 0.3, o: 0 },
    { at, sx: 0.3, sy: 0.3, o: 0, ease: "step" },
    { at: at + 10, o: 1, ease: "step" },
    { at: at + 200, sx: 1, sy: 1, ease: "back" },
    ...shake(at + 260, end, amp, Math.round((end - at) / 220), "rot").slice(1),
  ];
}

export const kiddingMe: SceneArt = {
  id: "kidding_me",
  draw: () => (
    <>
      <Backdrop id="kidding_me" tone="cool" />
      <Shadow x={66} w={38} />
      <Dog id="d" x={66} y={GROUND} scale={1.62} />
      <g data-part="b1">
        <Bubble x={162} y={132} w={54} h={30} flip />
      </g>
      <g data-part="b2">
        <Bubble x={154} y={94} w={58} h={32} flip />
      </g>
      <g data-part="b3">
        <Bubble x={164} y={54} w={62} h={34} flip />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const push = [1.1, 1.16, 1.22][intensity - 1];
    const droop = [12, 20, 28][intensity - 1];
    const end = 2300;
    return {
      b1: { origin: [177, 142], keys: talk(80, end, 2.5) },
      b2: { origin: [172, 106], keys: talk(520, end, 2.5) },
      b3: { origin: [184, 68], keys: talk(940, end, 3) },
      // Listening, turned toward the bubbles; then the snap round to face you.
      "d.head": { origin: [0, -30], keys: [{ at: 0, rot: 7 }, { at: TURN, rot: 7 }, { at: TURN + 200, rot: 0, ease: "back" }] },
      "d.face": { origin: [0, -50], keys: [{ at: 0, x: 7, sx: 0.88 }, { at: TURN, x: 7, sx: 0.88 }, { at: TURN + 170, x: 0, sx: 1, ease: "out" }] },
      "d.eyes": { origin: [0, -53], keys: [...blink(650, 160), ...blink(1020, 380), ...hideBetween(TURN + 180).slice(1)] },
      "d.eyesHalf": { keys: showBetween(TURN + 180) },
      "d.mouthSmile": { keys: hideBetween(760) },
      "d.mouthFlat": { keys: showBetween(760) },
      "d.earL": { origin: [-14, -70], keys: [{ at: 900, rot: 0 }, { at: 1300, rot: -droop * 0.5 }, { at: TURN + 250, rot: -droop, ease: "out" }] },
      "d.earR": { origin: [14, -70], keys: [{ at: 900, rot: 0 }, { at: 1300, rot: droop * 0.5 }, { at: TURN + 250, rot: droop, ease: "out" }] },
      // Happy wag while the talking starts, then the tail stops.
      "d.tail": { origin: [15, -12], keys: shake(0, 700, 14, 4, "rot") },
      // The stare: slow push-in on its face.
      d: { origin: [0, -54], keys: [{ at: TURN + 200, sx: 1, sy: 1 }, { at: 2200, sx: push, sy: push, ease: "out" }] },
    };
  },
};
