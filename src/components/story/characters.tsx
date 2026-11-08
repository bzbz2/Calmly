// The four story characters, hand-drawn in SVG (no external art). Japanese "kawaii"
// proportions: a big round head, a tiny body, small eyes set low and wide apart with
// sparkle highlights, hatched blush and a soft brown outline, so they read at 120px.
// Each is drawn around its own origin: (0, 0) is the middle of the ground under its
// feet; up is negative y.
//
// Every movable piece is a <g data-part="<id>.<piece>">, animated by the timeline
// engine. Shared pieces: root, body, head, face, earL, earR, eyes, eyesClosed, eyesHappy,
// eyesWide, eyesHalf, eyesSquint, mouthSmile, mouthFlat, mouthO, mouthFrown,
// mouthWobble, armL, armR, sweat, and tail (cat, dog). `face` holds the eyes, nose,
// mouth and blush: shift it sideways (x + a little sx squeeze) to turn the head.
// Alternative eyes/mouths and the sweat drop start hidden (opacity 0) except the
// defaults (eyes, mouthSmile); scenes swap them with showBetween/hideBetween.

import type { ReactNode } from "react";

const LINE = "#5b4636";
const INK = "#2e2420";
const BLUSH = "#ffaaa8";
const line = { stroke: LINE, strokeWidth: 2.3, strokeLinejoin: "round" as const };

type CharProps = {
  id: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  /** Drawn in front of the body, behind the arms (things the character holds). */
  hold?: ReactNode;
  /** Drawn on top of everything, inside the root (things on the head, etc). */
  top?: ReactNode;
};

const P = (id: string, piece?: string) => (piece ? `${id}.${piece}` : id);
const hidden = { opacity: 0 } as const;

function Place({ x, y, scale = 1, flip, children }: { x: number; y: number; scale?: number; flip?: boolean; children: ReactNode }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>{children}</g>;
}

/** Eye variants shared by all characters. `cx` = distance of each eye from center. */
function Eyes({ id, cx, cy, r = 3.4 }: { id: string; cx: number; cy: number; r?: number }) {
  const lid = { stroke: INK, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <>
      <g data-part={P(id, "eyes")}>
        {[-cx, cx].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={cy} rx={r * 0.82} ry={r} fill={INK} />
            <circle cx={x + r * 0.28} cy={cy - r * 0.38} r={r * 0.36} fill="#fff" />
            <circle cx={x - r * 0.3} cy={cy + r * 0.42} r={r * 0.16} fill="#fff" />
          </g>
        ))}
      </g>
      {/* Closed, soft arcs (sleepy, fainted, content). */}
      <g data-part={P(id, "eyesClosed")} style={hidden} {...lid}>
        {[-cx, cx].map((x) => (
          <path key={x} d={`M${x - r} ${cy - r * 0.2} q${r} ${r * 1.1} ${r * 2} 0`} />
        ))}
      </g>
      {/* Happy, smiling ^ ^. */}
      <g data-part={P(id, "eyesHappy")} style={hidden} {...lid}>
        {[-cx, cx].map((x) => (
          <path key={x} d={`M${x - r} ${cy + r * 0.4} q${r} ${-r * 1.5} ${r * 2} 0`} />
        ))}
      </g>
      {/* Shocked: big whites, tiny pupils. */}
      <g data-part={P(id, "eyesWide")} style={hidden}>
        {[-cx, cx].map((x) => (
          <g key={x}>
            <circle cx={x} cy={cy} r={r * 1.45} fill="#fff" stroke={INK} strokeWidth={1.3} />
            <circle cx={x} cy={cy} r={r * 0.55} fill={INK} />
          </g>
        ))}
      </g>
      {/* Half-closed, unimpressed. */}
      <g data-part={P(id, "eyesHalf")} style={hidden}>
        {[-cx, cx].map((x) => (
          <g key={x}>
            <path d={`M${x - r * 1.05} ${cy} a${r * 1.05} ${r * 0.95} 0 0 0 ${r * 2.1} 0 Z`} fill={INK} />
            <path d={`M${x - r * 1.4} ${cy - 0.3} h${r * 2.8}`} stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          </g>
        ))}
      </g>
      {/* > <  squeezed shut. */}
      <g data-part={P(id, "eyesSquint")} style={hidden} {...lid}>
        <path d={`M${-cx - r} ${cy - r} L${-cx + r * 0.7} ${cy} L${-cx - r} ${cy + r}`} />
        <path d={`M${cx + r} ${cy - r} L${cx - r * 0.7} ${cy} L${cx + r} ${cy + r}`} />
      </g>
    </>
  );
}

