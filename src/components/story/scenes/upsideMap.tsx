import { blink, hideBetween, shake, showBetween, type Key } from "@/lib/story/timeline";
import { Dog } from "../characters";
import { Bang, GROUND, Question, Shadow, type SceneArt } from "../kit";

// The shiba marches in toward you, holding a big map up in front of it, smiling. It
// looks at the map and turns it… and turns it back… and round again, more and more lost
// (sweat, wobbly mouth). Then a "!" — it has an idea: it flips ITSELF upside down and
// does a headstand, beaming, the map now the right way up. Lost, and proud of it.
// "No idea what I'm doing."

const HX = 100;
const SCALE = 1.5;
const LINE = "#5b4636";
const TURN = 650; // starts turning the map
const LOST = 960; // wide eyes, sweat
const IDEA = 1360; // "!"
const FLIP = 1480; // flips itself over
const DOWN = 1820; // standing on its head

/** A big folded-out map held up in front of the chest. Its red north arrow and the house
 *  (roof up) show which way is up. Origin for the turning is its centre, (0, -16). */
function MapSheet() {
  return (
    <g data-part="map">
      <g transform="translate(0 -16) scale(1.3)">
        <rect x={-30} y={-16} width={60} height={32} rx={3} fill="#fff4cf" stroke={LINE} strokeWidth={2.2} />
        <ellipse cx={-17} cy={8} rx={7.5} ry={4.2} fill="#cdeed6" />
        <path d="M-30 -4 C-20 -9 -12 1 0 -3 S 14 -8 30 -3" fill="none" stroke="#8fcaf0" strokeWidth={3.4} strokeLinecap="round" />
        <path d="M-30 10 H30 M8 -16 V16" stroke="#e6d6b6" strokeWidth={2.4} fill="none" />
        <path d="M-24 -11 Q-12 2 0 4 T 12 3" fill="none" stroke="#ff7a93" strokeWidth={1.6} strokeDasharray="2.4 2" strokeLinecap="round" />
        <rect x={-4} y={-3} width={8} height={7} fill="#ffd1a6" stroke={LINE} strokeWidth={1.2} />
        <path d="M-6 -3 L0 -9 L6 -3 Z" fill="#f08c9c" stroke={LINE} strokeWidth={1.2} strokeLinejoin="round" />
        <rect x={-21.5} y={0} width={1.8} height={4} fill="#b98a5e" />
        <circle cx={-20.6} cy={-3} r={4.4} fill="#9ad9a8" stroke={LINE} strokeWidth={1.2} />
        <path d="M23 -15 L29 -6 L25.4 -6 L25.4 1 L20.6 1 L20.6 -6 L17 -6 Z" fill="#e5484d" stroke={LINE} strokeWidth={1} strokeLinejoin="round" />
      </g>
    </g>
  );
}

function popIn(at: number): Key[] {
  return [
    { at: 0, sx: 0, sy: 0, o: 0 },
    { at, sx: 0, sy: 0, o: 0, ease: "step" },
    { at: at + 10, o: 1, ease: "step" },
    { at: at + 150, sx: 1, sy: 1, ease: "back" },
  ];
}

