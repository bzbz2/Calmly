// Shared pieces for story scenes: the scene contract, backdrop and small props.

import type { ReactNode } from "react";
import type { SceneId } from "@/lib/story/scenes";
import type { Tracks } from "@/lib/story/timeline";

export type Intensity = 1 | 2 | 3;

/** Art + motion for one scene. Drawn in a 200×200 viewBox; ground line at y≈172. */
export type SceneArt = {
  id: SceneId;
  draw: (o: { intensity: Intensity }) => ReactNode;
  tracks: (o: { intensity: Intensity }) => Tracks;
};

export const GROUND = 184;

const TONES = {
  warm: ["#fff7ec", "#fde8cf", "#f6d9b8"],
  cool: ["#f1f5ff", "#e2e9fb", "#d3dcf3"],
  mint: ["#effbf4", "#daf3e5", "#c5e8d3"],
  rose: ["#fff3f5", "#fbe1e7", "#f2cfd8"],
  lilac: ["#f6f2ff", "#e9e1fb", "#dcd0f4"],
} as const;
export type Tone = keyof typeof TONES;

/** Sticker style: no painted background, the scene sits on whatever is behind it.
 * Kept as a component (with its tone) so scenes can opt back into a backdrop later. */
export function Backdrop(_: { id: string; tone?: Tone }) {
  return null;
}

/** Soft contact shadow; give it a data-part to animate it. (The animated <g> carries no
 * opacity of its own, so the engine's style.opacity doesn't wipe out the 0.08.) */
export function Shadow({ part, x, w = 34 }: { part?: string; x: number; w?: number }) {
  return (
    <g data-part={part}>
      <ellipse cx={x} cy={GROUND + 1.5} rx={w} ry={4.5} fill="#000" opacity={0.08} />
    </g>
  );
}

/** A sheet of paper, `w` wide, top-left at (x, y). */
export function Sheet({ x, y, w = 44, h = 3, tint = "#ffffff" }: { x: number; y: number; w?: number; h?: number; tint?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={0.8} fill={tint} stroke="#c7cdd8" strokeWidth={0.6} />;
}

/** "!" burst. */
export function Bang({ x, y, color = "#f59e0b" }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-11 -6 l-5 -3 M11 -6 l5 -3 M-12 4 l-6 1 M12 4 l6 1" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <rect x={-2.8} y={-12} width={5.6} height={15} rx={2.8} fill={color} />
      <circle cx={0} cy={8} r={3} fill={color} />
    </g>
  );
}

/** Speech bubble with "blah" squiggles, pointing down-left (`flip`: down-right). */
export function Bubble({ x, y, w = 50, h = 28, flip }: { x: number; y: number; w?: number; h?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? " scale(-1 1)" : ""}`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill="#ffffff" stroke="#b9bfcc" strokeWidth={1.5} />
      <path d={`M${-w / 2 + 12} ${h / 2 - 1} l-9 9 l14 -6`} fill="#ffffff" stroke="#b9bfcc" strokeWidth={1.5} strokeLinejoin="round" />
      <path d={`M${-w / 2 + 11} ${h / 2 - 1} h12`} stroke="#ffffff" strokeWidth={2.2} />
      <path
        d={`M${-w / 2 + 9} -3 q3 -4 6 0 q3 4 6 0 q3 -4 6 0 q3 4 6 0 q3 -4 6 0 M${-w / 2 + 9} 5 q3 -4 6 0 q3 4 6 0 q3 -4 6 0`}
        stroke="#9aa3b5"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

const PAPER_TINTS = ["#ffffff", "#ffffff", "#fff4cf", "#ffffff", "#e6f0ff"];

/** A pile of `n` thick paper sheets standing on (x, bottom), centered on x. */
export function PaperPile({ x, bottom, n, w = 46, h = 4.6, seed = 0 }: { x: number; bottom: number; n: number; w?: number; h?: number; seed?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const j = ((i + seed) * 7) % 5;
        return <rect key={i} x={x - w / 2 + j - 2} y={bottom - (i + 1) * h} width={w} height={h} rx={1} fill={PAPER_TINTS[(i + seed) % PAPER_TINTS.length]} stroke="#8a7766" strokeWidth={1.1} />;
      })}
    </>
  );
}

/** A floating soap bubble. */
export function SoapBubble({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#cfeaff" fillOpacity={0.7} stroke="#4f9ad6" strokeWidth={2} />
      <circle cx={x + r * 0.35} cy={y + r * 0.35} r={r * 0.55} fill="#f3c6ff" fillOpacity={0.35} />
      <path d={`M${x - r * 0.55} ${y - r * 0.2} a${r * 0.6} ${r * 0.6} 0 0 1 ${r * 0.45} ${-r * 0.45}`} stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <circle cx={x + r * 0.45} cy={y - r * 0.5} r={r * 0.12} fill="#ffffff" />
    </g>
  );
}

/** A little "pop" burst of short lines. */
export function Spark({ x, y, color = "#8fcaf0" }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth={1.6} strokeLinecap="round">
      <path d="M0 -7 v-4 M0 7 v4 M-7 0 h-4 M7 0 h4 M-5 -5 l-3 -3 M5 -5 l3 -3 M-5 5 l-3 3 M5 5 l3 3" />
    </g>
  );
}

/** A hand-drawn "?". */
export function Question({ x, y, color = "#8b7fd6" }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-4.5 -7 a5 5 0 1 1 7.4 4.4 c-2.2 1.2 -2.9 2.4 -2.9 4.6" stroke={color} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <circle cx={0} cy={7} r={1.7} fill={color} />
    </g>
  );
}

/** A phone lying on the floor, seen from a little above. `screen` is its lit display (hidden until animated). */
export function Phone({ x, y, part }: { x: number; y: number; part: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-6)`}>
      <rect x={-19} y={-7} width={38} height={14} rx={4} fill="#4b4f63" stroke="#5b4636" strokeWidth={1.8} />
      <rect x={-15.5} y={-4.5} width={31} height={9} rx={2.4} fill="#2c2f3d" />
      <g data-part={part} style={{ opacity: 0 }}>
        <rect x={-15.5} y={-4.5} width={31} height={9} rx={2.4} fill="#cfeaff" />
        <path d="M-9 0 h18" stroke="#9cc3e6" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="0.1 4" />
      </g>
    </g>
  );
}

/** A soft rounded ledge (wall top) drawn in front of a character, for peeking. Top edge at y. */
export function Ledge({ y, color = "#f6dcb8" }: { y: number; color?: string }) {
  return (
    <g>
      <rect x={6} y={y} width={188} height={200 - y + 8} rx={10} fill={color} stroke="#5b4636" strokeWidth={2.3} />
      <path d={`M16 ${y + 7} H184`} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** A little heart centered on (x, y). */
export function Heart({ x, y, size = 10, color = "#ff7a93" }: { x: number; y: number; size?: number; color?: string }) {
  const s = size / 10;
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 4 C-1 3 -6 0 -6 -3.4 C-6 -6 -3.2 -7.2 0 -4.4 C3.2 -7.2 6 -6 6 -3.4 C6 0 1 3 0 4 Z"
      fill={color}
      stroke="#5b4636"
      strokeWidth={1.2 / s}
      strokeLinejoin="round"
    />
  );
}