/** Mouth variants, centered on x = 0. `w` = half width. */
function Mouths({ id, cy, w = 2.4 }: { id: string; cy: number; w?: number }) {
  const s = { stroke: INK, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <>
      {/* ω */}
      <path data-part={P(id, "mouthSmile")} d={`M${-w} ${cy} q${w / 2} ${w * 0.75} ${w} 0 q${w / 2} ${w * 0.75} ${w} 0`} {...s} />
      <path data-part={P(id, "mouthFlat")} d={`M${-w * 0.8} ${cy + 0.6} h${w * 1.6}`} {...s} style={hidden} />
      <ellipse data-part={P(id, "mouthO")} cx={0} cy={cy + 1.2} rx={w * 0.55} ry={w * 0.75} fill={INK} style={hidden} />
      <path data-part={P(id, "mouthFrown")} d={`M${-w * 1.2} ${cy + 2.2} q${w * 1.2} ${-w * 1.3} ${w * 2.4} 0`} {...s} strokeWidth={1.6} style={hidden} />
      {/* Worried: a downturned "m", corners low, so it never reads as a smile. */}
      <path
        data-part={P(id, "mouthWobble")}
        d={`M${-w * 1.4} ${cy + 2.4} Q${-w * 0.7} ${cy - 0.8} 0 ${cy + 0.8} Q${w * 0.7} ${cy - 0.8} ${w * 1.4} ${cy + 2.4}`}
        {...s}
        strokeWidth={1.6}
        style={hidden}
      />
    </>
  );
}

/** Two blush ovals with little hatch marks. */
function Blush({ cx, cy, rx = 5, ry = 3 }: { cx: number; cy: number; rx?: number; ry?: number }) {
  return (
    <>
      {[-cx, cx].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill={BLUSH} opacity={0.75} />
          <path d={`M${x - 2.6} ${cy + 1} l1.3 -2.1 M${x - 0.4} ${cy + 1} l1.3 -2.1 M${x + 1.8} ${cy + 1} l1.3 -2.1`} stroke="#ee7f88" strokeWidth={0.7} strokeLinecap="round" />
        </g>
      ))}
    </>
  );
}

/** A sweat drop by the head, hidden by default. */
function Sweat({ id, x, y }: { id: string; x: number; y: number }) {
  return (
    <g data-part={P(id, "sweat")} style={hidden}>
      <path d={`M${x} ${y} q-3.4 4.8 -3.4 6.8 a3.4 3.4 0 0 0 6.8 0 q0 -2 -3.4 -6.8 Z`} fill="#c8e8ff" stroke="#7fb3e3" strokeWidth={0.9} />
    </g>
  );
}

/** A tail drawn as a soft outlined stroke. */
function Tail({ d, fill }: { d: string; fill: string }) {
  return (
    <>
      <path d={d} stroke={LINE} strokeWidth={9.8} strokeLinecap="round" fill="none" />
      <path d={d} stroke={fill} strokeWidth={5.4} strokeLinecap="round" fill="none" />
    </>
  );
}

/** Round little front paws (cat, dog), tucked in at the bottom of the chest, with toe
 * marks so they read as paws, not legs. Rotate around (±8, -20) to raise one. */
function Legs({ id, fill }: { id: string; fill: string }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <g key={s} data-part={P(id, s < 0 ? "armL" : "armR")}>
          <ellipse cx={7.5 * s} cy={-7} rx={6.6} ry={6} fill={fill} {...line} />
          <path d={`M${7.5 * s - 2} -3.2 v-2.2 M${7.5 * s + 2} -3.2 v-2.2`} stroke={LINE} strokeWidth={1.1} strokeLinecap="round" />
        </g>
      ))}
    </>
  );
}

// ---------------- Hamster ----------------
const HAM = { fur: "#f5ad62", cream: "#fff7ec", ear: "#ffc9c2", foot: "#ffc4b4" };