export const upsideMap: SceneArt = {
  id: "upside_map",
  draw: () => (
    <>
      <Shadow part="shadow" x={HX} w={34} />
      <g data-part="walk">
        <Dog id="d" x={HX} y={GROUND} scale={SCALE} top={<MapSheet />} />
      </g>
      <g data-part="bang">
        <Bang x={150} y={38} />
      </g>
      <g data-part="q1">
        <g transform="translate(160 120) scale(1.6)">
          <Question x={0} y={0} />
        </g>
      </g>
      <g data-part="q2">
        <g transform="translate(40 70) scale(1.4)">
          <Question x={0} y={0} />
        </g>
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const swing = [70, 90, 110][intensity - 1];
    return {
      // Walks in from far away: small and bobbing, then close.
      walk: {
        origin: [HX, GROUND],
        keys: [
          { at: 0, x: -26, y: 0, rot: 0, sx: 0.72, sy: 0.72 },
          { at: 150, x: -18, y: -3, rot: -2.5, sx: 0.8, sy: 0.8, ease: "out" },
          { at: 300, x: -10, y: 0, rot: 0, sx: 0.88, sy: 0.88, ease: "out" },
          { at: 450, x: -4, y: -3, rot: 2.5, sx: 0.94, sy: 0.94, ease: "out" },
          { at: 600, x: 0, y: 0, rot: 0, sx: 1, sy: 1, ease: "out" },
        ],
      },
      shadow: {
        origin: [HX, GROUND],
        keys: [
          { at: 0, x: -26, sx: 0.72 },
          { at: 600, x: 0, sx: 1, ease: "out" },
          { at: FLIP, sx: 1 },
          { at: FLIP + 170, sx: 0.75, ease: "out" },
          { at: DOWN, sx: 0.9, ease: "in" },
        ],
      },
      // Turning the map: one way, back, round again, and it ends up upside down.
      map: {
        origin: [0, -16],
        keys: [
          { at: TURN, rot: 0 },
          { at: TURN + 150, rot: swing, ease: "inOut" },
          { at: TURN + 320, rot: -swing * 0.5, ease: "inOut" },
          { at: TURN + 520, rot: 200, ease: "inOut" },
          { at: TURN + 640, rot: 180, ease: "out" },
        ],
      },
      // The head follows the map around.
      "d.head": {
        origin: [0, -30],
        keys: [
          { at: TURN, rot: 0 },
          { at: TURN + 150, rot: 9, ease: "inOut" },
          { at: TURN + 320, rot: -8, ease: "inOut" },
          { at: TURN + 520, rot: 10, ease: "inOut" },
          { at: IDEA, rot: 0, ease: "out" },
        ],
      },
      "d.face": { origin: [0, -50], keys: [{ at: TURN, y: 0 }, { at: TURN + 100, y: 2.5, ease: "out" }, { at: IDEA, y: 0, ease: "out" }] },
      // Happy → lost → idea → proud (^ ^) upside down.
      "d.eyes": { origin: [0, -53], keys: [...blink(400, 150), { at: LOST, o: 1 }, { at: LOST + 1, o: 0, ease: "step" }] },
      "d.eyesWide": { keys: showBetween(LOST, IDEA) },
      "d.eyesHappy": { keys: showBetween(IDEA) },
      "d.mouthSmile": { keys: [{ at: 0, o: 1 }, { at: LOST, o: 0, ease: "step" }, { at: IDEA, o: 1, ease: "step" }] },
      "d.mouthWobble": { keys: showBetween(LOST, IDEA) },
      "d.sweat": { keys: [{ at: 0, o: 0, y: 0 }, { at: LOST + 80, o: 0, ease: "step" }, { at: LOST + 90, o: 1, ease: "step" }, { at: IDEA, y: 5, o: 1, ease: "in" }, { at: IDEA + 10, o: 0, ease: "step" }] },
      "d.tail": { origin: [15, -12], keys: [...shake(0, 600, 12, 4, "rot"), ...shake(DOWN + 60, 2400, 14, 4, "rot").slice(1)] },
      // The flip: a hop, a half turn, and it lands standing on its head.
      d: {
        origin: [0, -46],
        keys: [
          { at: FLIP, rot: 0, y: 0, sx: 1, sy: 1 },
          { at: FLIP + 80, sx: 1.08, sy: 0.9, ease: "out" },
          { at: FLIP + 200, y: -22, rot: 70, sx: 1, sy: 1, ease: "out" },
          { at: DOWN, y: 0, rot: 180, ease: "in" },
          { at: DOWN + 60, sx: 1.06, sy: 0.92, ease: "out" },
          { at: DOWN + 180, sx: 1, sy: 1, ease: "out" },
        ],
      },
      bang: { origin: [150, 38], keys: [...popIn(IDEA), { at: IDEA + 300, o: 0, ease: "in" }] },
      q1: { origin: [160, 120], keys: popIn(LOST + 120).concat([{ at: IDEA, o: 0, ease: "step" }]) },
      q2: { origin: [40, 70], keys: intensity >= 2 ? popIn(LOST + 240).concat([{ at: IDEA, o: 0, ease: "step" }]) : [{ at: 0, o: 0 }] },
    };
  },
};
