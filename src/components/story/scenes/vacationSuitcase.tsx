import { blink, hideBetween, showBetween, type Key } from "@/lib/story/timeline";
import { Hamster } from "../characters";
import { GROUND, Shadow, type SceneArt } from "../kit";

// Back from holiday, more tired than before. The hamster trudges in from the side in a
// big sun hat and sunglasses, dragging its suitcase → stops, a long sigh, shoulders
// drop → hops up onto the suitcase and melts flat across it, sunglasses sliding
// crooked, hat tipping over its eyes → "z". Upright traveller → limp on the luggage.

const HX = 58;
const SCALE = 1.4;
const INK = "#5b4636";
const CASE = { x: 86, y: 136, w: 72, h: 48 };
const ARRIVE = 760; // done walking in
const SIGH = 820;
const HOP = 1150; // hops up onto the case
const ON = 1420; // lands on top
const FLAT = 1560; // melted
const ZZZ = 1800;

/** Sun hat + sunglasses, in the hamster's own units. */
function HolidayGear() {
  return (
    <>
      <g data-part="glasses">
        <g transform="translate(0 -33)">
          <rect x={-19} y={-4.8} width={14} height={9.6} rx={4.2} fill="#3d3a4b" stroke={INK} strokeWidth={1.2} />
          <rect x={5} y={-4.8} width={14} height={9.6} rx={4.2} fill="#3d3a4b" stroke={INK} strokeWidth={1.2} />
          <path d="M-5 -1.5 h10" stroke={INK} strokeWidth={1.4} />
          <path d="M-15.6 -2.4 l3 -1.2 M8.4 -2.4 l3 -1.2" stroke="#ffffff" strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
        </g>
      </g>
      <g data-part="hat">
        <ellipse cx={0} cy={-58} rx={36} ry={7.5} fill="#f6d58a" stroke={INK} strokeWidth={1.8} />
        <path d="M-17 -59 C-16 -76 16 -76 17 -59 Z" fill="#f6d58a" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M-16.4 -62 C-6 -59 6 -59 16.4 -62 L16.8 -66.5 C6 -63.5 -6 -63.5 -16.8 -66.5 Z" fill="#ff8fa3" />
      </g>
    </>
  );
}

function Suitcase() {
  const { x, y, w, h } = CASE;
  return (
    <g>
      <rect x={x + w / 2 - 14} y={y - 9} width={28} height={12} rx={5} fill="none" stroke={INK} strokeWidth={3} />
      <rect x={x} y={y} width={w} height={h - 6} rx={6} fill="#bfe6d6" stroke={INK} strokeWidth={2.3} />
      <path d={`M${x + 18} ${y + 3} V${y + h - 9} M${x + w - 18} ${y + 3} V${y + h - 9}`} stroke="#8fcbb3" strokeWidth={3} strokeLinecap="round" />
      <rect x={x + 26} y={y + 14} width={20} height={13} rx={2} fill="#ffe08a" stroke={INK} strokeWidth={1.4} transform={`rotate(-8 ${x + 36} ${y + 20})`} />
      {[x + 12, x + w - 12].map((cx) => (
        <circle key={cx} cx={cx} cy={GROUND - 4} r={4} fill="#ffffff" stroke={INK} strokeWidth={1.8} />
      ))}
    </g>
  );
}

function Zzz() {
  return (
    <g fill="none" stroke="#8b7fd6" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M162 82 h10 l-10 11 h10" />
      <path d="M178 64 h7 l-7 8 h7" />
    </g>
  );
}

