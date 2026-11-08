import { hideBetween, shake, showBetween, type Tracks } from "@/lib/story/timeline";
import { Hamster } from "../characters";
import { GROUND, Question, Shadow, type SceneArt } from "../kit";

// The overthinking spiral. One question mark pops up over a calm hamster; then there
// are three, then five, circling its head faster and faster. Its eyes go wide, a sweat
// drop appears, and it clamps a tiny hard hat on, just in case. "What if everything
// goes wrong?" The question marks keep orbiting to the end.

const HX = 100;
const SCALE = 1.6;
const HEAD: [number, number] = [HX, GROUND - 36 * SCALE]; // centre of the top of its head: the orbit centre
const R = 56; // orbit radius
const INK = "#5b4636";
const HAT = 1350; // the hat drops in
const LAND = HAT + 230;

/** A hard hat on the head (hamster units): yellow dome, ridge, brim. */
function HardHat() {
  return (
    <g data-part="hat">
      <path d="M-20 -60 C-20 -78 -11 -86 0 -86 C11 -86 20 -78 20 -60 Z" fill="#ffd23f" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M-9 -80 Q-12 -72 -11 -64" stroke="#fff3b0" strokeWidth={2} strokeLinecap="round" fill="none" />
      <rect x={-25} y={-63} width={50} height={6.5} rx={3.2} fill="#ffe27a" stroke={INK} strokeWidth={1.8} />
    </g>
  );
}

// Question marks start at the same spot (right of the head) and orbit around it.
// `a` is where each one starts, `t` is when it pops in.
const QS = [
  { n: 1, a: -90, t: 300 },
  { n: 2, a: 150, t: 800 },
  { n: 3, a: 30, t: 820 },
  { n: 4, a: -150, t: 1100 },
  { n: 5, a: -30, t: 1120 },
];
const REF: [number, number] = [HEAD[0] + R, HEAD[1]];

export const whatIf: SceneArt = {
  id: "what_if",
  draw: () => (
    <>
      <Shadow part="shadow" x={HX} w={40} />
      <Hamster id="h" x={HX} y={GROUND} scale={SCALE} top={<HardHat />} />
      {QS.map((q) => (
        <g key={q.n} data-part={`orb${q.n}`}>
          <g data-part={`pop${q.n}`}>
            <g transform={`translate(${REF[0]} ${REF[1]}) scale(1.8) translate(${-REF[0]} ${-REF[1]})`}>
              <Question x={REF[0]} y={REF[1]} />
            </g>
          </g>
        </g>
      ))}
    </>
  ),
  tracks: ({ intensity }) => {
    const spin = [200, 260, 320][intensity - 1];
    const t: Tracks = {};
    for (const q of QS) {
      // Each question mark orbits the head; it pops in at its own time.
      t[`orb${q.n}`] = { origin: HEAD, keys: [{ at: 0, rot: q.a }, { at: 2200, rot: q.a + spin, ease: "linear" }] };
      t[`pop${q.n}`] = {
        origin: REF,
        keys: [
          { at: 0, o: 0, sx: 0, sy: 0 },
          { at: q.t, o: 0, sx: 0, sy: 0, ease: "step" },
          { at: q.t + 10, o: 1, sx: 0.4, sy: 0.4, ease: "step" },
          { at: q.t + 170, sx: 1.2, sy: 1.2, ease: "back" },
          { at: q.t + 270, sx: 1, sy: 1 },
        ],
      };
    }
    return {
      ...t,
      // Calm smile, then it looks up at the question marks, eyes go wide, mouth trembles.
      "h.eyes": { keys: hideBetween(720) },
      "h.eyesWide": { keys: showBetween(720) },
      "h.mouthSmile": { keys: hideBetween(600) },
      "h.mouthWobble": { keys: showBetween(600) },
      "h.face": { origin: [0, -30], keys: [{ at: 0, y: 0 }, { at: 600, y: -2, ease: "out" }] },
      "h.sweat": { keys: [{ at: 0, y: 0, o: 0 }, { at: 760, o: 1, ease: "step" }] },
      // Trembling as the questions multiply, and a little jolt when the hat lands.
      "h.head": { origin: [0, -30], keys: [...shake(800, HAT, 0.8, 6, "x"), ...shake(LAND, LAND + 320, 1.6, 4, "rot")] },
      // The hat drops onto its head, bounces, and it wobbles on.
      hat: {
        origin: [0, -60],
        keys: [
          { at: 0, y: -30, o: 0 },
          { at: HAT, y: -30, o: 0, ease: "step" },
          { at: HAT + 10, o: 1, ease: "step" },
          { at: LAND, y: 0, ease: "bounce" },
          ...shake(LAND, LAND + 320, 3, 4, "rot"),
        ],
      },
    };
  },
};
