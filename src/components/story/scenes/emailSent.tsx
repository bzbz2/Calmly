import { blink, hideBetween, shake, showBetween, type Key } from "@/lib/story/timeline";
import { Dog } from "../characters";
import { GROUND, Shadow, Spark, type SceneArt } from "../kit";

// The email you've been dreading. The shiba hovers a trembling paw over a big SEND
// button, sweating → finally presses it; a big blue paper plane zooms off and away →
// a huge sigh of relief puffs out, eyes shut, and the whole dog melts into a happy,
// floppy puddle on the floor. Sitting tense → melted flat: relief you can see.

const DX = 70;
const SCALE = 1.6;
const LINE = "#5b4636";
const BTN: [number, number] = [146, 150];
const HOVER = 150; // paw comes up, trembling
const PRESS = 800; // finally
const SIGH = 1120; // the big exhale
const MELT = 1250; // melts
const FLAT = 1600;

/** A paper plane pointing right, centred on (x, y). */
function Plane({ x, y, s = 1, fill = "#ffffff" }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 -6 L10 0 L-9 6 L-5 0 Z" fill={fill} stroke={LINE} strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M-5 0 L10 0" stroke={LINE} strokeWidth={0.9} />
    </g>
  );
}

function SighPuff() {
  return (
    <g>
      <circle cx={0} cy={0} r={7} fill="#ffffff" stroke={LINE} strokeWidth={1.5} />
      <circle cx={-9} cy={3} r={5} fill="#ffffff" stroke={LINE} strokeWidth={1.5} />
      <circle cx={-16} cy={1} r={3.4} fill="#ffffff" stroke={LINE} strokeWidth={1.4} />
    </g>
  );
}

function popIn(at: number, size = 1): Key[] {
  return [
    { at: 0, sx: 0.3, sy: 0.3, o: 0 },
    { at, sx: 0.3, sy: 0.3, o: 0, ease: "step" },
    { at: at + 10, o: 1, ease: "step" },
    { at: at + 180, sx: size, sy: size, ease: "back" },
  ];
}

