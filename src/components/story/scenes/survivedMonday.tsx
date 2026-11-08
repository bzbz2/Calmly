import { hideBetween, shake, showBetween, type Key } from "@/lib/story/timeline";
import { Cat } from "../characters";
import { GROUND, PaperPile, Spark, type SceneArt } from "../kit";

// Before → after. A messy heap of Monday paperwork; one little paw pokes out of it and
// waves weakly → the cat drags itself out, frazzled (dizzy eyes, sweat, a sheet stuck on
// its head) → shakes it all off, the sheet flies away → climbs up to stand ON the pile,
// chest out, and a gold crown drops onto its head with sparkles. Buried → on top.

const CX = 100;
const SCALE = 1.3;
const LINE = "#5b4636";
const PILE = { bottom: 210, n: 11, h: 6, w: 112 };
const PILE_TOP = PILE.bottom - PILE.n * PILE.h; // 144
const HIDDEN_Y = 130; // cat fully hidden behind the pile
const OUT_Y = 34; // frazzled, head and shoulders out
const TOP_Y = -(GROUND - PILE_TOP) + 2; // standing on top of the pile
const PAW = 120; // paw pokes out
const CRAWL = 560; // drags itself out
const SHAKE = 1000; // shakes it all off
const CLIMB = 1220; // climbs on top
const PROUD = 1420; // ^ ^, crown

/** A tiny gold crown; drawn in the cat's head coordinates, base centred on the head top. */
function Crown({ size }: { size: number }) {
  return (
    <g transform={`translate(0 -76) scale(${size})`}>
      <g data-part="crown" style={{ opacity: 0 }}>
        <path d="M-13 -5 L-15 -18 L-7 -11 L0 -20 L7 -11 L15 -18 L13 -5 Z" fill="#ffd34d" stroke={LINE} strokeWidth={1.4} strokeLinejoin="round" />
        <rect x={-13} y={-5} width={26} height={5.5} rx={2} fill="#ffc233" stroke={LINE} strokeWidth={1.4} />
        <circle cx={0} cy={-11} r={1.8} fill="#ff6b8a" stroke={LINE} strokeWidth={0.6} />
      </g>
    </g>
  );
}

/** A sheet of paper stuck on its head, skewed. Cat head coordinates. */
function StuckSheet() {
  return (
    <g data-part="stuck">
      <g transform="translate(-6 -80) rotate(-18)">
        <rect x={-12} y={-8} width={24} height={16} rx={1.5} fill="#ffffff" stroke={LINE} strokeWidth={1.4} />
        <path d="M-8 -3 h14 M-8 1 h14 M-8 5 h8" stroke="#b9a58f" strokeWidth={1.2} strokeLinecap="round" />
      </g>
    </g>
  );
}

/** A torn calendar page reading MON, lying on the heap. */
function MondayPage() {
  return (
    <g transform={`translate(${CX + 30} ${PILE_TOP + 10}) rotate(10)`}>
      <rect x={-15} y={-12} width={30} height={24} rx={2.5} fill="#ffffff" stroke={LINE} strokeWidth={1.6} />
      <rect x={-15} y={-12} width={30} height={8} rx={2.5} fill="#ff9aab" />
      <text x={0} y={7.5} textAnchor="middle" fontSize={9} fontWeight={800} fill={LINE} fontFamily="system-ui, sans-serif">
        MON
      </text>
    </g>
  );
}

function popIn(at: number, size = 1): Key[] {
  return [
    { at: 0, sx: 0.3, sy: 0.3, o: 0 },
    { at, sx: 0.3, sy: 0.3, o: 0, ease: "step" },
    { at: at + 10, o: 1, ease: "step" },
    { at: at + 160, sx: size, sy: size, ease: "back" },
  ];
}

