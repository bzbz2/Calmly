import { showBetween } from "@/lib/story/timeline";
import { Cat } from "../characters";
import { GROUND, Shadow, Spark, type SceneArt } from "../kit";

// Do not disturb, with no words. The cat sits there deadpan → a fluffy blanket drops on it
// from above, flop, and it becomes a round lump with only its eyes and ears showing → the
// eyes close, one ear folds down → a little crescent moon (focus mode) pops up.
// Beats: deadpan (0–450) → blanket lands (450–650) → settle (650–900) → eyes close, ear
// folds (1050–1250) → moon (1300–1450) → hold, the lump gently breathes.

const LINE = "#5b4636";
const CX = 100;
const SCALE = 1.5;
const LAND = 650;
// A soft dome from the floor up to just under the cat's eyes, with a folded hem on top.
const BLANKET = "M40 184 C38 158 44 126 68 120 H132 C156 126 162 158 160 184 Z";
const HEM = "M44 124 C44 114 52 110 66 110 H134 C148 110 156 114 156 124 C156 130 150 132 140 131 H60 C50 132 44 130 44 124 Z";

export const dndBlanket: SceneArt = {
  id: "dnd_blanket",
  draw: () => (
    <>
      <Shadow part="shadow" x={CX} w={56} />
      <Cat id="c" x={CX} y={GROUND} scale={SCALE} />
      <g data-part="blanket">
        <path d={BLANKET} fill="#b9d2ff" stroke={LINE} strokeWidth={2.3} strokeLinejoin="round" />
        <path d="M70 150 v30 M100 150 v32 M130 150 v30" stroke="#93b4ef" strokeWidth={2} strokeLinecap="round" strokeDasharray="0.1 7" />
        <path d={HEM} fill="#fff6e6" stroke={LINE} strokeWidth={2.3} strokeLinejoin="round" />
        <path d="M58 121 H142" stroke="#f3dcb8" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="5 4" />
      </g>
      <g transform="translate(166 40)">
        <g data-part="moon" style={{ opacity: 0 }}>
          <path d="M0 -16 A16 16 0 0 0 0 16 A24 24 0 0 1 0 -16 Z" fill="#ffe27a" stroke={LINE} strokeWidth={1.8} strokeLinejoin="round" />
          <Spark x={-14} y={-16} color="#f5b942" />
        </g>
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const squash = [0.94, 0.9, 0.86][intensity - 1];
    const fold = [-30, -45, -60][intensity - 1];
    const moonS = [0.9, 1, 1.15][intensity - 1];
    return {
      // Deadpan from the start: half-lidded, flat mouth. Eyes close once it's wrapped.
      "c.eyes": { keys: [{ at: 0, o: 0 }] },
      "c.eyesHalf": { origin: [0, -53], keys: showBetween(0, 1100) },
      "c.eyesClosed": { keys: showBetween(1100) },
      "c.mouthSmile": { keys: [{ at: 0, o: 0 }] },
      "c.mouthFlat": { keys: showBetween(0) },
      // The landing squashes the cat a little.
      c: {
        origin: [0, 0],
        keys: [
          { at: LAND, sx: 1, sy: 1 },
          { at: LAND + 70, sx: 2 - squash, sy: squash, ease: "out" },
          { at: LAND + 250, sx: 1, sy: 1, ease: "back" },
        ],
      },
      // Drops from above, lands with a squash, then breathes slowly.
      blanket: {
        origin: [100, 184],
        keys: [
          { at: 0, y: -190 },
          { at: 450, y: -190 },
          { at: LAND, y: 0, sx: 1, sy: 1, ease: "in" },
          { at: LAND + 70, sx: 1.08, sy: 0.9, ease: "out" },
          { at: LAND + 250, sx: 1, sy: 1, ease: "back" },
          { at: 1500, sx: 1, sy: 1 },
          { at: 1800, sx: 1.015, sy: 1.025, ease: "inOut" },
          { at: 2000, sx: 1.005, sy: 1.01, ease: "inOut" },
        ],
      },
      shadow: { origin: [CX, GROUND], keys: [{ at: 450, sx: 0.85 }, { at: LAND, sx: 1, ease: "in" }] },
      "c.earL": { origin: [-14, -72], keys: [{ at: 1050, rot: 0 }, { at: 1250, rot: fold, ease: "back" }] },
      moon: {
        origin: [0, 0],
        keys: [
          { at: 0, o: 0, sx: 0.4, sy: 0.4 },
          { at: 1290, o: 0, sx: 0.4, sy: 0.4, ease: "step" },
          { at: 1300, o: 1, ease: "step" },
          { at: 1450, sx: moonS, sy: moonS, ease: "back" },
          { at: 1750, y: -4, ease: "inOut" },
          { at: 2000, y: 0, ease: "inOut" },
        ],
      },
    };
  },
};
