import { blink, hideBetween, shake, showBetween, type Key } from "@/lib/story/timeline";
import { Cat } from "../characters";
import { GROUND, type SceneArt } from "../kit";

// The calendar really attacks. It shudders, then fires meeting blocks out of its side
// like a machine gun, recoiling with every shot. They slam into the cat, which flinches
// and winces (> <), and pile up on it faster and faster until it's completely buried
// under a heap of meetings → a tiny white flag pokes out of the top and waves. Surrender.

const LINE = "#5b4636";
const CAT_X = 146;
const CAT_S = 1.3;
const CAL = { x: 4, y: 34, w: 76, h: 72 };
const MUZZLE: [number, number] = [CAL.x + CAL.w + 4, CAL.y + 44];
const CHARGE = 220; // shudders
const FIRE = 520; // first shot
const GAP = 52; // machine-gun rhythm
const WINCE = 760; // > < from here on
const FLAG = 1880; // the white flag

const COLORS = ["#8fd3ff", "#c3b2ff", "#ffbf7a", "#94e3b8", "#ff9fb8", "#ffe27a"];
const ROWS = [4, 4, 4, 3, 3, 3, 2];
/** Pile slots around the cat, bottom row first. */
const SLOTS = ROWS.flatMap((n, r) =>
  Array.from({ length: n }, (_, i) => ({
    x: CAT_X + (i - (n - 1) / 2) * 26 + (r % 2 ? 4 : -4),
    y: GROUND - 9 - r * 17,
    rot: ((i * 41 + r * 17) % 24) - 12,
  })),
);
const LAST = FIRE + (SLOTS.length - 1) * GAP + 200;

function MeetingBlock({ color }: { color: string }) {
  return (
    <>
      <rect x={-15} y={-9} width={30} height={18} rx={4} fill={color} stroke={LINE} strokeWidth={1.8} />
      <rect x={-15} y={-9} width={30} height={5.5} rx={2.6} fill="#ffffff" opacity={0.55} />
      <path d="M-9 2.5 h12" stroke={LINE} strokeOpacity={0.45} strokeWidth={1.6} strokeLinecap="round" />
    </>
  );
}

function Calendar() {
  const { x, y, w, h } = CAL;
  return (
    <g data-part="cal">
      {/* The "barrel": a slot on its side the meetings shoot out of. */}
      <rect x={x + w - 4} y={MUZZLE[1] - 12} width={12} height={24} rx={3} fill="#ff9aab" stroke={LINE} strokeWidth={2} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#ffffff" stroke={LINE} strokeWidth={2.4} />
      <path d={`M${x} ${y + 17} V${y + 8} Q${x} ${y} ${x + 8} ${y} H${x + w - 8} Q${x + w} ${y} ${x + w} ${y + 8} V${y + 17} Z`} fill="#ff9aab" />
      <path d={`M${x} ${y + 17} H${x + w}`} stroke={LINE} strokeWidth={2.4} />
      {[x + 20, x + w - 20].map((rx) => (
        <rect key={rx} x={rx - 3} y={y - 6} width={6} height={12} rx={3} fill="#8a7766" stroke={LINE} strokeWidth={1.2} />
      ))}
      {[0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={x + 8 + c * 16} y={y + 24 + r * 15} width={12} height={10} rx={2.5} fill={(r + c) % 3 ? "#eef2fb" : "#ffd9df"} />))}
      {/* Angry little eyebrows: it means it. */}
      <path d={`M${x + 18} ${y + 26} l12 4 M${x + w - 18} ${y + 26} l-12 4`} stroke={LINE} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}

function Flag() {
  return (
    <g>
      <path d="M150 64 V30" stroke={LINE} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M151 31 C160 28 166 34 176 31 V46 C166 49 160 43 151 46 Z" fill="#ffffff" stroke={LINE} strokeWidth={1.8} strokeLinejoin="round" />
    </g>
  );
}

