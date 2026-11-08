// Tiny keyframe engine for the story animations (no libraries).
//
// A scene is a set of tracks. Each track moves one SVG part (`data-part="..."`)
// through keyframes in milliseconds. `frameAt` turns a time into an SVG transform
// per part, so the same scene can play live (requestAnimationFrame) or be rendered
// frame by frame offline (GIF export).

export type Pose = { x: number; y: number; rot: number; sx: number; sy: number; o: number };
export type Ease = "linear" | "in" | "out" | "inOut" | "back" | "bounce" | "step";
/** A keyframe: time in ms + any pose fields (missing fields carry over from the previous key). */
export type Key = Partial<Pose> & { at: number; ease?: Ease };
/** origin = pivot for rotate/scale, in the part's parent coordinates. */
export type Track = { origin?: [number, number]; keys: Key[] };
export type Tracks = Record<string, Track>;

export const REST: Pose = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, o: 1 };
const FIELDS = ["x", "y", "rot", "sx", "sy", "o"] as const;

const bounceOut = (t: number) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

export const EASE: Record<Ease, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  back: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
  bounce: bounceOut,
  step: (t) => (t < 1 ? 0 : 1),
};

/** Fill in every key's missing fields from the key before it (the first from REST). */
function resolve(keys: Key[]): (Pose & { at: number; ease: Ease })[] {
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  let prev: Pose = REST;
  return sorted.map((k) => {
    const p: Pose = { ...prev };
    for (const f of FIELDS) if (k[f] !== undefined) p[f] = k[f]!;
    prev = p;
    return { ...p, at: k.at, ease: k.ease ?? "inOut" };
  });
}

const cache = new WeakMap<Key[], ReturnType<typeof resolve>>();

/** Pose of a track at time `ms`. Before the first key: first key; after the last: last key. */
export function sample(track: Track, ms: number): Pose {
  let keys = cache.get(track.keys);
  if (!keys) cache.set(track.keys, (keys = resolve(track.keys)));
  if (!keys.length) return REST;
  if (ms <= keys[0].at) return keys[0];
  const last = keys[keys.length - 1];
  if (ms >= last.at) return last;
  let i = 1;
  while (keys[i].at < ms) i++;
  const a = keys[i - 1];
  const b = keys[i];
  const span = b.at - a.at;
  const k = span <= 0 ? 1 : EASE[b.ease]((ms - a.at) / span);
  const out = { ...REST };
  for (const f of FIELDS) out[f] = a[f] + (b[f] - a[f]) * k;
  return out;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** SVG transform for a pose around `origin`. */
export function transformOf(p: Pose, origin: [number, number] = [0, 0]): string {
  const [ox, oy] = origin;
  return `translate(${r2(p.x + ox)} ${r2(p.y + oy)}) rotate(${r2(p.rot)}) scale(${r2(p.sx)} ${r2(p.sy)}) translate(${r2(-ox)} ${r2(-oy)})`;
}

/** Transform + opacity for every part at time `ms`. */
export function frameAt(tracks: Tracks, ms: number): Record<string, { transform: string; opacity: number }> {
  const out: Record<string, { transform: string; opacity: number }> = {};
  for (const [part, track] of Object.entries(tracks)) {
    const p = sample(track, ms);
    out[part] = { transform: transformOf(p, track.origin), opacity: r2(Math.max(0, Math.min(1, p.o))) };
  }
  return out;
}

// ---------- helpers for writing scenes ----------

/** Eyes blink (scale Y down and back) starting at `at`. */
export function blink(at: number, dur = 160): Key[] {
  return [
    { at, sy: 1 },
    { at: at + dur * 0.45, sy: 0.08, ease: "in" },
    { at: at + dur, sy: 1, ease: "out" },
  ];
}

/** Side-to-side shake of `amp` units, `n` times, between `from` and `to`. */
export function shake(from: number, to: number, amp: number, n = 4, field: "x" | "rot" = "x"): Key[] {
  const keys: Key[] = [{ at: from, [field]: 0 }];
  for (let i = 1; i <= n; i++) keys.push({ at: from + ((to - from) * i) / (n + 1), [field]: i % 2 ? amp : -amp, ease: "inOut" });
  keys.push({ at: to, [field]: 0 });
  return keys;
}

/** Visible only from `from` to `to` (hard cut), for swapping eyes/mouth shapes. */
export function showBetween(from: number, to = Infinity): Key[] {
  const keys: Key[] = [{ at: 0, o: 0 }, { at: from, o: 1, ease: "step" }];
  if (Number.isFinite(to)) keys.push({ at: to, o: 0, ease: "step" });
  return keys;
}

/** Visible except between `from` and `to`. */
export function hideBetween(from: number, to = Infinity): Key[] {
  const keys: Key[] = [{ at: 0, o: 1 }, { at: from, o: 0, ease: "step" }];
  if (Number.isFinite(to)) keys.push({ at: to, o: 1, ease: "step" });
  return keys;
}
