import { blink, hideBetween, shake, showBetween } from "@/lib/story/timeline";
import { Dog } from "../characters";
import { GROUND, Heart, Shadow, type SceneArt } from "../kit";

// The shiba sits under a light bulb (its brilliant idea, or its last one). The bulb
// flickers twice and goes out. The dog's eyes droop (half, then closed, content) and it
// melts: it flops down onto its belly with its paws sprawled and ears out, tail wagging,
// a little heart floats up. Brain has logged off, and it's fine with it.

const DX = 74;
const SCALE = 1.6;
const LINE = "#5b4636";
const OFF = 760; // the bulb goes out for good (after two flickers)
const MELT = 1000; // the flop

/** A light bulb centered on (x, y). Two layers: lit (glow + rays) and grey (off). */
function Bulb({ x, y }: { x: number; y: number }) {
  const body = (fill: string) => (
    <>
      <rect x={-4.5} y={6} width={9} height={4} rx={1.2} fill="#b9bfcc" stroke={LINE} strokeWidth={1.4} />
      <rect x={-4} y={10} width={8} height={5} rx={1.5} fill="#9aa3b5" stroke={LINE} strokeWidth={1.4} />
      <circle cx={0} cy={-3} r={10} fill={fill} stroke={LINE} strokeWidth={2} />
    </>
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      <g data-part="bulbOn">
        <circle cx={0} cy={-3} r={17} fill="#fff3b0" opacity={0.75} />
        <path d="M0 -26 v-3 M-14 -17 l-2.4 -2.4 M14 -17 l2.4 -2.4 M-19 -3 h-3.4 M19 -3 h3.4" stroke="#f5b942" strokeWidth={1.8} strokeLinecap="round" />
        {body("#ffe27a")}
      </g>
      <g data-part="bulbOff">{body("#dfe4ee")}</g>
    </g>
  );
}

export const brainLogoff: SceneArt = {
  id: "brain_logoff",
  draw: () => (
    <>
      <Shadow part="shadow" x={DX} w={38} />
      <g data-part="thought">
        <circle cx={128} cy={78} r={2.6} fill="#ffffff" stroke="#b9bfcc" strokeWidth={1.2} />
        <circle cx={134} cy={62} r={3.6} fill="#ffffff" stroke="#b9bfcc" strokeWidth={1.2} />
      </g>
      <Bulb x={142} y={38} />
      <Dog id="d" x={DX} y={GROUND} scale={SCALE} />
      <g data-part="heart">
        <Heart x={118} y={92} size={13} />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    // Bigger intensity: a deeper, wider melt.
    const squash = [0.72, 0.66, 0.6][intensity - 1];
    const wide = [1.13, 1.17, 1.21][intensity - 1];
    return {
      // Flicker, flicker, then out.
      bulbOn: {
        keys: [
          { at: 0, o: 1 },
          { at: 520, o: 0, ease: "step" },
          { at: 560, o: 1, ease: "step" },
          { at: 600, o: 0, ease: "step" },
          { at: 640, o: 1, ease: "step" },
          { at: OFF, o: 0, ease: "step" },
        ],
      },
      bulbOff: {
        keys: [
          { at: 0, o: 0 },
          { at: 520, o: 1, ease: "step" },
          { at: 560, o: 0, ease: "step" },
          { at: 600, o: 1, ease: "step" },
          { at: 640, o: 0, ease: "step" },
          { at: OFF, o: 1, ease: "step" },
        ],
      },
      thought: { keys: hideBetween(OFF + 60) },
      // Looks up at the bulb, then the eyes droop: half, then closed and content.
      "d.face": { origin: [0, -50], keys: [{ at: 0, y: -1.6 }, { at: 700, y: -1.6 }, { at: 790, y: 0, ease: "out" }] },
      "d.eyes": { origin: [0, -53], keys: [...blink(330, 150), ...hideBetween(720).slice(1)] },
      "d.eyesHalf": { keys: showBetween(720, 820) },
      "d.eyesClosed": { keys: showBetween(820) },
      "d.head": {
        origin: [0, -30],
        keys: [
          { at: 0, rot: 0 },
          { at: 700, rot: -4, ease: "out" },
          { at: MELT, rot: -4 },
          { at: MELT + 20, rot: 10, ease: "in" },
          { at: MELT + 180, rot: 4, ease: "inOut" },
        ],
      },
      // The melt: a fast flop down onto the belly, then a little rebound and settle.
      d: {
        origin: [0, 0],
        keys: [
          { at: MELT, sx: 1, sy: 1 },
          { at: MELT + 90, sx: wide, sy: squash, ease: "in" },
          { at: MELT + 190, sx: wide - 0.03, sy: squash + 0.05, ease: "out" },
          { at: MELT + 290, sx: wide, sy: squash, ease: "inOut" },
          { at: 2100, sx: wide, sy: squash },
        ],
      },
      "d.earL": { origin: [-14, -70], keys: [{ at: MELT, rot: 0 }, { at: MELT + 120, rot: -26, ease: "out" }] },
      "d.earR": { origin: [14, -70], keys: [{ at: MELT, rot: 0 }, { at: MELT + 120, rot: 26, ease: "out" }] },
      "d.armL": { origin: [-8, -20], keys: [{ at: MELT, rot: 0 }, { at: MELT + 120, rot: 52, ease: "out" }] },
      "d.armR": { origin: [8, -20], keys: [{ at: MELT, rot: 0 }, { at: MELT + 120, rot: -52, ease: "out" }] },
      // Lazy, happy tail wag once it's down.
      "d.tail": { origin: [15, -12], keys: shake(MELT + 300, 2100, 12, 5, "rot") },
      heart: {
        origin: [118, 92],
        keys: [
          { at: 0, sx: 0, sy: 0, o: 0 },
          { at: MELT + 220, sx: 0, sy: 0, o: 0, ease: "step" },
          { at: MELT + 230, o: 1, ease: "step" },
          { at: MELT + 380, sx: 1, sy: 1, ease: "back" },
          { at: 2100, y: -8, ease: "inOut" },
        ],
      },
      shadow: {
        origin: [DX, GROUND],
        keys: [
          { at: MELT, sx: 1 },
          { at: MELT + 90, sx: wide + 0.05, ease: "in" },
          { at: MELT + 290, sx: wide, ease: "inOut" },
        ],
      },
    };
  },
};