function blockKeys(i: number): Key[] {
  const s = SLOTS[i];
  const t = FIRE + i * GAP;
  const dx = s.x - MUZZLE[0];
  const dy = s.y - MUZZLE[1];
  return [
    { at: 0, x: 0, y: 0, rot: 0, o: 0 },
    { at: t, o: 0, ease: "step" },
    { at: t + 10, o: 1, ease: "step" },
    // Shot straight out, a slight dip, slams into the pile and settles.
    { at: t + 150, x: dx, y: dy - 6, rot: s.rot + 20, ease: "linear" },
    { at: t + 200, y: dy, rot: s.rot, ease: "out" },
  ];
}

export const calendarAttack: SceneArt = {
  id: "calendar_attack",
  draw: () => (
    <>
      <g data-part="kitty">
        <Cat id="c" x={CAT_X} y={GROUND} scale={CAT_S} />
      </g>
      <g data-part="flag" style={{ opacity: 0 }}>
        <Flag />
      </g>
      {SLOTS.map((_, i) => (
        <g key={i} transform={`translate(${MUZZLE[0]} ${MUZZLE[1]})`}>
          <g data-part={`ev${i}`} style={{ opacity: 0 }}>
            <MeetingBlock color={COLORS[i % COLORS.length]} />
          </g>
        </g>
      ))}
      <Calendar />
    </>
  ),
  tracks: ({ intensity }) => {
    const recoil = [2, 3, 4][intensity - 1];
    // Recoil: kicks back on every shot.
    const kicks: Key[] = SLOTS.flatMap((_, i) => {
      const t = FIRE + i * GAP;
      return [
        { at: t, x: 0, rot: 0 },
        { at: t + 15, x: -recoil, rot: -1.5, ease: "out" },
        { at: t + GAP - 5, x: 0, rot: 0, ease: "in" },
      ];
    });
    return {
      ...Object.fromEntries(SLOTS.map((_, i) => [`ev${i}`, { keys: blockKeys(i) }])),
      cal: { origin: [CAL.x + CAL.w / 2, CAL.y + CAL.h], keys: [...shake(CHARGE, FIRE - 20, 1.5, 4, "rot"), ...kicks] },
      // The cat: looks over at the calendar, startled, then winces and flinches with each hit.
      "c.face": { origin: [0, -50], keys: [{ at: 0, x: 0 }, { at: 200, x: -3, sx: 0.95, ease: "out" }] },
      "c.eyes": { origin: [0, -53], keys: [...blink(300, 160), ...hideBetween(FIRE)] },
      "c.eyesWide": { keys: showBetween(FIRE, WINCE) },
      "c.eyesSquint": { keys: showBetween(WINCE) },
      "c.mouthSmile": { keys: hideBetween(FIRE) },
      "c.mouthO": { keys: showBetween(FIRE, WINCE) },
      "c.mouthWobble": { keys: showBetween(WINCE) },
      kitty: { origin: [CAT_X, GROUND], keys: [{ at: FIRE + 150, sx: 1, sy: 1, x: 0 }, { at: FIRE + 230, sx: 1.06, sy: 0.9, x: 3, ease: "out" }, ...shake(FIRE + 260, LAST, 1.6, 10, "x").slice(1)] },
      "c.earL": { origin: [-14, -72], keys: [{ at: FIRE + 150, rot: 0 }, { at: FIRE + 260, rot: -30, ease: "out" }] },
      "c.earR": { origin: [14, -72], keys: [{ at: FIRE + 150, rot: 0 }, { at: FIRE + 260, rot: 30, ease: "out" }] },
      // Buried. Then, from the top of the heap: a tiny white flag, waving.
      flag: {
        origin: [150, 64],
        keys: [
          { at: 0, o: 0, y: 30, rot: 0 },
          { at: FLAG, o: 0, y: 30, ease: "step" },
          { at: FLAG + 10, o: 1, ease: "step" },
          { at: FLAG + 160, y: 0, ease: "out" },
          { at: FLAG + 240, rot: -10, ease: "inOut" },
          { at: FLAG + 320, rot: 8, ease: "inOut" },
          { at: FLAG + 400, rot: -6, ease: "inOut" },
          { at: 2300, rot: 0, ease: "inOut" },
        ],
      },
    };
  },
};