export const vacationSuitcase: SceneArt = {
  id: "vacation_suitcase",
  draw: () => (
    <>
      <g data-part="trip">
        <Shadow part="shadow" x={HX} w={44} />
        <Suitcase />
        <g data-part="pull">
          <path d={`M${CASE.x + 2} ${CASE.y + 14} L${HX + 13} ${GROUND - 23}`} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        </g>
        <Hamster id="h" x={HX} y={GROUND} scale={SCALE} top={<HolidayGear />} />
      </g>
      <g data-part="zzz" style={{ opacity: 0 }}>
        <Zzz />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const flat = [0.66, 0.6, 0.54][intensity - 1];
    const wide = [1.25, 1.3, 1.36][intensity - 1];
    // Trudging in: a slow, heavy bob.
    const walk: Key[] = [0, 1, 2, 3, 4].map((i) => ({ at: i * 160, x: 110 - i * 27.5, y: i % 2 ? -3 : 0, ease: "inOut" as const }));
    // Up onto the case: hamster units, relative to where it stands.
    const onX = (CASE.x + CASE.w / 2 - HX) / SCALE;
    const onY = -(GROUND - CASE.y) / SCALE;
    return {
      trip: { keys: [...walk, { at: ARRIVE, x: 0, y: 0, ease: "out" }] },
      // The sigh (shoulders drop), the hop up, the melt.
      h: {
        origin: [0, 0],
        keys: [
          { at: SIGH, x: 0, y: 0, sx: 1, sy: 1, rot: 0 },
          { at: SIGH + 160, sx: 1.06, sy: 0.92, ease: "inOut" },
          { at: HOP, sx: 1.06, sy: 0.92 },
          { at: HOP + 70, sx: 0.96, sy: 1.06, ease: "out" },
          { at: HOP + 160, x: onX * 0.5, y: onY - 26, rot: 10, ease: "out" },
          { at: ON, x: onX, y: onY, rot: 0, sx: 1, sy: 1, ease: "in" },
          { at: FLAT, sx: wide, sy: flat, ease: "inOut" },
          { at: FLAT + 80, sx: wide - 0.05, sy: flat + 0.05, ease: "out" },
          { at: FLAT + 170, sx: wide, sy: flat, ease: "inOut" },
        ],
      },
      // It lets go of the handle when it hops.
      pull: { keys: hideBetween(HOP) },
      shadow: { keys: [{ at: HOP, o: 1 }, { at: HOP + 100, o: 0, ease: "out" }] },
      "h.eyes": { keys: [...blink(400, 160), ...hideBetween(SIGH).slice(1)] },
      "h.eyesHalf": { keys: showBetween(SIGH, ON) },
      "h.eyesClosed": { keys: showBetween(ON) },
      "h.mouthSmile": { keys: hideBetween(SIGH) },
      "h.mouthWobble": { keys: showBetween(SIGH, ON) },
      "h.mouthFlat": { keys: showBetween(ON) },
      "h.sweat": { keys: [{ at: 0, o: 0, y: 0 }, { at: SIGH + 100, o: 0, ease: "step" }, { at: SIGH + 110, o: 1, ease: "step" }, { at: HOP, y: 5, ease: "in" }, { at: HOP + 10, o: 0, ease: "step" }] },
      // Sunglasses slide crooked, the hat tips over its eyes.
      glasses: { origin: [0, -33], keys: [{ at: FLAT, y: 0, rot: 0 }, { at: FLAT + 200, y: 4, rot: 14, ease: "out" }] },
      hat: { origin: [0, -58], keys: [{ at: FLAT, y: 0, rot: 0 }, { at: FLAT + 220, y: 9, rot: -12, ease: "out" }] },
      "h.earL": { origin: [-21, -55], keys: [{ at: FLAT, x: 0, y: 0 }, { at: FLAT + 120, x: -5, y: 3, ease: "out" }] },
      "h.earR": { origin: [21, -55], keys: [{ at: FLAT, x: 0, y: 0 }, { at: FLAT + 120, x: 5, y: 3, ease: "out" }] },
      zzz: { origin: [170, 78], keys: [{ at: 0, o: 0, sx: 0.4, sy: 0.4 }, { at: ZZZ, o: 0, ease: "step" }, { at: ZZZ + 10, o: 1, ease: "step" }, { at: ZZZ + 200, sx: 1, sy: 1, ease: "back" }, { at: 2000, y: -3, ease: "inOut" }, { at: 2200, y: 0, ease: "inOut" }] },
    };
  },
};
