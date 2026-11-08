import { shake, type Key } from "@/lib/story/timeline";
import { Hamster } from "../characters";
import { GROUND, Shadow, Spark, type SceneArt } from "../kit";

// A small win, with a catch. A hamster leans over to straighten the crooked top book
// of a little stack, then stands tall and nods, proud: eyes shut in happy ^ ^ arcs.
// Next to the books a potted plant wobbles, then tips over. The hamster is startled
// for a moment, then smiles sheepishly with a sweat drop. "Got my life together
// (sort of)."

const HX = 54;
const SCALE = 1.3;
const INK = "#5b4636";
const LEAN = 430; // leans toward the books
const STRAIGHT = 720; // the top book is straight
const NOD = 960; // proud nods
const WOBBLE = 1100; // the plant starts to wobble
const TIP = 1220; // the plant tips over
const SHOCK = 1260; // startled
const HAPPY = 1380; // sheepish smile
const PLANT: [number, number] = [156, GROUND]; // pot's bottom-right corner, the pivot (the plant tips right)

/** The little stack of books, bottom first. The top one is crooked until it's straightened. */
function Books() {
  return (
    <g>
      <rect x={106} y={171} width={30} height={13} rx={1.5} fill="#b9d7f5" stroke={INK} strokeWidth={1.9} />
      <rect x={108} y={160} width={26} height={11} rx={1.5} fill="#ffd79a" stroke={INK} strokeWidth={1.9} />
      <g data-part="book3">
        <rect x={107} y={149} width={28} height={11} rx={1.5} fill="#cdbcf2" stroke={INK} strokeWidth={1.9} />
        <path d="M112 154.5 h18" stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.8} strokeLinecap="round" />
      </g>
    </g>
  );
}

/** A small potted plant, standing on the floor in the pot's corner. */
function Plant() {
  return (
    <g data-part="plant">
      <path d="M148 170 V150" stroke="#6fbf7f" strokeWidth={2.2} strokeLinecap="round" />
      <ellipse cx={141} cy={158} rx={7} ry={4} transform="rotate(-30 141 158)" fill="#9fd9a8" stroke={INK} strokeWidth={1.7} />
      <ellipse cx={155} cy={158} rx={7} ry={4} transform="rotate(30 155 158)" fill="#9fd9a8" stroke={INK} strokeWidth={1.7} />
      <ellipse cx={148} cy={148} rx={4} ry={7.5} fill="#9fd9a8" stroke={INK} strokeWidth={1.7} />
      <path d="M140 170 H156 L154 184 H142 Z" fill="#f6b7a6" stroke={INK} strokeWidth={1.9} strokeLinejoin="round" />
    </g>
  );
}

export const lifeTogether: SceneArt = {
  id: "life_together",
  draw: () => (
    <>
      <Shadow part="shadow" x={HX + 14} w={44} />
      <Books />
      <Plant />
      <g data-part="sparkL">
        <Spark x={100} y={136} color="#f5b942" />
      </g>
      <g data-part="sparkR">
        <Spark x={132} y={128} color="#f5b942" />
      </g>
      <Hamster id="h" x={HX} y={GROUND} scale={SCALE} />
    </>
  ),
  tracks: ({ intensity }) => {
    const lean = [4, 6, 8][intensity - 1];
    const sparkKeys: Key[] = [
      { at: 0, sx: 0.3, sy: 0.3, o: 0 },
      { at: STRAIGHT + 20, sx: 0.3, sy: 0.3, o: 0, ease: "step" },
      { at: STRAIGHT + 30, o: 1, ease: "step" },
      { at: STRAIGHT + 200, sx: 1.2, sy: 1.2, ease: "back" },
      { at: NOD + 300, sx: 1, sy: 1 },
      { at: 2100, o: 0.6 },
    ];
    return {
      // Lean in to the books, then back up tall.
      h: {
        origin: [0, 0],
        keys: [
          { at: 0, rot: 0 },
          { at: LEAN, rot: 0 },
          { at: LEAN + 170, rot: lean, ease: "inOut" },
          { at: STRAIGHT + 40, rot: lean },
          { at: STRAIGHT + 180, rot: 0, ease: "back" },
        ],
      },
      // The crooked book settles straight while the hamster leans on it.
      book3: { origin: [121, 160], keys: [{ at: 0, rot: -12 }, { at: LEAN + 130, rot: -12 }, { at: STRAIGHT, rot: 0, ease: "out" }] },
      // Two proud nods (head dips and comes back).
      "h.head": {
        origin: [0, -30],
        keys: [{ at: NOD, y: 0 }, { at: NOD + 50, y: 3, ease: "inOut" }, { at: NOD + 120, y: 0, ease: "inOut" }, { at: NOD + 170, y: 3, ease: "inOut" }, { at: NOD + 240, y: 0, ease: "inOut" }],
      },
      // Happy ^ ^ from the first nod, startled when the plant goes, then happy again.
      "h.eyes": { keys: [{ at: 0, o: 1 }, { at: NOD, o: 0, ease: "step" }] },
      "h.eyesHappy": { keys: [{ at: 0, o: 0 }, { at: NOD, o: 1, ease: "step" }, { at: SHOCK, o: 0, ease: "step" }, { at: HAPPY, o: 1, ease: "step" }] },
      "h.eyesWide": { keys: [{ at: 0, o: 0 }, { at: SHOCK, o: 1, ease: "step" }, { at: HAPPY, o: 0, ease: "step" }] },
      "h.mouthSmile": { keys: [{ at: 0, o: 1 }, { at: SHOCK, o: 0, ease: "step" }, { at: HAPPY, o: 1, ease: "step" }] },
      "h.mouthO": { keys: [{ at: 0, o: 0 }, { at: SHOCK, o: 1, ease: "step" }, { at: HAPPY, o: 0, ease: "step" }] },
      "h.sweat": { keys: [{ at: 0, y: 0, o: 0 }, { at: SHOCK + 60, o: 1, ease: "step" }] },
      // The plant wobbles, then tips over to the right.
      plant: {
        origin: PLANT,
        keys: [
          { at: 0, rot: 0 },
          { at: WOBBLE, rot: 0 },
          ...shake(WOBBLE, TIP, 3, 4, "rot").slice(1),
          { at: TIP + 150, rot: 88, ease: "in" },
          { at: TIP + 240, rot: 84, ease: "out" },
          { at: TIP + 320, rot: 88, ease: "inOut" },
        ],
      },
      sparkL: { origin: [100, 136], keys: sparkKeys },
      sparkR: { origin: [132, 128], keys: sparkKeys },
      shadow: { origin: [HX + 14, GROUND], keys: [{ at: 0, sx: 1 }, { at: TIP + 150, sx: 1.12, ease: "out" }] },
    };
  },
};
