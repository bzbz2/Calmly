"use client";

// Plays one story scene: renders its SVG once, then moves the `data-part` groups
// frame by frame with requestAnimationFrame (no React re-renders while playing).
// Plays once and holds the last frame (or, with `loop`, holds it for `loop` ms and
// starts again, sticker-style); `playKey` changes replay it. With
// prefers-reduced-motion it just shows the last frame.

import { useLayoutEffect, useMemo, useRef } from "react";
import { sceneById, type SceneId } from "@/lib/story/scenes";
import { frameAt, type Tracks } from "@/lib/story/timeline";
import type { Intensity } from "./kit";
import { sceneArt } from "./registry";

type Frame = ReturnType<typeof frameAt>;
export type PartMap = Map<string, SVGElement>;

/** Every animatable element under `root`, by part name. */
export function collectParts(root: ParentNode): PartMap {
  const map: PartMap = new Map();
  root.querySelectorAll<SVGElement>("[data-part]").forEach((el) => {
    const name = el.getAttribute("data-part");
    if (name) map.set(name, el);
  });
  return map;
}

/** Apply one frame. Opacity goes on `style` because hidden alternates start with style opacity 0. */
export function applyFrame(parts: PartMap, frame: Frame) {
  for (const [name, f] of Object.entries(frame)) {
    const el = parts.get(name);
    if (!el) continue;
    el.setAttribute("transform", f.transform);
    el.style.opacity = String(f.opacity);
  }
}

export const sceneDuration = (id: SceneId) => sceneById(id)?.durationMs ?? 2000;

type Props = {
  sceneId: SceneId;
  intensity?: Intensity;
  /** Change to replay. */
  playKey?: number;
  /** Playback speed (lab slow-mo). */
  speed?: number;
  /** Replay forever, holding the last frame this many ms between plays. */
  loop?: number;
  /** Freeze at this time instead of playing (lab scrubber). */
  at?: number;
  className?: string;
  label?: string;
  onEnd?: () => void;
};

export default function StoryStage({ sceneId, intensity = 2, playKey = 0, speed = 1, loop, at, className, label, onEnd }: Props) {
  const art = sceneArt(sceneId);
  const svgRef = useRef<SVGSVGElement>(null);
  const tracks: Tracks = useMemo(() => art.tracks({ intensity }), [art, intensity]);
  const duration = sceneDuration(art.id);
  const onEndRef = useRef(onEnd);
  useLayoutEffect(() => {
    onEndRef.current = onEnd;
  });

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const parts = collectParts(svg);
    if (at !== undefined) {
      applyFrame(parts, frameAt(tracks, at));
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      applyFrame(parts, frameAt(tracks, duration));
      onEndRef.current?.();
      return;
    }
    applyFrame(parts, frameAt(tracks, 0));
    let raf = 0;
    let start = 0;
    let ended = false;
    const cycle = loop !== undefined ? duration + Math.max(0, loop) : Infinity;
    const tick = (now: number) => {
      if (!start) start = now;
      const elapsed = (now - start) * speed;
      const ms = elapsed % cycle;
      applyFrame(parts, frameAt(tracks, Math.min(ms, duration)));
      if (!ended && elapsed >= duration) {
        ended = true;
        onEndRef.current?.();
      }
      if (loop !== undefined || elapsed < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tracks, duration, playKey, speed, loop, at]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={label ?? sceneById(art.id)?.caption.en}
      // Re-mount the drawing when the scene/intensity changes so stale transforms never linger.
      key={`${art.id}-${intensity}`}
    >
      {art.draw({ intensity })}
    </svg>
  );
}
