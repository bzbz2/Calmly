import { hideBetween, shake, showBetween } from "@/lib/story/timeline";
import { Hamster } from "../characters";
import { Backdrop, GROUND, PaperPile, Shadow, type SceneArt } from "../kit";

// The hamster balances a pile of papers on its head, still smiling, eyes up on it →
// a second pile thumps down and the tower wobbles; it squashes, eyes > < → it looks
// straight at you, sweating, trembling (the beat) → SPLAT: the tower squashes it flat
// into a hamster pancake, papers still neatly on top. It stays there.

const HX = 100;
const SCALE = 1.45;
const HEIGHT = 64 * SCALE;
const HEAD = GROUND - HEIGHT + 1; // pile bottom, on top of its head
const SHEET_W = 54;
const SHEET_H = 5.4;
const FIRST = 6;
const extra = (i: 1 | 2 | 3) => [5, 7, 9][i - 1];

const LAND = 700; // second pile hits
const LOOK = 1050; // looks at you
const GIVE = 1480; // gives way
const FLAT = 1600; // pancake

export const filesDouble: SceneArt = {
  id: "files_double",
  draw: ({ intensity }) => (
    <>
      <Backdrop id="files_double" tone="warm" />
      <Shadow part="shadow" x={HX} w={44} />
      <Hamster id="h" x={HX} y={GROUND} scale={SCALE} />
      <g data-part="pile">
        <PaperPile x={HX} bottom={HEAD} n={FIRST} w={SHEET_W} h={SHEET_H} />
        <g data-part="stack2">
          <PaperPile x={HX} bottom={HEAD - FIRST * SHEET_H} n={extra(intensity)} w={SHEET_W} h={SHEET_H} seed={3} />
        </g>
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const wobble = [3, 4, 5.5][intensity - 1];
    const squash = [0.9, 0.87, 0.84][intensity - 1];
    const flat = [0.48, 0.42, 0.36][intensity - 1];
    const wide = [1.3, 1.38, 1.46][intensity - 1];
    const sink = (s: number) => HEIGHT * (1 - s);
    return {
      // Second pile drops in from above and thumps down.
      stack2: { keys: [{ at: 0, y: -110, o: 0 }, { at: LAND - 200, y: -110, o: 0, ease: "step" }, { at: LAND - 190, o: 1, ease: "step" }, { at: LAND, y: 0, ease: "in" }, { at: LAND + 60, y: -4, ease: "out" }, { at: LAND + 120, y: 0, ease: "in" }] },
      // The tower rides the hamster's head down: first squash, wobble, then the splat.
      pile: {
        origin: [HX, HEAD],
        keys: [
          { at: LAND, y: 0 },
          { at: LAND + 60, y: sink(squash), ease: "out" },
          { at: LAND + 220, y: sink(0.97), ease: "out" },
          { at: LAND + 400, y: 0, ease: "out" },
          ...shake(LAND + 60, LAND + 700, wobble, 5, "rot").slice(1),
          { at: GIVE, y: 0, rot: 0 },
          { at: FLAT, y: sink(flat), ease: "in" },
          { at: FLAT + 80, y: sink(flat + 0.07), ease: "out" },
          { at: FLAT + 170, y: sink(flat), ease: "inOut" },
          { at: FLAT + 300, rot: 2.5, ease: "out" },
          { at: FLAT + 450, rot: 0, ease: "inOut" },
        ],
      },
      h: {
        origin: [0, 0],
        keys: [
          { at: LAND, sx: 1, sy: 1 },
          { at: LAND + 60, sx: 2 - squash, sy: squash, ease: "out" },
          { at: LAND + 220, sx: 1.03, sy: 0.97, ease: "out" },
          { at: LAND + 400, sx: 1, sy: 1, ease: "out" },
          { at: GIVE, sx: 1, sy: 1 },
          { at: FLAT, sx: wide, sy: flat, ease: "in" },
          { at: FLAT + 80, sx: wide - 0.06, sy: flat + 0.07, ease: "out" },
          { at: FLAT + 170, sx: wide, sy: flat, ease: "inOut" },
        ],
      },
      shadow: { origin: [HX, GROUND], keys: [{ at: GIVE, sx: 1 }, { at: FLAT, sx: wide + 0.1, ease: "in" }] },
      // Trembling harder and harder while it looks at you.
      "h.head": { origin: [0, -30], keys: [...shake(LOOK + 60, GIVE - 200, 0.6, 5, "x"), ...shake(GIVE - 200, GIVE, 1.2, 4, "x").slice(1)] },
      // Eyes: up at the pile → > < → straight at you → squashed shut.
      "h.face": { origin: [0, -30], keys: [{ at: 0, y: -2.2 }, { at: LAND - 60, y: -2.2 }, { at: LAND, y: 0, ease: "out" }] },
      "h.eyes": { origin: [0, -33], keys: [{ at: 0, o: 1 }, { at: LAND, o: 0, ease: "step" }, { at: LOOK, o: 1, ease: "step" }, { at: FLAT - 40, o: 0, ease: "step" }] },
      "h.eyesSquint": { keys: [{ at: 0, o: 0 }, { at: LAND, o: 1, ease: "step" }, { at: LOOK, o: 0, ease: "step" }, { at: FLAT - 40, o: 1, ease: "step" }] },
      "h.mouthSmile": { keys: hideBetween(LAND) },
      "h.mouthWobble": { keys: [{ at: 0, o: 0 }, { at: LAND, o: 1, ease: "step" }, { at: LOOK, o: 0, ease: "step" }, { at: FLAT - 40, o: 1, ease: "step" }] },
      "h.mouthFlat": { keys: showBetween(LOOK, FLAT - 40) },
      "h.sweat": { keys: [{ at: 0, y: 0, o: 0 }, { at: LOOK, y: 0, o: 0, ease: "step" }, { at: LOOK + 10, o: 1, ease: "step" }, { at: GIVE, y: 5, ease: "in" }, { at: GIVE + 10, o: 0, ease: "step" }] },
      // Little paws flail when the pile lands; one gives a tiny twitch at the very end.
      "h.armL": { origin: [-11, -16], keys: shake(LAND, LAND + 600, 28, 6, "rot") },
      "h.armR": { origin: [11, -16], keys: [...shake(LAND, LAND + 600, -28, 6, "rot"), { at: 2150, rot: 0 }, { at: 2230, rot: -35 }, { at: 2320, rot: 0 }] },
    };
  },
};
