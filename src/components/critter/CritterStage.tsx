"use client";
import "./critter.css";
import type { ArtId, Feeling, Lang } from "@/lib/critter/catalog";
import { photo, photoSrc, needsCredit, type PhotoId } from "@/lib/critter/photos";

// A real animal photo with a 1-2s micro-motion, a tiny overlay, and the caption laid over
// the bottom of the photo like a story/sticker. The photo's real expression carries the
// feeling; motion and overlay add the "inner monologue".

export type MotionKey = Feeling | "meeting";

export function motionOf(sceneId: ArtId): MotionKey {
  return sceneId.startsWith("feel_") ? (sceneId.slice(5) as Feeling) : "meeting";
}

const font = { fontFamily: "ui-rounded, system-ui, sans-serif", fontWeight: 800 } as const;
const heart = (x: number, y: number, s = 1) =>
  `M${x} ${y + 2.2 * s} c${-0.6 * s} ${-1.6 * s} ${-3.8 * s} ${-1.6 * s} ${-3.8 * s} ${-4 * s} c0 ${-1.9 * s} ${2.4 * s} ${-2.7 * s} ${3.8 * s} ${-0.8 * s} c${1.4 * s} ${-1.9 * s} ${3.8 * s} ${-1.1 * s} ${3.8 * s} ${0.8 * s} c0 ${2.4 * s} ${-3.2 * s} ${2.4 * s} ${-3.8 * s} ${4 * s} Z`;
const drop = (x: number, y: number) => `M${x} ${y} q-2.4 4 0 5.4 q2.4 -1.4 0 -5.4 Z`;
const sparkle = (x: number, y: number, s: number) =>
  `M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`;
const vein = (x: number, y: number) => `M${x - 3} ${y - 3} q2 2 0 4 M${x + 3} ${y - 3} q-2 2 0 4 M${x - 2} ${y - 4} q2 2 4 0 M${x - 2} ${y + 2} q2 -2 4 0`;
const puff = (x: number, y: number, r: number) => (
  <>
    <circle cx={x} cy={y} r={r} />
    <circle cx={x + r * 0.9} cy={y - r * 0.5} r={r * 0.7} />
  </>
);
const shadow = { filter: "drop-shadow(0 0.4px 0.8px rgba(0,0,0,.35))" };

