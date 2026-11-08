import { blink, hideBetween, shake, showBetween } from "@/lib/story/timeline";
import { Hamster } from "../characters";
import { Ledge, Spark, type SceneArt } from "../kit";

// Peek-a-boo. An empty ledge → two little paws grab the edge → ears pop up and
// wiggle → the head rises, looking left and right → it spots you: "oh!" → a happy
// ^ ^ smile, a little hop and sparkles → it sways happily, still peeking.

const HX = 100;
const SCALE = 1.7;
const BASE = 152; // feet line when fully peeking (behind the ledge)
const LEDGE = 130;
const HIDDEN = 96; // extra drop that hides it completely
const EARS = 70; // drop that shows only the ears

export const peekHello: SceneArt = {
  id: "peek_hello",
  draw: () => (
    <>
      <g data-part="rise">
        <Hamster id="h" x={HX} y={BASE} scale={SCALE} />
      </g>
      <Ledge y={LEDGE} />
      {[-1, 1].map((s) => (
        <g key={s} data-part={s < 0 ? "pawL" : "pawR"}>
          <ellipse cx={HX + 20 * s} cy={LEDGE + 1} rx={7.5} ry={5} fill="#ffc4b4" stroke="#5b4636" strokeWidth={2} />
          <path d={`M${HX + 20 * s - 3} ${LEDGE - 1} v4 M${HX + 20 * s + 3} ${LEDGE - 1} v4`} stroke="#5b4636" strokeWidth={1.2} strokeLinecap="round" />
        </g>
      ))}
      <g data-part="sparkL">
        <Spark x={44} y={78} color="#f5b942" />
      </g>
      <g data-part="sparkR">
        <Spark x={156} y={78} color="#f5b942" />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const hop = [5, 8, 11][intensity - 1];
    const sway = [3, 4.5, 6][intensity - 1];
    const paw = (at: number) => [{ at: 0, y: 8, o: 0 }, { at, y: 8, o: 0, ease: "step" as const }, { at: at + 10, o: 1, ease: "step" as const }, { at: at + 140, y: 0, ease: "back" as const }];
    const spark = [{ at: 0, sx: 0.3, sy: 0.3, o: 0 }, { at: 1600, sx: 0.3, sy: 0.3, o: 0, ease: "step" as const }, { at: 1610, o: 1, ease: "step" as const }, { at: 1800, sx: 1.2, sy: 1.2, ease: "back" as const }, { at: 2100, sx: 1, sy: 1, o: 1 }, { at: 2400, o: 0.6 }];
    return {
      // Its own chin paws stay hidden: the paws on the ledge are its hands.
      "h.armL": { keys: [{ at: 0, o: 0 }] },
      "h.armR": { keys: [{ at: 0, o: 0 }] },
      pawL: { origin: [HX - 20, LEDGE], keys: paw(300) },
      pawR: { origin: [HX + 20, LEDGE], keys: [...paw(430), ...shake(1750, 2450, -2, 5, "rot").slice(1)] },
      rise: {
        keys: [
          { at: 0, y: HIDDEN },
          { at: 520, y: HIDDEN },
          { at: 680, y: EARS, ease: "back" },
          { at: 950, y: EARS },
          { at: 1200, y: 0, ease: "back" },
          { at: 1600, y: 0 },
          { at: 1700, y: -hop, ease: "out" },
          { at: 1820, y: 0, ease: "in" },
        ],
      },
      "h.earL": { origin: [-21, -55], keys: shake(700, 950, -14, 3, "rot") },
      "h.earR": { origin: [21, -55], keys: shake(720, 950, 14, 3, "rot") },
      // Looks left, right… then at you.
      "h.face": { origin: [0, -30], keys: [{ at: 1200, x: 0, sx: 1 }, { at: 1280, x: -5, sx: 0.92 }, { at: 1360, x: -5 }, { at: 1440, x: 5, ease: "inOut" }, { at: 1500, x: 5 }, { at: 1560, x: 0, sx: 1, ease: "out" }] },
      "h.eyes": { origin: [0, -33], keys: [...blink(1000, 160), ...hideBetween(1620).slice(1)] },
      "h.eyesHappy": { keys: showBetween(1620) },
      "h.mouthSmile": { keys: hideBetween(1520, 1640) },
      "h.mouthO": { keys: showBetween(1520, 1640) },
      // Happy sway to the end.
      h: { origin: [0, 0], keys: shake(1820, 2500, sway, 3, "rot") },
      sparkL: { origin: [44, 78], keys: spark },
      sparkR: { origin: [156, 78], keys: spark },
    };
  },
};
