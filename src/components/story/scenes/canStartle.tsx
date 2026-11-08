import { blink, hideBetween, shake, showBetween } from "@/lib/story/timeline";
import { Dog } from "../characters";
import { Bang, GROUND, Shadow, Spark, type SceneArt } from "../kit";

// A soda can waits on the floor. The shiba glances at it, leans in and lifts it → holds
// it a moment, head cocked → sets it back down… and the can lands with a "clank". The
// dog jumps out of its skin (ears and fur up, eyes wide, a "!", a real hang in the air)
// → lands leaning away, eyes glued to the can, sweating and trembling, ready to bolt.
// Jumpy and on edge. Comic but cute.

const DX = 74;
const S = 1.5;
const CAN_X = DX + 52; // where the can waits on the floor, clear of the tail
const CAN_LIFT = 15; // a held can hangs this far above the floor (scene px)
const BANG: [number, number] = [DX + 60, 40];
const LINE = "#5b4636";
const CAN = { body: "#e5484d", metal: "#d9dde6", shine: "#ffffff" };

const PICK = 560; // leans in, starts lifting
const HELD = 900; // the can is in its paws
const PUT = 1100; // lets it go
const CLANK = 1190; // the can lands: clank, and the dog jumps
const SETTLED = 1640; // lands; from here it stares at the can, trembling

/** A soda can standing on its bottom centre (0, 0): 15 wide, 24 tall (dog-local units). */
function SodaCan() {
  return (
    <>
      <rect x={-7.5} y={-24} width={15} height={24} rx={2.4} fill={CAN.body} stroke={LINE} strokeWidth={1.4} />
      <rect x={-7.5} y={-5} width={15} height={5} rx={1.6} fill={CAN.metal} stroke={LINE} strokeWidth={1.2} />
      <ellipse cx={0} cy={-24} rx={7.5} ry={2.1} fill={CAN.metal} stroke={LINE} strokeWidth={1.2} />
      <rect x={-4.6} y={-19} width={1.6} height={10} rx={0.8} fill={CAN.shine} opacity={0.7} />
    </>
  );
}

