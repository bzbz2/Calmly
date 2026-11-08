import { shake, type Key } from "@/lib/story/timeline";
import { Hamster } from "../characters";
import { GROUND, Shadow, type SceneArt } from "../kit";

// "This is fine." A tall tower of blocks stands right behind the hamster, which smiles at
// you, eyes shut happily. The tower starts to sway… then crashes down all around it,
// blocks bouncing across the floor, dust puffing up. The hamster doesn't move. Same smile.
// The only change: one sweat drop slides down. The tall silhouette becomes a rubble pile.

const HX = 92;
const SCALE = 1.25;
const INK = "#5b4636";
const SWAY = 380; // the tower starts to sway
const CRASH = 900; // the top block goes; the rest follow
const SWEAT = 1450; // the one and only reaction

type Block = { w: number; h: number; fill: string; to: [number, number]; rot: number; delay: number };
// Bottom first. `to` = where its centre lands (scene units), `rot` = how it lands.
const BLOCKS: Block[] = [
  { w: 56, h: 28, fill: "#bcd8f6", to: [154, 170], rot: 8, delay: 260 },
  { w: 50, h: 28, fill: "#ffe08a", to: [34, 170], rot: -10, delay: 210 },
  { w: 46, h: 26, fill: "#bfe9cf", to: [180, 160], rot: 24, delay: 160 },
  { w: 42, h: 26, fill: "#f7bfcc", to: [16, 160], rot: -28, delay: 110 },
  { w: 38, h: 24, fill: "#d9c9ff", to: [150, 140], rot: -14, delay: 60 },
  { w: 34, h: 24, fill: "#ffcf9e", to: [40, 140], rot: 18, delay: 0 },
];
const TX = HX + 22; // just behind and to one side, so it towers over the hamster
const tops: number[] = [];
BLOCKS.reduce((y, b) => (tops.push(y - b.h), y - b.h), GROUND);
const centre = (i: number): [number, number] => [TX, tops[i] + BLOCKS[i].h / 2];

function blockKeys(i: number, lift: number): Key[] {
  const b = BLOCKS[i];
  const [cx, cy] = centre(i);
  const dx = b.to[0] - cx;
  const dy = b.to[1] - cy;
  const t = CRASH + b.delay;
  const fall = 300 + (BLOCKS.length - i) * 18;
  return [
    { at: 0, x: 0, y: 0, rot: 0 },
    { at: t, x: 0, y: 0, rot: 0 },
    // Up and out a little, then down hard, then a bounce on the floor.
    { at: t + fall * 0.3, x: dx * 0.35, y: Math.min(-10, dy * 0.15) - lift, rot: b.rot * 0.6, ease: "out" },
    { at: t + fall, x: dx, y: dy, rot: b.rot, ease: "in" },
    { at: t + fall + 90, y: dy - 6, ease: "out" },
    { at: t + fall + 180, y: dy, ease: "in" },
  ];
}

function Puff({ x }: { x: number }) {
  return (
    <g>
      <circle cx={x - 7} cy={GROUND - 5} r={6} fill="#f1ebe3" stroke={INK} strokeWidth={1.2} />
      <circle cx={x + 2} cy={GROUND - 8} r={8} fill="#f1ebe3" stroke={INK} strokeWidth={1.2} />
      <circle cx={x + 10} cy={GROUND - 4} r={5} fill="#f1ebe3" stroke={INK} strokeWidth={1.2} />
    </g>
  );
}

const puffKeys: Key[] = [
  { at: 0, o: 0, sx: 0.3, sy: 0.3 },
  { at: CRASH + 330, o: 0, sx: 0.3, sy: 0.3, ease: "step" },
  { at: CRASH + 340, o: 1, ease: "step" },
  { at: CRASH + 560, sx: 1.2, sy: 1.2, ease: "out" },
  { at: CRASH + 900, sx: 1.4, sy: 1.4, o: 0, ease: "in" },
];

export const everythingFine: SceneArt = {
  id: "everything_fine",
  draw: () => (
    <>
      <g data-part="tower">
        {BLOCKS.map((b, i) => (
          <g key={i} data-part={`b${i}`}>
            <rect x={TX - b.w / 2} y={tops[i]} width={b.w} height={b.h} rx={3} fill={b.fill} stroke={INK} strokeWidth={2.2} />
            <path d={`M${TX - b.w / 2 + 5} ${tops[i] + 6} h${b.w - 10}`} stroke="#ffffff" strokeWidth={2} strokeOpacity={0.7} strokeLinecap="round" />
          </g>
        ))}
      </g>
      <g data-part="puffL" style={{ opacity: 0 }}>
        <Puff x={34} />
      </g>
      <g data-part="puffR" style={{ opacity: 0 }}>
        <Puff x={166} />
      </g>
      <Shadow x={HX} w={44} />
      <Hamster id="h" x={HX} y={GROUND} scale={SCALE} />
    </>
  ),
  tracks: ({ intensity }) => {
    const amp = [2.5, 4, 5.5][intensity - 1];
    return {
      // Sways harder and harder before it goes.
      tower: { origin: [TX, GROUND], keys: shake(SWAY, CRASH + 40, amp, 4, "rot") },
      ...Object.fromEntries(BLOCKS.map((_, i) => [`b${i}`, { origin: centre(i), keys: blockKeys(i, amp * 3) }])),
      puffL: { origin: [34, GROUND - 4], keys: puffKeys },
      puffR: { origin: [166, GROUND - 4], keys: puffKeys },
      // The face never changes: happy shut eyes and the smile, from start to end.
      "h.eyes": { keys: [{ at: 0, o: 0 }] },
      "h.eyesHappy": { keys: [{ at: 0, o: 1 }] },
      // The one reaction: a single sweat drop that slowly slides down.
      "h.sweat": { keys: [{ at: 0, y: 0, o: 0 }, { at: SWEAT, o: 0, y: 0, ease: "step" }, { at: SWEAT + 10, o: 1, ease: "step" }, { at: 2300, y: 9, ease: "inOut" }] },
      // The floor shakes when the blocks land; the hamster just jiggles with it.
      h: {
        origin: [0, 0],
        keys: [
          { at: CRASH + 300, sx: 1, sy: 1 },
          { at: CRASH + 340, sx: 1.04, sy: 0.96, ease: "out" },
          { at: CRASH + 440, sx: 1, sy: 1, ease: "out" },
          { at: CRASH + 520, sx: 1.03, sy: 0.97, ease: "out" },
          { at: CRASH + 620, sx: 1, sy: 1, ease: "out" },
        ],
      },
    };
  },
};