export const emailSent: SceneArt = {
  id: "email_sent",
  draw: () => (
    <>
      <Shadow part="shadow" x={DX} w={38} />
      {/* The SEND button on a little stand. */}
      <rect x={BTN[0] - 9} y={BTN[1] + 14} width={18} height={GROUND - BTN[1] - 14} rx={3} fill="#d9dfea" stroke={LINE} strokeWidth={2.2} />
      <g data-part="button">
        <ellipse cx={BTN[0]} cy={BTN[1] + 12} rx={24} ry={6} fill="#5aa7de" stroke={LINE} strokeWidth={2.2} />
        <ellipse cx={BTN[0]} cy={BTN[1]} rx={24} ry={13} fill="#8fd0ff" stroke={LINE} strokeWidth={2.4} />
        <Plane x={BTN[0]} y={BTN[1] - 1} s={1.2} />
      </g>
      <g data-part="ring" style={{ opacity: 0 }}>
        <ellipse cx={BTN[0]} cy={BTN[1]} rx={24} ry={13} fill="none" stroke="#5aa7de" strokeWidth={2.4} />
      </g>
      <Dog id="d" x={DX} y={GROUND} scale={SCALE} />
      <g data-part="sigh" style={{ opacity: 0 }}>
        <g transform={`translate(${DX + 4} ${GROUND - 64})`}>
          <SighPuff />
        </g>
      </g>
      <g data-part="trail" style={{ opacity: 0 }}>
        <path d={`M${BTN[0]} ${BTN[1] - 14} Q${BTN[0] + 10} 80 186 26`} fill="none" stroke="#5aa7de" strokeWidth={2.4} strokeDasharray="1 6" strokeLinecap="round" />
      </g>
      <g data-part="plane" style={{ opacity: 0 }}>
        <Plane x={BTN[0]} y={BTN[1] - 14} s={2.4} fill="#cfeaff" />
      </g>
      <g data-part="sparkL" style={{ opacity: 0 }}>
        <Spark x={26} y={110} color="#f5b942" />
      </g>
      <g data-part="sparkR" style={{ opacity: 0 }}>
        <Spark x={128} y={104} color="#f5b942" />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const melt = [0.66, 0.6, 0.54][intensity - 1];
    const wide = [1.28, 1.34, 1.4][intensity - 1];
    return {
      // Leans in to press, then melts.
      d: {
        origin: [0, 0],
        keys: [
          { at: 0, x: 0, sx: 1, sy: 1 },
          { at: HOVER, x: 4, ease: "out" },
          { at: PRESS - 60, x: 4 },
          { at: PRESS, x: 12, ease: "in" }, // lunge onto the button
          { at: PRESS + 160, x: 12 },
          { at: MELT, x: 2, sx: 1, sy: 1, ease: "out" },
          { at: FLAT, sx: wide, sy: melt, ease: "inOut" },
          { at: FLAT + 90, sx: wide - 0.05, sy: melt + 0.05, ease: "out" },
          { at: FLAT + 200, sx: wide, sy: melt, ease: "inOut" },
        ],
      },
      // The paw hovers, trembling, then presses down, then flops.
      "d.armR": {
        origin: [8, -20],
        keys: [
          { at: 0, rot: 0 },
          { at: HOVER + 150, rot: -80, ease: "out" },
          ...shake(HOVER + 200, PRESS - 60, 6, 6, "rot").slice(1).map((k) => ({ ...k, rot: -80 + (k.rot ?? 0) })),
          { at: PRESS, rot: -96, ease: "in" },
          { at: PRESS + 160, rot: -96 },
          { at: MELT, rot: 0, ease: "inOut" },
        ],
      },
      "d.face": { origin: [0, -50], keys: [{ at: 0, x: 0 }, { at: HOVER, x: 4, sx: 0.94, ease: "out" }, { at: SIGH, x: 0, sx: 1, ease: "out" }] },
      // Nervous (sweat, worried mouth) → O on the sigh → ^ ^ melted bliss.
      "d.eyes": { origin: [0, -53], keys: [...blink(560, 150), ...hideBetween(SIGH).slice(1)] },
      "d.eyesHappy": { keys: showBetween(SIGH) },
      "d.mouthSmile": { keys: [{ at: 0, o: 0 }, { at: MELT + 150, o: 1, ease: "step" }] },
      "d.mouthWobble": { keys: showBetween(0, SIGH) },
      "d.mouthO": { keys: showBetween(SIGH, MELT + 150) },
      "d.sweat": { keys: [{ at: 0, o: 0, y: 0 }, { at: HOVER + 200, o: 0, ease: "step" }, { at: HOVER + 210, o: 1, ease: "step" }, { at: PRESS, y: 5, ease: "in" }, { at: PRESS + 10, o: 0, ease: "step" }] },
      "d.earL": { origin: [-14, -70], keys: [{ at: MELT, rot: 0 }, { at: FLAT, rot: -50, ease: "inOut" }] },
      "d.earR": { origin: [14, -70], keys: [{ at: MELT, rot: 0 }, { at: FLAT, rot: 50, ease: "inOut" }] },
      "d.tail": { origin: [15, -12], keys: shake(FLAT + 100, 2300, 14, 4, "rot") },
      shadow: { origin: [DX, GROUND], keys: [{ at: MELT, sx: 1 }, { at: FLAT, sx: wide + 0.1, ease: "inOut" }] },
      button: { keys: [{ at: PRESS - 30, y: 0 }, { at: PRESS, y: 6, ease: "in" }, { at: PRESS + 160, y: 6 }, { at: PRESS + 260, y: 0, ease: "back" }] },
      ring: {
        origin: BTN,
        keys: [
          { at: 0, sx: 1, sy: 1, o: 0 },
          { at: PRESS, o: 0, ease: "step" },
          { at: PRESS + 10, o: 1, ease: "step" },
          { at: PRESS + 300, sx: 2.2, sy: 2.2, o: 0, ease: "out" },
        ],
      },
      trail: { keys: [{ at: 0, o: 0 }, { at: PRESS + 40, o: 0, ease: "step" }, { at: PRESS + 50, o: 1, ease: "step" }, { at: 1500, o: 1 }, { at: 1800, o: 0 }] },
      // A big plane zooms off, up and away.
      plane: {
        origin: [BTN[0], BTN[1] - 14],
        keys: [
          { at: 0, x: 0, y: 0, rot: -40, o: 0, sx: 0.6, sy: 0.6 },
          { at: PRESS + 40, o: 0, ease: "step" },
          { at: PRESS + 50, o: 1, ease: "step" },
          { at: PRESS + 200, x: 10, y: -50, sx: 1, sy: 1, rot: -55, ease: "out" },
          { at: PRESS + 480, x: 40, y: -124, rot: -40, ease: "in" },
          { at: PRESS + 500, o: 0, ease: "step" },
        ],
      },
      // The big sigh drifts out and fades.
      sigh: {
        origin: [DX + 4, GROUND - 64],
        keys: [
          { at: 0, o: 0, sx: 0.3, sy: 0.3, x: 0, y: 0 },
          { at: SIGH, o: 0, ease: "step" },
          { at: SIGH + 10, o: 1, ease: "step" },
          { at: SIGH + 250, sx: 1.4, sy: 1.4, x: -24, y: -14, ease: "out" },
          { at: SIGH + 650, sx: 1.7, sy: 1.7, x: -34, y: -30, o: 0, ease: "in" },
        ],
      },
      sparkL: { origin: [26, 110], keys: popIn(FLAT + 60, 1.2) },
      sparkR: { origin: [128, 104], keys: popIn(FLAT + 160, 1.2) },
    };
  },
};