export const canStartle: SceneArt = {
  id: "can_startle",
  draw: () => (
    <>
      <Shadow part="shadow" x={DX} w={38} />
      <Dog
        id="d"
        x={DX}
        y={GROUND}
        scale={S}
        // The can in its paws: drawn in front of the body, behind the front legs.
        hold={
          <g data-part="d.heldCan" style={{ opacity: 0 }}>
            <g transform="translate(0 -10)">
              <SodaCan />
            </g>
          </g>
        }
      />
      <g data-part="can">
        <g transform={`translate(${CAN_X} ${GROUND}) scale(${S})`}>
          <SodaCan />
        </g>
      </g>
      <g data-part="clank">
        <Spark x={CAN_X - 16} y={GROUND - 6} color="#7fb3e3" />
        <Spark x={CAN_X + 16} y={GROUND - 6} color="#7fb3e3" />
      </g>
      <g data-part="bang">
        <Bang x={BANG[0]} y={BANG[1]} />
      </g>
    </>
  ),
  tracks: ({ intensity }) => {
    const jump = [12, 16, 20][intensity - 1]; // dog-local units; higher and the ears leave the frame
    const puff = [1.04, 1.08, 1.12][intensity - 1];
    return {
      // Glance at the can, one blink, then the eyes go back to it once it's lifted.
      "d.face": {
        origin: [0, -50],
        keys: [
          { at: 0, x: 0, sx: 1 },
          { at: 160, x: 4.5, sx: 0.94, ease: "out" },
          { at: 520, x: 4.5, sx: 0.94 },
          { at: 640, x: 0, sx: 1, ease: "out" },
          { at: SETTLED - 100, x: 5, sx: 0.9, ease: "out" },
        ],
      },
      "d.eyes": { origin: [0, -53], keys: [...blink(470, 150), { at: CLANK, o: 0, ease: "step" }, { at: SETTLED, o: 1, ease: "step" }] },
      "d.eyesWide": { keys: showBetween(CLANK, SETTLED) },
      "d.mouthSmile": { keys: hideBetween(CLANK) },
      "d.mouthO": { keys: showBetween(CLANK, SETTLED) },
      "d.mouthWobble": { keys: showBetween(SETTLED) },
      "d.sweat": { keys: [{ at: 0, o: 0, y: 0 }, { at: SETTLED + 60, o: 0, y: 0, ease: "step" }, { at: SETTLED + 70, o: 1, ease: "step" }, { at: 2000, y: 4, ease: "in" }] },
      // Cocks its head at the can in its paws, then whips up at the clank and tilts with suspicion.
      "d.head": {
        origin: [0, -30],
        keys: [
          { at: HELD - 20, rot: 0 },
          { at: 1000, rot: 8, ease: "out" },
          { at: PUT, rot: 8 },
          { at: CLANK, rot: 0, ease: "out" },
          { at: SETTLED - 100, rot: 9, ease: "out" },
        ],
      },
      // Tail wags a little while it's happy, bristles at the jump, then stays up.
      "d.tail": {
        origin: [15, -12],
        keys: [
          ...shake(0, 560, 10, 4, "rot"),
          { at: CLANK, rot: 0 },
          { at: CLANK + 60, rot: 24, sx: 1.12, sy: 1.12, ease: "back" },
          { at: SETTLED - 5, rot: 12, sx: 1, sy: 1, ease: "inOut" },
        ],
      },
      // Ears shoot up (straight, a little taller), and stay on alert.
      "d.earL": {
        origin: [-14, -70],
        keys: [
          { at: 0, rot: 0, sy: 1 },
          { at: CLANK, rot: 0, sy: 1 },
          { at: CLANK + 60, rot: 12, sy: 1.14, ease: "back" },
          { at: SETTLED - 5, rot: 10, sy: 1.1, ease: "inOut" },
        ],
      },
      "d.earR": {
        origin: [14, -70],
        keys: [
          { at: 0, rot: 0, sy: 1 },
          { at: CLANK, rot: 0, sy: 1 },
          { at: CLANK + 60, rot: -12, sy: 1.14, ease: "back" },
          { at: SETTLED - 5, rot: -10, sy: 1.1, ease: "inOut" },
        ],
      },
      // Fur puffs up on the jump and stays a little puffed.
      "d.body": {
        origin: [0, -18],
        keys: [
          { at: CLANK, sx: 1, sy: 1 },
          { at: CLANK + 60, sx: puff, sy: puff, ease: "back" },
          { at: SETTLED - 5, sx: 1.03, sy: 1.03, ease: "inOut" },
        ],
      },
      // The dog: lean in, stand up with it, lean to set it down, then the jump.
      d: {
        origin: [0, 0],
        keys: [
          { at: 0, rot: 0, y: 0, sx: 1, sy: 1 },
          { at: 200, rot: 0 },
          { at: PICK, rot: 6, ease: "inOut" },
          { at: HELD - 20, rot: 0, ease: "inOut" },
          { at: 1000, rot: 5, ease: "inOut" },
          { at: PUT, rot: 0, ease: "out" },
          { at: CLANK, y: 0, sx: 1, sy: 1 },
          { at: CLANK + 90, y: -jump, sx: 0.9, sy: 1.12, ease: "out" },
          // Hangs in the air for a beat, frozen in shock.
          { at: CLANK + 250, y: -jump * 0.92, sx: 0.94, sy: 1.08, ease: "inOut" },
          { at: CLANK + 340, y: 0, sx: 1, sy: 1, ease: "in" },
          { at: CLANK + 380, sx: 1.08, sy: 0.92, ease: "out" },
          { at: SETTLED - 5, sx: 1, sy: 1, rot: 0, ease: "out" },
          // Leans away from the can, then trembles.
          { at: SETTLED + 120, rot: -6, ease: "out" },
          ...shake(SETTLED + 140, 2000, 0.8, 6, "x").slice(1),
        ],
      },
      // The can in its paws is shown from HELD to PUT; the loose can is shown the rest of the time.
      "d.heldCan": { keys: showBetween(HELD, PUT) },
      // The loose can: lifted off the floor, set back down, then lands with a wobble.
      can: {
        origin: [CAN_X, GROUND],
        keys: [
          { at: 0, x: 0, y: 0, rot: 0, o: 1 },
          { at: PICK, x: 0, y: 0 },
          { at: HELD - 1, x: DX - CAN_X, y: -CAN_LIFT, ease: "inOut" },
          { at: HELD, o: 0, ease: "step" },
          { at: PUT, o: 1, ease: "step" },
          { at: CLANK, x: 0, y: 0, ease: "in" },
          { at: CLANK + 40, rot: 7, ease: "out" },
          { at: CLANK + 90, rot: -4, ease: "inOut" },
          { at: CLANK + 140, rot: 2, ease: "inOut" },
          { at: SETTLED - 5, rot: 0, ease: "inOut" },
        ],
      },
      // Two little sparks at the clank, bursting out from the can's base.
      clank: {
        origin: [CAN_X, GROUND - 6],
        keys: [
          { at: 0, o: 0, sx: 0.8, sy: 0.8 },
          { at: CLANK - 1, o: 0, ease: "step" },
          { at: CLANK, o: 1, sx: 0.8, sy: 0.8, ease: "step" },
          { at: CLANK + 120, sx: 1.5, sy: 1.5, o: 0, ease: "out" },
        ],
      },
      // A "!" pops over its head at the jump, then is gone.
      bang: {
        origin: BANG,
        keys: [
          { at: 0, sx: 0, sy: 0, o: 0 },
          { at: CLANK + 19, sx: 0, sy: 0, o: 0, ease: "step" },
          { at: CLANK + 20, sx: 0.3, sy: 0.3, o: 1, ease: "step" },
          { at: CLANK + 90, sx: 1.15, sy: 1.15, ease: "back" },
          { at: CLANK + 150, sx: 1, sy: 1, ease: "out" },
          { at: SETTLED, o: 0, ease: "step" },
        ],
      },
      // The shadow shrinks when the dog is up in the air.
      shadow: {
        origin: [DX, GROUND],
        keys: [
          { at: CLANK, sx: 1 },
          { at: CLANK + 90, sx: 0.78, ease: "out" },
          { at: CLANK + 250, sx: 0.8 },
          { at: CLANK + 340, sx: 1, ease: "in" },
          { at: CLANK + 380, sx: 1.06, ease: "out" },
          { at: SETTLED - 5, sx: 1, ease: "out" },
        ],
      },
    };
  },
};
