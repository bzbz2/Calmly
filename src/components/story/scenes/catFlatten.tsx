import { showBetween } from "@/lib/story/timeline";
import { Cat } from "../characters";
import { Backdrop, GROUND, Shadow, type SceneArt } from "../kit";

// Two beats, slow then fast. The cat sits with heavy eyelids, sighs, its head
// sways as it nods off and its eyes close… then it melts into a flat cat pancake, ears
// out sideways, its sleepy face still showing on top (squished, wobbly mouth). It stays
// there (the punchline), just one lazy tail flick. Drained, deflated, done.

const CX = 100;
const FLOP = 1350; // starts to go
const FLAT = 1560; // pancake

export const catFlatten: SceneArt = {
  id: "cat_flatten",
  draw: () => (
    <>
      <Backdrop id="cat_flatten" tone="mint" />
      <Shadow part="shadow" x={CX} w={38} />
      <Cat id="c" x={CX} y={GROUND} scale={1.65} />
    </>
  ),
  tracks: ({ intensity }) => {
    const flat = [0.58, 0.52, 0.46][intensity - 1];
    const wide = [1.3, 1.36, 1.42][intensity - 1];
    return {
      // Beat 1 (slow): eyelids get heavier, a sigh, the head sways as it nods off.
      "c.eyes": { keys: [{ at: 0, o: 0 }] },
      "c.eyesHalf": { origin: [0, -53], keys: [{ at: 0, o: 1, sy: 1 }, { at: 1000, sy: 0.55, ease: "in" }, { at: 1001, o: 0, ease: "step" }] },
      "c.eyesClosed": { keys: showBetween(1001) },
      "c.mouthSmile": { keys: [{ at: 0, o: 0 }] },
      "c.mouthFlat": { keys: [{ at: 0, o: 1 }, { at: 450, o: 0, ease: "step" }, { at: 1150, o: 1, ease: "step" }, { at: FLAT - 60, o: 0, ease: "step" }] },
      "c.mouthWobble": { keys: showBetween(FLAT - 60) },
      "c.mouthO": { keys: showBetween(450, 1150) },
      "c.head": {
        origin: [0, -30],
        keys: [
          { at: 0, rot: 0, y: 0 },
          { at: 550, rot: -4, y: 1, ease: "inOut" },
          { at: 1050, rot: 3, y: 2, ease: "inOut" },
          { at: FLOP, rot: 0, y: 2.5, ease: "inOut" },
        ],
      },
      // The face stays readable on the pancake: counter-stretch it against the squash.
      "c.face": {
        origin: [0, -48],
        keys: [
          { at: 0, y: -1.5, sx: 1, sy: 1 },
          { at: FLOP, y: 1, sx: 1, sy: 1 },
          { at: FLAT, y: 2, sx: 0.82, sy: 0.85 / flat, ease: "in" },
        ],
      },
      "c.earL": { origin: [-14, -72], keys: [{ at: 0, rot: 0 }, { at: FLOP, rot: -14 }, { at: FLAT, rot: -40, ease: "in" }] },
      "c.earR": { origin: [14, -72], keys: [{ at: 0, rot: 0 }, { at: FLOP, rot: 14 }, { at: FLAT, rot: 40, ease: "in" }] },
      // Beat 2 (fast): a tiny lift, then splat into a pancake with a mochi jiggle.
      c: {
        origin: [0, 0],
        keys: [
          { at: FLOP, y: 0, sx: 1, sy: 1 },
          { at: FLOP + 70, y: -3, sx: 0.97, sy: 1.04, ease: "out" },
          { at: FLAT, y: 0, sx: wide, sy: flat, ease: "in" },
          { at: FLAT + 80, sx: wide - 0.06, sy: flat + 0.07, ease: "out" },
          { at: FLAT + 170, sx: wide, sy: flat, ease: "inOut" },
          { at: FLAT + 240, sx: wide - 0.02, sy: flat + 0.02, ease: "inOut" },
          { at: FLAT + 300, sx: wide, sy: flat, ease: "inOut" },
        ],
      },
      "c.armL": { keys: [{ at: FLAT - 60, o: 1 }, { at: FLAT - 50, o: 0, ease: "step" }] },
      "c.armR": { keys: [{ at: FLAT - 60, o: 1 }, { at: FLAT - 50, o: 0, ease: "step" }] },
      shadow: { origin: [CX, GROUND], keys: [{ at: FLOP, sx: 1 }, { at: FLAT, sx: wide + 0.15, ease: "in" }] },
      // The hold: still a pancake. One lazy tail flick.
      "c.tail": { origin: [15, -6], keys: [{ at: 2050, rot: 0 }, { at: 2200, rot: -18, ease: "out" }, { at: 2400, rot: 0, ease: "inOut" }] },
    };
  },
};