/** Small symbols over the top of the photo (0-100 coordinates). */
function Overlay({ m }: { m: MotionKey }) {
  switch (m) {
    case "tired":
      return (
        <g fill="#ffffff" {...font} style={shadow}>
          <text className="cr-z cr-z-1" x="74" y="22" fontSize="6">z</text>
          <text className="cr-z cr-z-2" x="80" y="15" fontSize="8">z</text>
          <text className="cr-z cr-z-3" x="87" y="8" fontSize="10">Z</text>
        </g>
      );
    case "sad":
      return (
        <g style={shadow}>
          <path className="cr-cloud" d="M74 13 a4 4 0 0 1 4.5 -5.5 a5.5 5.5 0 0 1 10 0 a4 4 0 0 1 3.5 5.5 Z" fill="#e2e8f0" />
          <g stroke="#bfdbfe" strokeWidth="1.1" strokeLinecap="round">
            <path className="cr-rain cr-rain-1" d="M79 15.5 v3" />
            <path className="cr-rain cr-rain-2" d="M83.5 15.5 v3" />
            <path className="cr-rain cr-rain-3" d="M88 15.5 v3" />
          </g>
        </g>
      );
    case "wronged":
      return <path className="cr-drop" d={drop(86, 9)} fill="#bfe3ff" stroke="#ffffff" strokeWidth="0.5" style={shadow} />;
    case "jealous":
      return (
        <g className="cr-hearts" style={shadow}>
          <path d={heart(12, 14, 1)} fill="#f9a8d4" />
          <path d={heart(19.5, 9.5, 0.8)} fill="#f472b6" />
        </g>
      );
    case "regret":
      return (
        <g className="cr-balloon" style={shadow}>
          <path d="M80 30 q-2 6 0 10" stroke="#ffffff" strokeWidth="0.5" fill="none" />
          <ellipse cx="80" cy="23" rx="5.5" ry="7" fill="#fb7185" />
          <ellipse cx="78" cy="20.5" rx="1.4" ry="2.2" fill="#ffffff" opacity="0.5" />
        </g>
      );
    case "dejected":
      return <path className="cr-gloom" d="M40 3 v12 M46 2 v14 M52 2 v14 M58 3 v12" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="1.6 2" strokeLinecap="round" style={shadow} />;
    case "forlorn":
      return (
        <g className="cr-leaf" style={shadow}>
          <path d="M86 6 q5 -4 8 1 q-4 5 -8 -1 Z" fill="#f59e0b" />
          <path d="M86 6 l7 0" stroke="#b45309" strokeWidth="0.5" />
        </g>
      );
    case "lonely":
      return (
        <g className="cr-bubble" style={shadow}>
          <rect x="66" y="7" width="26" height="12" rx="6" fill="#ffffff" opacity="0.92" />
          <circle className="cr-dot cr-dot-1" cx="73" cy="13" r="1.4" fill="#94a3b8" />
          <circle className="cr-dot cr-dot-2" cx="79" cy="13" r="1.4" fill="#94a3b8" />
          <circle className="cr-dot cr-dot-3" cx="85" cy="13" r="1.4" fill="#94a3b8" />
        </g>
      );
    case "indignant":
      return <path className="cr-vein" d={vein(86, 12)} stroke="#ef4444" strokeWidth="1.3" fill="none" strokeLinecap="round" style={shadow} />;
    case "furious":
      return (
        <g style={shadow}>
          <path className="cr-vein" d={vein(86, 12)} stroke="#ef4444" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <g className="cr-steam cr-steam-l" fill="#f8fafc">{puff(10, 14, 3.2)}</g>
          <g className="cr-steam cr-steam-r" fill="#f8fafc">{puff(70, 10, 2.6)}</g>
        </g>
      );
    case "scared":
      return (
        <g className="cr-shiver" stroke="#ffffff" strokeWidth="1" fill="none" strokeLinecap="round" style={shadow}>
          <path d="M8 34 q-2 4 0 8 M4 32 q-2.5 6 0 12" />
          <path d="M92 34 q2 4 0 8 M96 32 q2.5 6 0 12" />
        </g>
      );
    case "anxious":
      return (
        <g style={shadow}>
          <path className="cr-thump" d={heart(86, 13, 1.2)} fill="#fb7185" />
          <path className="cr-drop" d={drop(12, 8)} fill="#cde6ff" stroke="#ffffff" strokeWidth="0.4" />
        </g>
      );
    case "on_edge":
      return (
        <g className="cr-weight" style={shadow}>
          <path d="M50 -2 V8" stroke="#e5e7eb" strokeWidth="0.5" />
          <path d="M44.5 16 L46 9 H54 L55.5 16 Z" fill="#374151" />
          <path d="M47.8 9 a2.2 2.2 0 0 1 4.4 0" stroke="#374151" strokeWidth="1" fill="none" />
        </g>
      );
    case "shocked":
      return (
        <g className="cr-bang" style={shadow}>
          <path d="M80 8 l-2 -3 M86 6 v-4 M92 8 l2 -3" stroke="#fbbf24" strokeWidth="1.1" strokeLinecap="round" />
          <text x="86" y="22" fontSize="13" textAnchor="middle" fill="#fbbf24" {...font}>!</text>
        </g>
      );
    case "stunned":
      return (
        <g fill="#ffffff" style={shadow}>
          <circle className="cr-dot cr-dot-1" cx="76" cy="12" r="1.5" />
          <circle className="cr-dot cr-dot-2" cx="82" cy="12" r="1.5" />
          <circle className="cr-dot cr-dot-3" cx="88" cy="12" r="1.5" />
        </g>
      );
    case "surprised":
      return (
        <text className="cr-bang" x="86" y="18" fontSize="11" textAnchor="middle" fill="#fbbf24" {...font} style={shadow}>
          !
        </text>
      );
    case "baffled":
      return (
        <g fill="#ffffff" {...font} style={shadow}>
          <text className="cr-q cr-q-1" x="86" y="17" fontSize="11" textAnchor="middle">?</text>
          <text className="cr-q cr-q-2" x="13" y="19" fontSize="8" textAnchor="middle">?</text>
        </g>
      );
    case "confused":
      return (
        <g>
          <g fill="#ffffff" opacity="0.55" style={{ filter: "blur(2.5px)" }}>
            <ellipse className="cr-fog cr-fog-1" cx="30" cy="40" rx="40" ry="6" />
            <ellipse className="cr-fog cr-fog-2" cx="70" cy="58" rx="40" ry="5" />
          </g>
          <text className="cr-q cr-q-1" x="86" y="16" fontSize="9" textAnchor="middle" fill="#ffffff" {...font} style={shadow}>?</text>
        </g>
      );
    case "disgusted":
      return (
        <g className="cr-stink" stroke="#a3e635" strokeWidth="0.9" fill="none" strokeLinecap="round" style={shadow}>
          <path className="cr-stink-1" d="M10 18 q-2 -2.5 0 -5 q2 -2.5 0 -5" />
          <path className="cr-stink-2" d="M15 17 q-2 -2.5 0 -5 q2 -2.5 0 -5" />
          <path className="cr-stink-3" d="M20 18 q-2 -2.5 0 -5 q2 -2.5 0 -5" />
        </g>
      );
    case "overwhelmed":
      return (
        <g fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" style={shadow}>
          {[8, 30, 62, 84].map((x, i) => (
            <g key={x} className={`cr-paper cr-paper-${i}`}>
              <rect x={x} y="-12" width="7" height="9" rx="1" />
              <path d={`M${x + 1.6} -9.5 h3.8 M${x + 1.6} -7.5 h3.8 M${x + 1.6} -5.5 h2.4`} stroke="#cbd5e1" strokeWidth="0.6" />
            </g>
          ))}
        </g>
      );
    case "torn":
      return (
        <g fill="#ffffff" style={shadow}>
          <ellipse className="cr-petal cr-petal-1" cx="82" cy="8" rx="1.4" ry="3" />
          <ellipse className="cr-petal cr-petal-2" cx="72" cy="6" rx="1.4" ry="3" />
        </g>
      );
    case "wistful":
      return (
        <>
          <defs>
            <radialGradient id="cr-flare">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle className="cr-flare" cx="14" cy="10" r="26" fill="url(#cr-flare)" />
        </>
      );
    case "bored":
      return (
        <g className="cr-fly">
          <circle cx="82" cy="16" r="7" fill="none" />
          <ellipse cx="82" cy="9" rx="1.2" ry="0.9" fill="#1f2937" />
          <ellipse className="cr-wing" cx="81.6" cy="7.9" rx="1.1" ry="0.7" fill="#e5e7eb" />
        </g>
      );
    case "relieved":
      return (
        <g className="cr-butterfly" style={shadow}>
          <path className="cr-wing cr-wing-l" d="M50 50 q-4.5 -5 -6 -1 q-1 3.5 6 1 q-5 2 -3.5 4.5 q1.5 1.5 3.5 -4.5 Z" fill="#c4b5fd" />
          <path className="cr-wing cr-wing-r" d="M50 50 q4.5 -5 6 -1 q1 3.5 -6 1 q5 2 3.5 4.5 q-1.5 1.5 -3.5 -4.5 Z" fill="#ddd6fe" />
        </g>
      );
    case "relaxed":
      return (
        <g style={shadow}>
          <g className="cr-sun">
            <circle cx="86" cy="12" r="4" fill="#fde047" />
            <path d="M86 4.5 v-2 M86 19.5 v2 M78.5 12 h-2 M93.5 12 h2 M80.7 6.7 l-1.4 -1.4 M91.3 17.3 l1.4 1.4 M80.7 17.3 l-1.4 1.4 M91.3 6.7 l1.4 -1.4" stroke="#fde047" strokeWidth="0.9" strokeLinecap="round" />
          </g>
          <path className="cr-tilde" d="M8 16 q2 -2 4 0 q2 2 4 0" stroke="#ffffff" strokeWidth="1" fill="none" strokeLinecap="round" />
        </g>
      );
    case "happy":
      return (
        <g fill="#fef08a" style={shadow}>
          <path className="cr-sparkle cr-sparkle-1" d={sparkle(12, 14, 3.5)} />
          <path className="cr-sparkle cr-sparkle-2" d={sparkle(86, 10, 4.5)} />
          <path className="cr-sparkle cr-sparkle-3" d={sparkle(90, 32, 2.6)} />
        </g>
      );
    case "elated":
      return (
        <g style={shadow}>
          <g fill="#ffffff" {...font}>
            <text className="cr-note cr-note-1" x="8" y="20" fontSize="8">♪</text>
            <text className="cr-note cr-note-2" x="84" y="16" fontSize="9">♫</text>
          </g>
          {[
            [18, "#f472b6"],
            [40, "#60a5fa"],
            [62, "#facc15"],
            [82, "#34d399"],
          ].map(([x, c], i) => (
            <rect key={i} className={`cr-confetti cr-confetti-${i}`} x={x as number} y="-4" width="2.2" height="3.4" rx="0.5" fill={c as string} />
          ))}
        </g>
      );
    case "mixed":
      return (
        <g style={shadow}>
          <circle cx="84" cy="13" r="6" fill="#fbcfe8" />
          <path className="cr-scribble" pathLength={1} d="M80 10 q4 2 8 0 M79.5 13.5 q4.5 -3 9 1 M80.5 16.5 q3.5 -5 7 -7" stroke="#ec4899" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        </g>
      );
    case "meeting":
      return (
        <g style={shadow}>
          <g className="cr-ping">
            <rect x="52" y="6" width="40" height="13" rx="6.5" fill="#ffffff" />
            <text x="72" y="14.6" fontSize="5.4" textAnchor="middle" fill="#334155" {...font}>Quick sync?</text>
          </g>
          <circle className="cr-badge" cx="91" cy="7" r="2.6" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
        </g>
      );
    default:
      return null;
  }
}