/** A round mochi hamster, about 72 wide and 64 tall. Its head is its whole body. */
export function Hamster({ id, x, y, scale, flip, hold, top }: CharProps) {
  return (
    <Place x={x} y={y} scale={scale} flip={flip}>
      <g data-part={P(id)}>
        <g data-part={P(id, "body")}>
          {[-1, 1].map((s) => (
            <g key={s} data-part={P(id, s < 0 ? "earL" : "earR")}>
              <circle cx={21 * s} cy={-55} r={8.5} fill={HAM.fur} {...line} />
              <circle cx={21 * s} cy={-55} r={4.6} fill={HAM.ear} />
            </g>
          ))}
          <path d="M-34 -2 C-38 -40 -21 -64 0 -64 C21 -64 38 -40 34 -2 C22 3 -22 3 -34 -2 Z" fill={HAM.cream} {...line} />
          {/* Golden "hood" over the top of the head, with a little peak into the face. */}
          <path d="M-33.6 -30 C-30 -52 -16 -62.6 0 -62.6 C16 -62.6 30 -52 33.6 -30 C24 -37 12 -36 6 -42 C3 -38.6 -3 -38.6 -6 -42 C-12 -36 -24 -37 -33.6 -30 Z" fill={HAM.fur} />
          <g data-part={P(id, "head")}>
            <g data-part={P(id, "face")}>
              <Blush cx={21} cy={-25} rx={5.4} ry={3.2} />
              <Eyes id={id} cx={12.5} cy={-33} r={3.5} />
              <ellipse cx={0} cy={-29} rx={1.8} ry={1.3} fill="#e98a8a" />
              <Mouths id={id} cy={-26.6} w={2.3} />
            </g>
            <Sweat id={id} x={28} y={-54} />
          </g>
        </g>
        {[-1, 1].map((s) => (
          <ellipse key={s} cx={12 * s} cy={-1} rx={5.6} ry={3} fill={HAM.foot} {...line} />
        ))}
        {hold}
        {[-1, 1].map((s) => (
          <g key={s} data-part={P(id, s < 0 ? "armL" : "armR")}>
            {/* Little hands held in front of the tummy. */}
            <ellipse cx={8 * s} cy={-17} rx={5.4} ry={4.4} fill={HAM.foot} stroke={LINE} strokeWidth={1.7} />
            <path d={`M${8 * s - 1.8} -14 v-1.6 M${8 * s + 1.8} -14 v-1.6`} stroke={LINE} strokeWidth={1} strokeLinecap="round" />
          </g>
        ))}
        {top}
      </g>
    </Place>
  );
}

// ---------------- Cat ----------------
const CAT = { fur: "#fffdf8", patch: "#c5cad6", ear: "#ffc6cf" };

/** A sitting white cat with one grey ear, about 64 wide and 92 tall (ears included). */
export function Cat({ id, x, y, scale, flip, hold, top }: CharProps) {
  return (
    <Place x={x} y={y} scale={scale} flip={flip}>
      <g data-part={P(id)}>
        <g data-part={P(id, "tail")}>
          <Tail d="M15 -6 C34 -6 40 -26 30 -38" fill={CAT.patch} />
        </g>
        <g data-part={P(id, "body")}>
          <path d="M-19 -1 C-22 -22 -14 -36 0 -36 C14 -36 22 -22 19 -1 C10 2 -10 2 -19 -1 Z" fill={CAT.fur} {...line} />
        </g>
        {[-1, 1].map((s) => (
          <ellipse key={s} cx={8 * s} cy={-1.2} rx={6} ry={3.4} fill={CAT.fur} {...line} />
        ))}
        <g data-part={P(id, "head")}>
          {[-1, 1].map((s) => (
            <g key={s} data-part={P(id, s < 0 ? "earL" : "earR")}>
              <path d={`M${7 * s} -73 L${19 * s} -92 L${28 * s} -64 Z`} fill={s > 0 ? CAT.patch : CAT.fur} {...line} />
              <path d={`M${12 * s} -73 L${19 * s} -85 L${24 * s} -68 Z`} fill={CAT.ear} />
            </g>
          ))}
          <ellipse cx={0} cy={-54} rx={30} ry={25} fill={CAT.fur} {...line} />
          <path d="M9 -77.6 C20 -77 28 -69 29.6 -58 C22 -60 15 -64 12 -70 C11 -73 10 -75.5 9 -77.6 Z" fill={CAT.patch} />
          <g data-part={P(id, "face")}>
            <Blush cx={19} cy={-45} />
            <Eyes id={id} cx={11.5} cy={-53} r={3.4} />
            <path d="M-1.8 -48.6 h3.6 l-1.8 1.9 Z" fill="#f08c9c" />
            <Mouths id={id} cy={-45.4} w={2.4} />
            <path d="M-24 -50 l-7 -1.5 M-24 -47 l-7 1 M24 -50 l7 -1.5 M24 -47 l7 1" stroke={LINE} strokeWidth={0.9} strokeLinecap="round" />
          </g>
          <Sweat id={id} x={27} y={-70} />
        </g>
        {hold}
        <Legs id={id} fill={CAT.fur} />
        {top}
      </g>
    </Place>
  );
}

// ---------------- Dog ----------------
const DOG = { fur: "#f0a65a", cream: "#fff4e3", ear: "#ffd2bd" };

