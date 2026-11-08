import { blink, hideBetween, shake, showBetween } from "@/lib/story/timeline";
import { Penguin } from "../characters";
import { GROUND, Heart, Phone, Shadow, type SceneArt } from "../kit";

// The happy ending of "waiting_phone" (used for the "Miss you" gift): the penguin is
// staring at a dark phone, glances at you with a little sigh → the phone buzzes by
// itself and lights up → a heart floats out → ^ ^, it waddles over as fast as it can,
// scoops the phone up, hugs it to its chest and hops. The message it was waiting for
// is the gift.

const PX = 80;
const SCALE = 1.85;
const PHONE: [number, number] = [158, GROUND - 6];
const BUZZ = 1000;

export const messageArrives: SceneArt = {
  id: "message_arrives",
  draw: () => (
    <>
      <Shadow part="shadow" x={PX} w={46} />
      <Penguin id="p" x={PX} y={GROUND} scale={SCALE} />
      {/* After the penguin, so once it's scooped up it sits in front of its chest. */}
      <g data-part="phone">
        <Phone x={PHONE[0]} y={PHONE[1]} part="screen" />
      </g>
      <g data-part="heart">
        <Heart x={PHONE[0]} y={PHONE[1] - 2} size={14} />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const hop = [6, 9, 12][intensity - 1]; // penguin units
    const RUN = BUZZ + 320; // starts waddling over
    const GRAB = 1640; // scoops up the phone
    const H1 = 1760;
    const H2 = 2100;
    const runX = 30; // penguin units: right up to the phone
    const hopKeys = (at: number, sc = 1) => [
      { at, y: 0 },
      { at: at + 130, y: -hop * sc, ease: "out" as const },
      { at: at + 260, y: 0, ease: "in" as const },
    ];
    // Phone ends up hugged to its chest.
    const chest: [number, number] = [PX + runX * SCALE + 4 - PHONE[0], GROUND - 30 * SCALE - PHONE[1]];
    return {
      // Eyes: on the phone → up at you → back → wide at the buzz → happy.
      "p.face": {
        origin: [0, -40],
        keys: [
          { at: 0, x: 4.5, y: 2.5, sx: 0.92 },
          { at: 450, x: 4.5, y: 2.5 },
          { at: 560, x: 0, y: 0, sx: 1, ease: "out" },
          { at: 800, x: 0, y: 0 },
          { at: 900, x: 4.5, y: 2.5, sx: 0.92, ease: "out" },
          { at: GRAB, x: 4.5, y: 2.5 },
          { at: GRAB + 120, x: 0, y: 0, sx: 1, ease: "out" },
        ],
      },
      "p.eyes": { origin: [0, -44], keys: [...blink(300, 160), ...blink(650, 220), ...hideBetween(BUZZ + 20).slice(1)] },
      "p.eyesWide": { keys: showBetween(BUZZ + 20, RUN) },
      "p.eyesHappy": { keys: showBetween(RUN) },
      "p.mouthSmile": { keys: hideBetween(500, RUN) },
      "p.mouthFlat": { keys: showBetween(500, BUZZ + 20) },
      "p.mouthO": { keys: showBetween(BUZZ + 20, RUN) },
      // A small sigh while it waits; a jolt at the buzz; waddles over; hugs and hops.
      p: {
        origin: [0, 0],
        keys: [
          { at: 500, x: 0, y: 0, rot: 0, sx: 1, sy: 1 },
          { at: 700, sx: 1.03, sy: 0.96, ease: "inOut" },
          { at: 900, sx: 1, sy: 1, ease: "inOut" },
          { at: BUZZ + 20, y: 0 },
          { at: BUZZ + 120, y: -hop * 0.7, ease: "out" },
          { at: BUZZ + 240, y: 0, ease: "in" },
          // Waddle, waddle, waddle.
          { at: RUN, x: 0, rot: 0 },
          { at: RUN + 80, x: runX * 0.2, rot: 8 },
          { at: RUN + 160, x: runX * 0.4, rot: -8 },
          { at: RUN + 240, x: runX * 0.6, rot: 8 },
          { at: RUN + 320, x: runX * 0.8, rot: -8 },
          { at: GRAB - 20, x: runX, rot: 0 },
          ...hopKeys(H1),
          ...hopKeys(H2, 0.8),
        ],
      },
      shadow: { origin: [PX, GROUND], keys: [{ at: RUN, x: 0, sx: 1 }, { at: GRAB - 20, x: runX * SCALE, ease: "linear" }, { at: H1 + 130, sx: 0.8 }, { at: H1 + 260, sx: 1 }, { at: H2 + 130, sx: 0.85 }, { at: H2 + 260, sx: 1 }] },
      // Flippers flap as it runs, then fold in to hold the phone.
      "p.armL": { origin: [-25, -46], keys: [...shake(RUN, GRAB - 40, 30, 4, "rot"), { at: GRAB + 60, rot: -55, ease: "out" }] },
      "p.armR": { origin: [25, -46], keys: [...shake(RUN, GRAB - 40, -30, 4, "rot"), { at: GRAB + 60, rot: 55, ease: "out" }] },
      // The phone buzzes on its own and lights up, then gets scooped up and hugged.
      phone: {
        origin: PHONE,
        keys: [
          ...shake(BUZZ, BUZZ + 260, 5, 5, "rot"),
          { at: GRAB, x: 0, y: 0, rot: 0, sx: 1, sy: 1 },
          { at: GRAB + 120, x: chest[0], y: chest[1], rot: -80, sx: 1.1, sy: 1.1, ease: "out" },
          ...hopKeys(H1).map((k) => ({ ...k, y: chest[1] + (k.y ?? 0) * SCALE })),
          ...hopKeys(H2, 0.8).map((k) => ({ ...k, y: chest[1] + (k.y ?? 0) * SCALE })),
        ],
      },
      screen: { keys: showBetween(BUZZ) },
      // A heart floats up out of the phone and drifts above the penguin.
      heart: {
        origin: [PHONE[0], PHONE[1] - 2],
        keys: [
          { at: 0, x: 0, y: 0, sx: 0.2, sy: 0.2, o: 0 },
          { at: BUZZ + 200, x: 0, y: 0, sx: 0.2, sy: 0.2, o: 0, ease: "step" },
          { at: BUZZ + 210, o: 1, ease: "step" },
          { at: BUZZ + 450, y: -60, sx: 1.2, sy: 1.2, ease: "back" },
          { at: 2500, x: -10, y: -112, sx: 1.3, sy: 1.3, ease: "inOut" },
        ],
      },
    };
  },
};
