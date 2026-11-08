import { hideBetween, showBetween } from "@/lib/story/timeline";
import { Cat } from "../characters";
import { Bubble, GROUND, Shadow, type SceneArt } from "../kit";

// People, all day. Speech bubbles keep arriving from off-screen while the cat holds a
// polite, closed-eye smile. Then the smile goes flat, the head sags, a big pillow rises
// up and the cat buries its face in it; only the ears and the top of its head stick out.
// Beats: polite smile (0–760) → bubbles (200, 480) → flat deadpan (760) → sag (900)
// → pillow rises (890–1180) → hold to the end.

const CX = 96;
const SCALE = 1.6;
const LINE = "#5b4636";

/** A big squashy pillow, drawn centred on the cat's face. */
function Pillow() {
  return (
    <g>
      <rect x={48} y={92} width={100} height={56} rx={22} fill="#d9ccff" stroke={LINE} strokeWidth={2.3} />
      <rect x={55} y={99} width={86} height={42} rx={16} fill="none" stroke="#a996ec" strokeWidth={1.3} strokeDasharray="2.5 3" />
      <path d="M62 106 q6 -6 16 -6" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.7} />
    </g>
  );
}

export const peoplePillow: SceneArt = {
  id: "people_pillow",
  draw: () => (
    <>
      <Shadow part="shadow" x={CX} w={46} />
      <Cat id="c" x={CX} y={GROUND} scale={SCALE} />
      <g data-part="bub1">
        <Bubble x={148} y={26} w={44} h={24} />
      </g>
      <g data-part="bub2">
        <Bubble x={172} y={58} w={40} h={22} />
      </g>
      <g data-part="pillow">
        <Pillow />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const sag = [2.5, 4, 6][intensity - 1];
    return {
      // Speech bubbles pop in one after another.
      bub1: {
        origin: [148, 26],
        keys: [
          { at: 0, sx: 0, sy: 0, o: 0 },
          { at: 200, sx: 0, sy: 0, o: 0, ease: "step" },
          { at: 220, o: 1, sx: 1, sy: 1, ease: "back" },
          { at: 1000, o: 1 },
          { at: 1100, o: 0, ease: "in" },
        ],
      },
      bub2: {
        origin: [172, 58],
        keys: [
          { at: 0, sx: 0, sy: 0, o: 0 },
          { at: 480, sx: 0, sy: 0, o: 0, ease: "step" },
          { at: 500, o: 1, sx: 1, sy: 1, ease: "back" },
          { at: 1000, o: 1 },
          { at: 1100, o: 0, ease: "in" },
        ],
      },
      // Polite closed-eye smile, then flat and tired.
      "c.eyes": { keys: [{ at: 0, o: 0 }] },
      "c.eyesClosed": { keys: hideBetween(760) },
      "c.eyesHalf": { origin: [0, -53], keys: showBetween(760) },
      "c.mouthSmile": { keys: hideBetween(760) },
      "c.mouthFlat": { keys: showBetween(760) },
      // The head sags forward into the pillow.
      "c.head": {
        origin: [0, -30],
        keys: [{ at: 0, y: 0, sy: 1 }, { at: 760, y: 0, sy: 1 }, { at: 900, y: sag, sy: 0.92, ease: "in" }],
      },
      "c.body": {
        origin: [0, -18],
        keys: [{ at: 0, sx: 1, sy: 1 }, { at: 880, sx: 1, sy: 1 }, { at: 1100, sx: 1.05, sy: 0.95, ease: "out" }],
      },
      "c.tail": { origin: [15, -6], keys: [{ at: 0, rot: 0 }, { at: 880, rot: 0 }, { at: 1100, rot: 16, ease: "out" }] },
      // The pillow rises up from below and hugs the face.
      pillow: {
        origin: [CX, 120],
        keys: [
          { at: 0, y: 70, o: 0 },
          { at: 880, y: 70, o: 0, ease: "step" },
          { at: 890, o: 1, ease: "step" },
          { at: 1180, y: 0, sx: 1, sy: 1, ease: "out" },
          { at: 1260, sx: 1.04, sy: 0.95, ease: "out" },
          { at: 1400, sx: 1, sy: 1 },
        ],
      },
    };
  },
};