/** A sitting shiba puppy with a curly tail, about 64 wide and 92 tall. */
export function Dog({ id, x, y, scale, flip, hold, top }: CharProps) {
  return (
    <Place x={x} y={y} scale={scale} flip={flip}>
      <g data-part={P(id)}>
        <g data-part={P(id, "tail")}>
          <Tail d="M15 -12 C30 -10 34 -28 24 -32 C17 -35 13 -27 19 -24" fill={DOG.fur} />
        </g>
        <g data-part={P(id, "body")}>
          <path d="M-19 -1 C-22 -22 -14 -36 0 -36 C14 -36 22 -22 19 -1 C10 2 -10 2 -19 -1 Z" fill={DOG.fur} {...line} />
          <ellipse cx={0} cy={-26} rx={9} ry={7} fill={DOG.cream} />
        </g>
        {[-1, 1].map((s) => (
          <ellipse key={s} cx={8 * s} cy={-1.2} rx={6} ry={3.4} fill={DOG.cream} {...line} />
        ))}
        <g data-part={P(id, "head")}>
          {[-1, 1].map((s) => (
            <g key={s} data-part={P(id, s < 0 ? "earL" : "earR")}>
              <path d={`M${8 * s} -72 L${20 * s} -91 L${29 * s} -62 Z`} fill={DOG.fur} {...line} />
              <path d={`M${13 * s} -72 L${20 * s} -84 L${25 * s} -66 Z`} fill={DOG.ear} />
            </g>
          ))}
          <ellipse cx={0} cy={-54} rx={31} ry={25} fill={DOG.fur} {...line} />
          <g data-part={P(id, "face")}>
            {/* Shiba mask: cream muzzle and cheeks, and the little "maro" eyebrow dots. */}
            <path d="M-22 -44 C-18 -34 -8 -30.4 0 -32 C8 -30.4 18 -34 22 -44 C16 -50 8 -48 0 -42 C-8 -48 -16 -50 -22 -44 Z" fill={DOG.cream} />
            {[-1, 1].map((s) => (
              <ellipse key={s} cx={11 * s} cy={-62.5} rx={3.2} ry={1.3} fill={DOG.cream} opacity={0.7} />
            ))}
            <Blush cx={20} cy={-44} />
            <Eyes id={id} cx={11.5} cy={-53} r={3.4} />
            <ellipse cx={0} cy={-43.6} rx={2.8} ry={2} fill={INK} />
            <Mouths id={id} cy={-40.4} w={2.4} />
          </g>
          <Sweat id={id} x={28} y={-70} />
        </g>
        {hold}
        <Legs id={id} fill={DOG.fur} />
        {top}
      </g>
    </Place>
  );
}

// ---------------- Penguin ----------------
const PEN = { body: "#5f6f99", belly: "#fffdf8", beak: "#ffb35c" };

/** A round little penguin, about 62 wide and 68 tall. */
export function Penguin({ id, x, y, scale, flip, hold, top }: CharProps) {
  return (
    <Place x={x} y={y} scale={scale} flip={flip}>
      <g data-part={P(id)}>
        {[-1, 1].map((s) => (
          <ellipse key={s} cx={9 * s} cy={-1.5} rx={7} ry={3} fill={PEN.beak} {...line} />
        ))}
        <g data-part={P(id, "body")}>
          <ellipse cx={0} cy={-34} rx={27} ry={33} fill={PEN.body} {...line} />
          <ellipse cx={0} cy={-27} rx={19} ry={23} fill={PEN.belly} />
          {[-1, 1].map((s) => (
            <ellipse key={s} cx={8 * s} cy={-42} rx={11} ry={10} fill={PEN.belly} />
          ))}
        </g>
        <g data-part={P(id, "head")}>
          <g data-part={P(id, "face")}>
            <Blush cx={15} cy={-36} rx={4.4} ry={2.6} />
            <Eyes id={id} cx={9} cy={-44} r={3.1} />
            <path d="M-3.8 -39.4 Q0 -41.6 3.8 -39.4 Q0 -33.8 -3.8 -39.4 Z" fill={PEN.beak} stroke={LINE} strokeWidth={1.2} strokeLinejoin="round" />
            <Mouths id={id} cy={-31.6} w={1.8} />
          </g>
          <Sweat id={id} x={22} y={-62} />
        </g>
        {hold}
        {[-1, 1].map((s) => (
          <g key={s} data-part={P(id, s < 0 ? "armL" : "armR")}>
            <path d={`M${25 * s} -46 C${35 * s} -36 ${35 * s} -20 ${27 * s} -14 C${23 * s} -22 ${22 * s} -36 ${25 * s} -46 Z`} fill={PEN.body} {...line} />
          </g>
        ))}
        {top}
      </g>
    </Place>
  );
}

export const CHARACTERS = { hamster: Hamster, cat: Cat, dog: Dog, penguin: Penguin } as const;
export type CharacterKind = keyof typeof CHARACTERS;
