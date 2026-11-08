import { blink, hideBetween, shake, showBetween } from "@/lib/story/timeline";
import { Penguin } from "../characters";
import { GROUND, Phone, Shadow, type SceneArt } from "../kit";

// Waiting for your message. The penguin sits staring at a phone on the floor →
// glances up at you → back at the phone → leans over and pokes it: the screen
// lights up… nothing new → the screen goes dark again and the penguin slowly
// slumps, eyes down. Gentle, never a joke.

const PX = 80;
const SCALE = 1.85;
const PHONE: [number, number] = [158, GROUND - 6];

export const waitingPhone: SceneArt = {
  id: "waiting_phone",
  draw: () => (
    <>
      <Shadow x={PX} w={46} />
      <g data-part="phone">
        <Phone x={PHONE[0]} y={PHONE[1]} part="screen" />
      </g>
      <Penguin id="p" x={PX} y={GROUND} scale={SCALE} />
    </>
  ),
  tracks: ({ intensity }) => {
    const slump = [0.95, 0.93, 0.9][intensity - 1];
    return {
      // Eyes: on the phone → up at you → back on the phone → down.
      "p.face": {
        origin: [0, -40],
        keys: [
          { at: 0, x: 4.5, y: 2.5, sx: 0.92 },
          { at: 520, x: 4.5, y: 2.5 },
          { at: 640, x: 0, y: 0, sx: 1, ease: "out" },
          { at: 900, x: 0, y: 0 },
          { at: 1020, x: 4.5, y: 2.5, sx: 0.92, ease: "out" },
          { at: 1700, x: 4.5, y: 2.5 },
          { at: 2000, x: 1, y: 5, sx: 1, ease: "inOut" },
        ],
      },
      "p.eyes": { origin: [0, -44], keys: [...blink(330, 160), ...blink(760, 200), ...blink(2200, 260)] },
      "p.mouthSmile": { keys: hideBetween(1900) },
      "p.mouthFrown": { keys: showBetween(1900) },
      // Lean over and poke the phone, then sit back up.
      p: {
        origin: [12, 0],
        keys: [
          { at: 1000, rot: 0, sx: 1, sy: 1 },
          { at: 1150, rot: 11, ease: "out" },
          { at: 1650, rot: 11 },
          { at: 1850, rot: 0, ease: "inOut" },
          { at: 1900, sx: 1, sy: 1 },
          { at: 2150, sx: 2 - slump, sy: slump, ease: "inOut" },
          { at: 2350, sx: 2 - slump - 0.01, sy: slump + 0.01, ease: "inOut" },
          { at: 2500, sx: 2 - slump, sy: slump, ease: "inOut" },
        ],
      },
      "p.armR": {
        origin: [25, -46],
        keys: [
          { at: 1000, rot: 0 },
          { at: 1150, rot: -48, ease: "out" },
          { at: 1210, rot: -40, ease: "in" },
          { at: 1260, rot: -48, ease: "out" },
          { at: 1650, rot: -48 },
          { at: 1850, rot: 0, ease: "inOut" },
        ],
      },
      // The poke: the phone jiggles and the screen lights up — nothing new.
      phone: { origin: PHONE, keys: shake(1210, 1360, 4, 3, "rot") },
      screen: { keys: showBetween(1230, 1680) },
    };
  },
};
