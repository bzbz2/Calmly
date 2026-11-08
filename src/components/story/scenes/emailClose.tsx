import { hideBetween, shake, showBetween, type Key } from "@/lib/story/timeline";
import { Cat } from "../characters";
import { GROUND, Shadow, type SceneArt } from "../kit";

// "I opened one email. Big mistake." The cat holds one envelope and tears it open →
// a flood of emails shoots out of it, one after another, and rains down → they pile up
// on the cat until it's buried: a heap of envelopes with just two ears sticking out,
// which give one small twitch. Cat → mail mound: the silhouette changes completely.

const LINE = "#5b4636";
const CX = 100;
const SCALE = 1.25;
const TEAR = 380; // starts tearing the flap
const BURST = 640; // the first email shoots out
const GAP = 26; // between emails
const HALF = 1050; // deadpan while it gets buried
const MOUTH: [number, number] = [CX, 142]; // top edge of the held envelope

const ROWS = [6, 5, 5, 4, 3, 2];
const STEP_X = 27;
const STEP_Y = 15;
const TINTS = ["#ffffff", "#eef4ff", "#fff4d6", "#ffffff", "#ffe8ee"];
/** Where each email lands: a mound, bottom row first (so later ones sit on top). */
const SLOTS: { x: number; y: number; rot: number }[] = ROWS.flatMap((n, r) =>
  Array.from({ length: n }, (_, i) => ({
    x: CX + (i - (n - 1) / 2) * STEP_X + (r % 2 ? 3 : -3),
    y: GROUND - 9 - r * STEP_Y,
    rot: ((i * 37 + r * 23) % 30) - 15,
  })),
);

/** One small email, centred on (0, 0). */
function Mail({ tint }: { tint: string }) {
  return (
    <>
      <rect x={-15} y={-10} width={30} height={20} rx={3} fill={tint} stroke={LINE} strokeWidth={1.7} />
      <path d="M-13.5 -8.5 L0 1.5 L13.5 -8.5" fill="none" stroke={LINE} strokeWidth={1.4} strokeLinejoin="round" />
    </>
  );
}

/** The one envelope it's holding, with a flap that tears open. Scene units. */
function HeldEnvelope() {
  const [x, y] = MOUTH;
  return (
    <g data-part="held">
      <rect x={x - 26} y={y} width={52} height={32} rx={4} fill="#fffdf6" stroke={LINE} strokeWidth={2} />
      <path d={`M${x - 23} ${y + 2} L${x} ${y + 16} L${x + 23} ${y + 2} Z`} fill="#fbd0da" />
      <g data-part="flap">
        <path d={`M${x - 26} ${y} L${x} ${y + 18} L${x + 26} ${y} Z`} fill="#f3e6cc" stroke={LINE} strokeWidth={2} strokeLinejoin="round" />
      </g>
    </g>
  );
}

function mailKeys(i: number, spread: number): Key[] {
  const s = SLOTS[i];
  const t = BURST + i * GAP;
  const dx = s.x - MOUTH[0];
  const dy = s.y - MOUTH[1];
  const apexY = -60 - ((i * 13) % 40);
  return [
    { at: 0, x: 0, y: 0, rot: 0, o: 0, sx: 0.5, sy: 0.5 },
    { at: t, o: 0, ease: "step" },
    { at: t + 10, o: 1, ease: "step" },
    { at: t + 190, x: dx * spread, y: apexY, rot: s.rot * 2, sx: 1, sy: 1, ease: "out" },
    { at: t + 430, x: dx, y: dy, rot: s.rot, ease: "in" },
    { at: t + 480, y: dy - 3, ease: "out" },
    { at: t + 530, y: dy, ease: "in" },
  ];
}

export const emailClose: SceneArt = {
  id: "email_close",
  draw: () => (
    <>
      <Shadow x={CX} w={50} />
      <Cat id="c" x={CX} y={GROUND} scale={SCALE} />
      <HeldEnvelope />
      {SLOTS.map((_, i) => (
        <g key={i} transform={`translate(${MOUTH[0]} ${MOUTH[1]})`}>
          <g data-part={`m${i}`} style={{ opacity: 0 }}>
            <Mail tint={TINTS[i % TINTS.length]} />
          </g>
        </g>
      ))}
    </>
  ),
  tracks: ({ intensity }) => {
    const spread = [0.6, 0.8, 1][intensity - 1];
    return {
      ...Object.fromEntries(SLOTS.map((_, i) => [`m${i}`, { keys: mailKeys(i, spread) }])),
      // Tugs at the envelope, the flap flips open, then it jolts with every email.
      held: { origin: [CX, MOUTH[1] + 16], keys: [...shake(TEAR - 120, TEAR, 3, 3, "rot"), ...shake(BURST, BURST + 500, 2.5, 5, "rot").slice(1)] },
      flap: { origin: [CX, MOUTH[1]], keys: [{ at: 0, sy: 1 }, { at: TEAR, sy: 1 }, { at: BURST - 20, sy: -1, ease: "out" }] },
      // Looks down at it → wide-eyed at the flood → deadpan as it disappears.
      "c.face": { origin: [0, -50], keys: [{ at: 0, y: 2.5 }, { at: TEAR, y: 2.5 }, { at: BURST, y: -1, ease: "out" }] },
      "c.eyes": { keys: hideBetween(BURST) },
      "c.eyesWide": { keys: showBetween(BURST, HALF) },
      "c.eyesHalf": { origin: [0, -53], keys: showBetween(HALF) },
      "c.mouthSmile": { keys: hideBetween(BURST) },
      "c.mouthO": { keys: showBetween(BURST, HALF) },
      "c.mouthFlat": { keys: showBetween(HALF) },
      c: {
        origin: [0, 0],
        keys: [
          { at: BURST, sx: 1, sy: 1 },
          { at: BURST + 60, sx: 1.06, sy: 0.94, ease: "out" },
          { at: BURST + 200, sx: 1, sy: 1, ease: "out" },
        ],
      },
      // Buried. Just the ears, and one little twitch.
      "c.earR": { origin: [14, -72], keys: [{ at: 1950, rot: 0 }, { at: 2020, rot: 16, ease: "out" }, { at: 2110, rot: 0, ease: "inOut" }] },
      "c.earL": { origin: [-14, -72], keys: [{ at: 2060, rot: 0 }, { at: 2120, rot: -10, ease: "out" }, { at: 2200, rot: 0, ease: "inOut" }] },
    };
  },
};
