import { blink, hideBetween, showBetween, type Key } from "@/lib/story/timeline";
import { Dog } from "../characters";
import { GROUND, Shadow, Spark, type SceneArt } from "../kit";

// Ready for a meeting: the shiba puts its headphones on and nods. A new meeting
// notification pops up on the monitor, fast, and it double-takes (eyes wide, sweat).
// Then, slowly, it sags and pulls the headphones down until they cover its eyes.
// Meeting fatigue.

const DX = 64;
const SCALE = 1.5;
const LINE = "#5b4636";
const PHONES_ON = 430; // headphones land on the head
const NOD = 700; // "ready" nod
const POP = 1000; // the notification card (fast)
const FLINCH = 1120; // double take
const SLIDE = 1290; // the slow slide starts
const END = 1900; // headphones fully over the eyes, then the sag holds
const DEPTH = 26; // how far the headphones slide down, local units

/** Pop in: hard cut on at `at`, then a back-ease grow to `size`. */
function popIn(at: number, size = 1): Key[] {
  return [
    { at: 0, sx: 0, sy: 0, o: 0 },
    { at, sx: 0, sy: 0, o: 0, ease: "step" },
    { at: at + 10, o: 1, ease: "step" },
    { at: at + 150, sx: size, sy: size, ease: "back" },
  ];
}

/** Headphones worn on the head, in the dog's local units (drawn over the head). */
function Headphones() {
  const band = "M-31 -44 C-33 -90 33 -90 31 -44";
  return (
    <g data-part="d.phones">
      <path d={band} fill="none" stroke={LINE} strokeWidth={9.4} strokeLinecap="round" />
      <path d={band} fill="none" stroke="#6f7aa6" strokeWidth={6} strokeLinecap="round" />
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={31 * s} cy={-44} rx={7.2} ry={10.5} fill="#6f7aa6" stroke={LINE} strokeWidth={2.3} />
          <ellipse cx={31 * s} cy={-44} rx={3} ry={4.5} fill="#cfeaff" />
        </g>
      ))}
    </g>
  );
}

/** The desk, the monitor with a packed calendar, the pop-up card and its sparkle. */
function Office() {
  return (
    <g>
      <rect x={122} y={172} width={5} height={12} fill="#c9a77f" />
      <rect x={187} y={172} width={5} height={12} fill="#c9a77f" />
      <rect x={114} y={164} width={84} height={8} rx={3} fill="#e7c9a3" stroke={LINE} strokeWidth={2} />
      <rect x={151} y={146} width={8} height={18} fill="#4b4f63" />
      <rect x={142} y={160} width={26} height={4} rx={2} fill="#4b4f63" stroke={LINE} strokeWidth={1.4} />
      <rect x={124} y={104} width={66} height={42} rx={5} fill="#4b4f63" stroke={LINE} strokeWidth={2.3} />
      <rect x={129} y={109} width={56} height={32} rx={2.4} fill="#cfeaff" />
      <rect x={133} y={114} width={32} height={6} rx={2} fill="#ffb3c1" />
      <rect x={133} y={123} width={44} height={6} rx={2} fill="#b9e4c9" />
      <rect x={133} y={132} width={24} height={6} rx={2} fill="#ffe08a" />
      <g data-part="card">
        <rect x={126} y={64} width={60} height={32} rx={7} fill="#ffffff" stroke={LINE} strokeWidth={1.8} />
        <circle cx={139} cy={80} r={7} fill="#8fcaf0" stroke={LINE} strokeWidth={1.3} />
        <rect x={135.2} y={77.8} width={6.4} height={4.4} rx={1} fill="#ffffff" />
        <path d="M141.6 79 l2.6 -1.6 v4.6 l-2.6 -1.6 Z" fill="#ffffff" />
        <path d="M152 75 h24 M152 80.5 h17 M152 86 h11" stroke="#9aa3b5" strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={185} cy={64} r={3.6} fill="#ff7a93" stroke={LINE} strokeWidth={1} />
      </g>
      <g data-part="spark">
        <Spark x={176} y={48} color="#f5b942" />
      </g>
    </g>
  );
}

export const oneMoreMeeting: SceneArt = {
  id: "one_more_meeting",
  draw: () => (
    <>
      <Shadow part="shadow" x={DX} w={36} />
      <Office />
      <Dog id="d" x={DX} y={GROUND} scale={SCALE} top={<Headphones />} />
    </>
  ),
  tracks: ({ intensity }) => {
    // Bigger intensity: a deeper sag and droopier ears.
    const slump = [6, 9, 12][intensity - 1];
    const droop = [14, 22, 30][intensity - 1];
    return {
      "d.face": {
        origin: [0, -50],
        keys: [
          { at: 0, x: 4, sx: 0.92 }, // glancing at the monitor
          { at: NOD, x: 4, sx: 0.92 },
          { at: NOD + 160, x: 0, sx: 1, ease: "out" },
          { at: FLINCH + 60, x: 5, sx: 0.9, ease: "out" }, // double take toward the screen
          { at: SLIDE, x: 2, sx: 0.95, ease: "inOut" },
          { at: END, x: 2, sx: 0.95, y: 3 }, // sagging
        ],
      },
      "d.head": {
        origin: [0, -30],
        keys: [
          { at: NOD, rot: 0 },
          { at: NOD + 90, rot: 6, ease: "out" }, // nod
          { at: NOD + 260, rot: 0, ease: "back" },
          { at: SLIDE + 150, rot: 0 },
          { at: END, rot: slump, ease: "inOut" },
        ],
      },
      // Headphones: drop on, nod along with the head, then slide down over the eyes.
      "d.phones": {
        origin: [0, -30],
        keys: [
          { at: 0, o: 0, y: -30 },
          { at: PHONES_ON, o: 0, y: -30, ease: "step" },
          { at: PHONES_ON + 10, o: 1, ease: "step" },
          { at: PHONES_ON + 250, y: 0, ease: "back" },
          { at: NOD, rot: 0 },
          { at: NOD + 90, rot: 6, ease: "out" },
          { at: NOD + 260, rot: 0, ease: "back" },
          { at: SLIDE, y: 0 },
          { at: END, y: DEPTH, rot: slump, ease: "inOut" },
        ],
      },
      "d.eyes": { origin: [0, -53], keys: [...blink(230, 150), ...hideBetween(FLINCH).slice(1)] },
      "d.eyesWide": { keys: showBetween(FLINCH, SLIDE) },
      "d.eyesHalf": { keys: showBetween(SLIDE) },
      "d.mouthSmile": { keys: hideBetween(FLINCH) },
      "d.mouthO": { keys: showBetween(FLINCH, SLIDE) },
      "d.mouthFlat": { keys: showBetween(SLIDE) },
      "d.sweat": { keys: showBetween(FLINCH + 40) },
      "d.earL": { origin: [-14, -70], keys: [{ at: SLIDE, rot: 0 }, { at: END, rot: -droop, ease: "inOut" }] },
      "d.earR": { origin: [14, -70], keys: [{ at: SLIDE, rot: 0 }, { at: END, rot: droop, ease: "inOut" }] },
      card: { origin: [156, 80], keys: popIn(POP) },
      spark: { origin: [176, 48], keys: [...popIn(POP, 1.2), { at: POP + 420, o: 0, ease: "in" }] },
    };
  },
};
