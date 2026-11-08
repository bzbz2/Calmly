import { blink, hideBetween, showBetween } from "@/lib/story/timeline";
import { Cat } from "../characters";
import { Backdrop, GROUND, Question, Shadow, SoapBubble, Spark, type SceneArt } from "../kit";

// Safe fallback when the feeling is unclear. A soap bubble drifts in; the cat
// watches it all the way to its nose → pop! → it jumps, fur puffed, eyes wide →
// lands, looks left, looks right: where did it go? → tilts its head, a big "?". Surprised, curious, no judgement either way.

const CX = 90;
const SCALE = 1.5;
const NOSE: [number, number] = [CX + 2, GROUND - 49 * SCALE];
const POP = 680;
/** Where the bubble lands: resting on the tip of its nose, below the eyes. */
const BUB: [number, number] = [NOSE[0] + 4, NOSE[1] + 12];

export const neutralSurprise: SceneArt = {
  id: "neutral_surprise",
  draw: () => (
    <>
      <Backdrop id="neutral_surprise" tone="lilac" />
      <Shadow part="shadow" x={CX} w={36} />
      <Cat id="c" x={CX} y={GROUND} scale={SCALE} />
      <g data-part="soap">
        <SoapBubble x={BUB[0]} y={BUB[1]} r={19} />
      </g>
      <g data-part="pop">
        <Spark x={BUB[0]} y={BUB[1]} color="#4f9ad6" />
      </g>
      <g data-part="q">
        <g transform={`translate(${CX + 54} 40) scale(1.8)`}><Question x={0} y={0} /></g>
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const hop = [12, 16, 20][intensity - 1];
    const puff = [1.08, 1.12, 1.16][intensity - 1];
    return {
      // Drifts in on a lazy wave and lands on its nose.
      soap: {
        origin: BUB,
        keys: [
          { at: 0, x: 78, y: -76, o: 0 },
          { at: 120, x: 70, y: -70, o: 1 },
          { at: 300, x: 46, y: -44 },
          { at: 470, x: 22, y: -30 },
          { at: POP - 60, x: 0, y: 0, ease: "out" },
          // Wobbles on the nose for a beat, then pops.
          { at: POP - 30, sx: 1.08, sy: 0.92 },
          { at: POP - 10, sx: 1, sy: 1 },
          { at: POP, sx: 1.4, sy: 1.4, o: 0, ease: "out" },
        ],
      },
      pop: {
        origin: BUB,
        keys: [
          { at: 0, sx: 0.8, sy: 0.8, o: 0 },
          { at: POP, o: 0, ease: "step" },
          { at: POP + 10, o: 1, ease: "step" },
          { at: POP + 120, sx: 2.2, sy: 2.2, o: 1, ease: "out" },
          { at: POP + 260, sx: 2.6, sy: 2.6, o: 0, ease: "out" },
        ],
      },
      // Eyes follow the bubble in, then the look-around.
      "c.face": {
        origin: [0, -50],
        keys: [
          { at: 0, x: 6, y: -2, sx: 0.9 },
          { at: 450, x: 3, y: -1, sx: 0.95 },
          { at: POP - 40, x: 0, y: 0.5, sx: 1 },
          { at: 1300, x: 0, y: 0, sx: 1 },
          { at: 1400, x: -6, sx: 0.9, ease: "out" },
          { at: 1500, x: -6 },
          { at: 1600, x: 6, ease: "inOut" },
          { at: 1680, x: 6 },
          { at: 1760, x: 0, sx: 1, ease: "out" },
        ],
      },
      // The jump: straight up, stretched, then a squashy landing.
      c: {
        origin: [0, 0],
        keys: [
          { at: POP, y: 0, sx: 1, sy: 1 },
          { at: POP + 100, y: -hop, sx: 0.92, sy: 1.1, ease: "out" },
          { at: POP + 250, y: 0, sx: 1, sy: 1, ease: "in" },
          { at: POP + 320, sx: 1.07, sy: 0.93, ease: "out" },
          { at: POP + 440, sx: 1, sy: 1, ease: "out" },
        ],
      },
      shadow: { origin: [CX, GROUND], keys: [{ at: POP, sx: 1 }, { at: POP + 100, sx: 0.8 }, { at: POP + 250, sx: 1 }] },
      // Fur puffs up and the tail bristles, then everything settles.
      "c.body": { origin: [0, -18], keys: [{ at: POP, sx: 1, sy: 1 }, { at: POP + 60, sx: puff, sy: puff, ease: "back" }, { at: 1200, sx: puff, sy: puff }, { at: 1400, sx: 1, sy: 1 }] },
      "c.tail": { origin: [15, -6], keys: [{ at: POP, rot: 0, sx: 1, sy: 1 }, { at: POP + 80, rot: -28, sx: 1.15, sy: 1.15, ease: "back" }, { at: 1200, rot: -28 }, { at: 1450, rot: 0, sx: 1, sy: 1 }] },
      "c.earL": { origin: [-14, -72], keys: [{ at: POP, rot: 0 }, { at: POP + 60, rot: -10, ease: "back" }, { at: 1250, rot: -10 }, { at: 1450, rot: 0 }] },
      "c.earR": { origin: [14, -72], keys: [{ at: POP, rot: 0 }, { at: POP + 60, rot: 10, ease: "back" }, { at: 1250, rot: 10 }, { at: 1450, rot: 0 }] },
      "c.eyes": { origin: [0, -53], keys: [...hideBetween(POP, 1250), ...blink(1820, 180)] },
      "c.eyesWide": { keys: showBetween(POP, 1250) },
      "c.mouthSmile": { keys: hideBetween(POP, 1250) },
      "c.mouthO": { keys: showBetween(POP, 1250) },
      // The twist: a slow, puzzled head tilt and a big "?".
      "c.head": { origin: [0, -30], keys: [{ at: 1760, rot: 0 }, { at: 1960, rot: -11, ease: "out" }] },
      q: { origin: [CX + 54, 40], keys: [{ at: 0, sx: 0, sy: 0, o: 0 }, { at: 1800, sx: 0, sy: 0, o: 0, ease: "step" }, { at: 1810, o: 1, ease: "step" }, { at: 1980, sx: 1, sy: 1, ease: "back" }] },
    };
  },
};
