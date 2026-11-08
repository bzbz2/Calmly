import { blink, showBetween } from "@/lib/story/timeline";
import { Penguin } from "../characters";
import { GROUND, Heart, Shadow, type SceneArt } from "../kit";

// Quiet hurt, comforted by itself. The penguin stands with a flat mouth → its gaze
// drops and it blinks, slowly → its flippers rise and wrap around its belly → one small
// tear slides down its cheek → a tiny warm heart appears; it sways, then leans into its
// own hug and its eyes close softly into a small smile. Slow and soft, never a joke.

const PX = 100;
const SCALE = 2;
const LINE = "#5b4636";
const HEART: [number, number] = [PX + 52, 54];

const DROP = 600; // gaze settles downward
const WRAP = 400; // flippers start to rise
const WRAPPED = 820; // flippers have wrapped
const TEAR = 740; // tear appears under the eye
const TEAR_END = 1100; // tear is gone
const WOBBLE = 640; // lip starts to tremble
const SMILE = 1250; // mouth softens into a smile
const CLOSE = 1150; // eyes start to close
const CLOSED = 1400; // eyes fully closed
const HEART_AT = 1100; // heart appears
const LEAN = 1150; // lean into the hug (settled by 1450)

/** One small tear on the left cheek, drawn on top of the penguin (penguin-local units). */
function Tear() {
  return (
    <g data-part="tear">
      <g transform="translate(-12 -36) scale(1.25)">
        <path d="M0 -4 C0.7 -2.8 1.9 -1 1.9 0.2 A1.9 1.9 0 0 1 -1.9 0.2 C-1.9 -1 -0.7 -2.8 0 -4 Z" fill="#bfe6ff" stroke={LINE} strokeWidth={0.9} strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** The hugging flippers: each curls from its shoulder around the belly, the tips meeting in
 * the middle like holding yourself, not crossing in an X. Penguin-local units. */
function HugArms() {
  return (
    <>
      {[-1, 1].map((s) => (
        <g key={s} data-part={s < 0 ? "hugL" : "hugR"} style={{ opacity: 0 }}>
          <path
            d={`M${25 * s} -48 C${36 * s} -36 ${26 * s} -20 ${3 * s} -21 C${2 * s} -24 ${6 * s} -27 ${12 * s} -28 C${20 * s} -30 ${24 * s} -38 ${20 * s} -46 Z`}
            fill="#5f6f99"
            stroke={LINE}
            strokeWidth={2.3}
            strokeLinejoin="round"
          />
        </g>
      ))}
    </>
  );
}

export const penguinHug: SceneArt = {
  id: "penguin_hug",
  draw: () => (
    <>
      <Shadow x={PX} w={40} />
      <Penguin id="p" x={PX} y={GROUND} scale={SCALE} top={
          <>
            <HugArms />
            <Tear />
          </>
        } />
      <g data-part="heart">
        <Heart x={HEART[0]} y={HEART[1]} size={14} />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
        const droop = [2.5, 3.5, 4.5][intensity - 1]; // how far the gaze drops
    const sway = [1.6, 2.4, 3.2][intensity - 1]; // how far it sways
    return {
      // Gaze drops, slowly; the eyes stay down.
      "p.face": { origin: [0, -40], keys: [{ at: 0, y: 0 }, { at: DROP, y: droop, ease: "inOut" }] },
      // One slow sad blink, then the eyes soften shut (scaled down to a line, then arcs).
      "p.eyes": {
        origin: [0, -44],
        keys: [
          ...blink(540, 200),
          { at: CLOSE, sy: 1 },
          { at: CLOSED, sy: 0.1, ease: "inOut" },
          { at: CLOSED + 1, o: 0, ease: "step" },
        ],
      },
      "p.eyesClosed": { keys: showBetween(CLOSED + 1) },
      // Flat mouth, then the lip trembles, then a small smile once it's comforted.
      "p.mouthFlat": { keys: showBetween(0, WOBBLE) },
      "p.mouthWobble": { keys: showBetween(WOBBLE, SMILE) },
      "p.mouthSmile": { keys: showBetween(SMILE) },
      // The plain flippers rise, then hand over to the curled hugging flippers.
      "p.armL": { origin: [-25, -46], keys: [{ at: WRAP, rot: 0, o: 1 }, { at: WRAPPED - 120, rot: -35, ease: "inOut" }, { at: WRAPPED - 110, o: 0, ease: "step" }] },
      "p.armR": { origin: [25, -46], keys: [{ at: WRAP, rot: 0, o: 1 }, { at: WRAPPED - 120, rot: 35, ease: "inOut" }, { at: WRAPPED - 110, o: 0, ease: "step" }] },
      hugL: { origin: [-25, -46], keys: [{ at: 0, o: 0, sx: 0.7, sy: 0.9 }, { at: WRAPPED - 110, o: 0, ease: "step" }, { at: WRAPPED - 100, o: 1, ease: "step" }, { at: WRAPPED + 60, sx: 1, sy: 1, ease: "out" }, { at: LEAN + 250, sx: 1.05, sy: 1.02, ease: "inOut" }] },
      hugR: { origin: [25, -46], keys: [{ at: 0, o: 0, sx: 0.7, sy: 0.9 }, { at: WRAPPED - 110, o: 0, ease: "step" }, { at: WRAPPED - 100, o: 1, ease: "step" }, { at: WRAPPED + 60, sx: 1, sy: 1, ease: "out" }, { at: LEAN + 250, sx: 1.05, sy: 1.02, ease: "inOut" }] },
      // It hunches a little while sad, then the hug draws it in tight.
      "p.body": { origin: [0, -2], keys: [{ at: 200, sx: 1, sy: 1 }, { at: DROP, sx: 1.03, sy: 0.94, ease: "inOut" }, { at: LEAN + 250, sx: 0.97, sy: 0.96, ease: "inOut" }] },
      // A little sway, then a lean into the hug that stays.
      p: {
        origin: [0, 0],
        keys: [
          { at: 700, rot: 0, sx: 1, sy: 1 },
          { at: 940, rot: sway, ease: "inOut" },
          { at: 1130, rot: -sway * 0.6, ease: "inOut" },
          { at: LEAN + 250, rot: -3.5, sx: 1.03, sy: 0.97, ease: "inOut" },
        ],
      },
      // One tear: appears under the eye, slides down the cheek, fades out.
      tear: {
        keys: [
          { at: 0, o: 0 },
          { at: TEAR - 1, o: 0, ease: "step" },
          { at: TEAR, o: 1, ease: "out" },
          { at: TEAR_END - 60, y: 9, ease: "in" },
          { at: TEAR_END, o: 0, ease: "out" },
        ],
      },
      // A tiny warm heart: pops in at the chest, then floats up gently.
      heart: {
        origin: HEART,
        keys: [
          { at: 0, sx: 0, sy: 0, o: 0 },
          { at: HEART_AT - 1, o: 0, ease: "step" },
          { at: HEART_AT, sx: 0.3, sy: 0.3, o: 1, ease: "step" },
          { at: HEART_AT + 170, sx: 1, sy: 1, ease: "back" },
          { at: 1550, y: -6, ease: "inOut" },
        ],
      },
    };
  },
};