export const survivedMonday: SceneArt = {
  id: "survived_monday",
  draw: ({ intensity }) => (
    <>
      {/* A weak little paw waving from inside the heap. */}
      <g data-part="paw">
        <rect x={CX - 26} y={PILE_TOP - 16} width={11} height={26} rx={5.5} fill="#fffdf8" stroke={LINE} strokeWidth={2} />
        <path d={`M${CX - 23} ${PILE_TOP - 9} v-3 M${CX - 18} ${PILE_TOP - 9} v-3`} stroke={LINE} strokeWidth={1.1} strokeLinecap="round" />
      </g>
      <g data-part="kitty">
        <Cat
          id="c"
          x={CX}
          y={GROUND}
          scale={SCALE}
          top={
            <>
              <StuckSheet />
              <Crown size={[1.15, 1.25, 1.4][intensity - 1]} />
            </>
          }
        />
      </g>
      <PaperPile x={CX} bottom={PILE.bottom} n={PILE.n} w={PILE.w} h={PILE.h} />
      <MondayPage />
      <g data-part="sparkL" style={{ opacity: 0 }}>
        <Spark x={44} y={50} color="#f5b942" />
      </g>
      <g data-part="sparkR" style={{ opacity: 0 }}>
        <Spark x={156} y={50} color="#f5b942" />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const puff = [1.04, 1.07, 1.1][intensity - 1];
    return {
      paw: {
        origin: [CX - 20, PILE_TOP + 10],
        keys: [
          { at: 0, y: 30, rot: 0 },
          { at: PAW, y: 30 },
          { at: PAW + 150, y: 0, ease: "out" },
          ...shake(PAW + 150, CRAWL - 40, 14, 3, "rot").slice(1),
          { at: CRAWL, y: 34, ease: "in" },
        ],
      },
      // Drags itself out, frazzled → climbs on top.
      kitty: {
        keys: [
          { at: 0, y: HIDDEN_Y, rot: 0 },
          { at: CRAWL, y: HIDDEN_Y },
          { at: CRAWL + 260, y: OUT_Y, ease: "out" },
          { at: SHAKE, y: OUT_Y },
          { at: CLIMB, y: OUT_Y + 6, ease: "in" },
          { at: CLIMB + 220, y: TOP_Y - 8, ease: "out" },
          { at: CLIMB + 320, y: TOP_Y, ease: "in" },
        ],
      },
      // The shake: wobble side to side, the stuck sheet flies off.
      c: { origin: [0, -30], keys: shake(SHAKE, SHAKE + 220, 9, 4, "rot") },
      stuck: { origin: [-6, -80], keys: [{ at: 0, x: 0, y: 0, rot: 0, o: 1 }, { at: SHAKE + 120, x: 0, y: 0, rot: 0 }, { at: SHAKE + 420, x: -60, y: -40, rot: -160, o: 0, ease: "out" }] },
      // Frazzled: eyes shut tight, worried mouth, sweat → proud ^ ^.
      "c.eyes": { keys: [{ at: 0, o: 0 }] },
      "c.eyesSquint": { keys: showBetween(0, CLIMB) },
      "c.eyesWide": { keys: showBetween(CLIMB, PROUD) },
      "c.eyesHappy": { keys: showBetween(PROUD) },
      "c.mouthSmile": { keys: [{ at: 0, o: 0 }, { at: PROUD, o: 1, ease: "step" }] },
      "c.mouthWobble": { keys: showBetween(0, PROUD) },
      "c.sweat": { keys: [{ at: 0, o: 1, y: 0 }, { at: SHAKE + 100, y: 4 }, { at: SHAKE + 110, o: 0, ease: "step" }] },
      "c.earL": { origin: [-14, -72], keys: [{ at: 0, rot: -26 }, { at: CLIMB, rot: -26 }, { at: PROUD, rot: 0, ease: "back" }] },
      "c.earR": { origin: [14, -72], keys: [{ at: 0, rot: 20 }, { at: CLIMB, rot: 20 }, { at: PROUD, rot: 0, ease: "back" }] },
      // Chest out, tail up.
      "c.body": { origin: [0, -18], keys: [{ at: PROUD, sx: 1, sy: 1 }, { at: PROUD + 160, sx: puff, sy: puff, ease: "back" }] },
      "c.tail": { origin: [15, -6], keys: [{ at: PROUD, rot: 0 }, { at: PROUD + 160, rot: -32, ease: "back" }] },
      crown: {
        origin: [0, 0],
        keys: [
          { at: 0, y: -26, o: 0 },
          { at: PROUD + 60, o: 0, ease: "step" },
          { at: PROUD + 70, o: 1, ease: "step" },
          { at: PROUD + 300, y: 0, ease: "bounce" },
        ],
      },
      sparkL: { origin: [44, 50], keys: popIn(PROUD + 300, 1.2) },
      sparkR: { origin: [156, 50], keys: popIn(PROUD + 380, 1.2) },
    };
  },
};