export function CritterStage({
  sceneId,
  photoId,
  caption,
  label,
  lang,
  playKey,
  paused,
}: {
  sceneId: ArtId;
  photoId: PhotoId;
  caption: string;
  label: string;
  lang: Lang;
  playKey: number;
  paused: boolean;
}) {
  const m = motionOf(sceneId);
  const p = photo(photoId);
  return (
    <div className="space-y-1.5">
      <figure
        key={playKey}
        className={`cr-card cr-m-${m} ${paused ? "cr-paused" : ""} relative aspect-square w-full overflow-hidden rounded-[22px] bg-slate-200 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.45)]`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- small static JPEGs; the motion is CSS on this element */}
        <img src={photoSrc(photoId)} alt={p.alt} draggable={false} className="cr-photo absolute inset-0 h-full w-full object-cover" style={{ objectPosition: p.pos ?? "50% 40%" }} />
        <div className="cr-tint pointer-events-none absolute inset-0" />
        <svg className="cr-overlay pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <Overlay m={m} />
        </svg>
        <figcaption
          lang={lang}
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3.5 pb-3 pt-12 text-[13px] font-medium leading-snug text-white"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,.35)" }}
        >
          <span className="mb-0.5 block text-[10.5px] font-semibold tracking-wide text-white/75">{label}</span>
          {caption}
        </figcaption>
      </figure>
      <p className="truncate px-1 text-[10px] text-slate-400">
        Photo:{" "}
        <a href={p.source} target="_blank" rel="noreferrer" className="hover:underline">
          {needsCredit(p) ? p.author : "Wikimedia Commons"}
        </a>
        {" · "}
        {p.licenseUrl ? (
          <a href={p.licenseUrl} target="_blank" rel="noreferrer" className="hover:underline">
            {p.license}
          </a>
        ) : (
          p.license
        )}
      </p>
    </div>
  );
}
