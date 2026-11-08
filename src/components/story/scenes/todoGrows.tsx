import { hideBetween, shake, showBetween } from "@/lib/story/timeline";
import { Hamster } from "../characters";
import { GROUND, Shadow, type SceneArt } from "../kit";

// The to-do list that never ends. A big to-do list drops in beside the hamster and
// unrolls, row after row of checkboxes, down to the floor, then keeps running along the
// floor and out of the frame; a red "47" badge pops on it. Eyes go wide, then
// unimpressed → it slowly squashes into a ball, eyes shut, and an empty thought bubble
// pops up. Too many tasks, brain empty.

const HX = 70;
const SCALE = 1.5;
const INK = "#5b4636";
const UNROLL = 300; // the list starts to unroll
const FLOOR = 950; // its end reaches the floor and runs along it
const LOOK = 420; // eyes go wide: "how long is this?"
const BADGE = 1250; // the "47" badge pops
const WOBBLE = 1100; // mouth trembles
const SHUT = 1450; // eyes close, the curl starts
const BALL = 1600; // curled up, then it holds to the end

const L = { x: 114, top: 70, w: 40 }; // the list, in scene units
const ROWS = Array.from({ length: 9 }, (_, i) => L.top + 14 + i * 11);

function Box({ x, y, done }: { x: number; y: number; done?: boolean }) {
  return (
    <>
      <rect x={x} y={y - 3.2} width={6.4} height={6.4} rx={1.2} fill="#fff" stroke={INK} strokeWidth={1.2} />
      {done && <path d={`M${x + 1.2} ${y} l1.8 2 l3.4 -4.2`} stroke="#3fa66b" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </>
  );
}

/** A tall to-do list: a rolled top, the hanging sheet, and a strip running along the floor. */
function TodoList() {
  return (
    <g data-part="list">
      <g data-part="paper">
        <rect x={L.x} y={L.top} width={L.w} height={GROUND - L.top - 4} rx={1.5} fill="#fffdf6" stroke={INK} strokeWidth={1.8} />
        {ROWS.map((y, i) => (
          <g key={y}>
            <Box x={L.x + 5} y={y} done={i < 2} />
            <path d={`M${L.x + 15} ${y} h${i % 3 === 1 ? 14 : 20}`} stroke="#b9a58f" strokeWidth={1.8} strokeLinecap="round" />
          </g>
        ))}
      </g>
      <g data-part="strip">
        <rect x={L.x} y={GROUND - 9} width={110} height={9} rx={1.5} fill="#fffdf6" stroke={INK} strokeWidth={1.8} />
        {[L.x + 46, L.x + 66, L.x + 86, L.x + 106].map((x) => (
          <Box key={x} x={x} y={GROUND - 4.5} />
        ))}
      </g>
      <rect x={L.x - 5} y={L.top - 7} width={L.w + 10} height={11} rx={5.5} fill="#fff1d6" stroke={INK} strokeWidth={1.8} />
      <g data-part="badge">
        <circle cx={L.x + L.w + 4} cy={L.top - 8} r={10} fill="#ff6b6b" stroke={INK} strokeWidth={1.6} />
        <text x={L.x + L.w + 4} y={L.top - 4.4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">
          47
        </text>
      </g>
    </g>
  );
}

/** An empty thought bubble above the head: three dots and nothing else. */
function EmptyThought() {
  return (
    <g>
      <circle cx={70} cy={82} r={2.6} fill="#fff" stroke={INK} strokeWidth={1.4} />
      <circle cx={64} cy={74} r={3.6} fill="#fff" stroke={INK} strokeWidth={1.4} />
      <ellipse cx={50} cy={56} rx={23} ry={16} fill="#fff" stroke={INK} strokeWidth={2.2} />
      {[43, 50, 57].map((x) => (
        <circle key={x} cx={x} cy={56} r={2.3} fill="#b9a9d8" />
      ))}
    </g>
  );
}

export const todoGrows: SceneArt = {
  id: "todo_grows",
  draw: () => (
    <>
      <Shadow part="shadow" x={HX} w={40} />
      <TodoList />
      <Hamster id="h" x={HX} y={GROUND} scale={SCALE} />
      <g data-part="thought">
        <EmptyThought />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const ball = [0.78, 0.72, 0.66][intensity - 1];
    const wide = [1.14, 1.2, 1.26][intensity - 1];
    return {
      // The list: a short roll, then a slow unroll down to the floor, then the strip runs along it.
      // It drops in from above, then unrolls down to the floor and along it, out of frame.
      list: { keys: [{ at: 0, y: -90 }, { at: UNROLL - 40, y: 0, ease: "bounce" }] },
      paper: { origin: [L.x, L.top], keys: [{ at: 0, sy: 0.06 }, { at: UNROLL, sy: 0.06 }, { at: FLOOR, sy: 1, ease: "inOut" }] },
      strip: { origin: [L.x, GROUND], keys: [{ at: 0, sx: 0, o: 0 }, { at: FLOOR - 10, sx: 0, o: 0, ease: "step" }, { at: FLOOR, o: 1, ease: "step" }, { at: FLOOR + 320, sx: 1, ease: "out" }] },
      badge: { origin: [L.x + L.w + 4, L.top - 8], keys: [{ at: 0, sx: 0, sy: 0, o: 0 }, { at: BADGE, sx: 0, sy: 0, o: 0, ease: "step" }, { at: BADGE + 10, o: 1, ease: "step" }, { at: BADGE + 180, sx: 1.2, sy: 1.2, ease: "back" }, { at: BADGE + 300, sx: 1, sy: 1 }] },
      // Looks up and over at the list.
      "h.face": { origin: [0, -30], keys: [{ at: 0, x: 0, y: 0 }, { at: UNROLL, x: 3, y: -2, ease: "out" }, { at: SHUT, x: 3, y: -2 }, { at: BALL, x: 0, y: 2.5, ease: "inOut" }] },
      // Face: smile → wide eyes → unimpressed → shut.
      "h.eyes": { keys: [{ at: 0, o: 1 }, { at: LOOK, o: 0, ease: "step" }] },
      "h.eyesWide": { keys: showBetween(LOOK, WOBBLE) },
      "h.eyesHalf": { keys: showBetween(WOBBLE, SHUT) },
      "h.eyesClosed": { keys: showBetween(SHUT) },
      "h.mouthSmile": { keys: hideBetween(LOOK) },
      "h.mouthO": { keys: showBetween(LOOK, WOBBLE) },
      "h.mouthWobble": { keys: showBetween(WOBBLE, SHUT) },
      "h.mouthFlat": { keys: showBetween(SHUT) },
      "h.sweat": { keys: [{ at: 0, y: 0, o: 0 }, { at: LOOK + 150, o: 1, ease: "step" }, { at: SHUT, y: 6, ease: "in" }] },
      // Ears tuck in as it curls.
      "h.earL": { origin: [-21, -55], keys: [{ at: 0, x: 0, y: 0 }, { at: BALL, x: 4, y: 4, ease: "inOut" }] },
      "h.earR": { origin: [21, -55], keys: [{ at: 0, x: 0, y: 0 }, { at: BALL, x: -4, y: 4, ease: "inOut" }] },
      // The list lands with a small thump, then the slow squash into a ball.
      h: {
        origin: [0, 0],
        keys: [
          { at: 0, sx: 1, sy: 1 },
          { at: FLOOR, sx: 1, sy: 1 },
          { at: FLOOR + 60, sx: 1.03, sy: 0.96, ease: "out" },
          { at: FLOOR + 240, sx: 1, sy: 1, ease: "out" },
          { at: BALL, sx: wide, sy: ball, ease: "inOut" },
        ],
      },
      // Trembling while it reads the list, then the empty thought pops up over its head.
      "h.head": { origin: [0, -30], keys: shake(LOOK, WOBBLE, 0.7, 6, "x") },
      thought: { origin: [50, 56], keys: [{ at: 0, sx: 0, sy: 0, o: 0 }, { at: BALL + 120, sx: 0, sy: 0, o: 0, ease: "step" }, { at: BALL + 220, sx: 1.1, sy: 1.1, o: 1, ease: "back" }, { at: BALL + 380, sx: 1, sy: 1 }] },
      shadow: { origin: [HX, GROUND], keys: [{ at: 0, sx: 1 }, { at: BALL, sx: wide + 0.1, ease: "inOut" }] },
    };
  },
};
