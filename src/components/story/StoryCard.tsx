"use client";

// A story animation as a sticker card: the drawn scene on a soft white tile with the
// caption written inside the tile, in the empty space above the animal; tap to replay. Used where
// the app shows a buddy outside the lab (the first screen, the "Miss you" gift).

import { useState } from "react";
import type { SceneId } from "@/lib/story/scenes";
import { captionPad } from "./headroom";
import type { Intensity } from "./kit";
import StoryStage from "./StoryStage";

type Props = {
  sceneId: SceneId;
  caption: string;
  label: string;
  intensity?: Intensity;
  /** Hold the last frame this long, then play again. Omit to play once. */
  loop?: number;
  replayLabel?: string;
};

/**
 * The caption inside the tile, in a band across the top, above the animal. Sizes are
 * in container units so it scales with the tile; long texts (custom gift messages)
 * get a smaller font so they still fit the band in three lines.
 */
export function TileCaption({ text }: { text: string }) {
  const long = [...text].length > (/[\u3000-\u9fff]/.test(text) ? 24 : 46);
  return (
    <span
      className={`pointer-events-none absolute inset-x-0 top-0 block px-[5cqw] pt-[4cqw] text-center font-semibold text-slate-700 ${long ? "text-[clamp(10px,5.4cqw,14px)] leading-[1.22]" : "text-[clamp(12px,7cqw,17px)] leading-[1.3]"}`}
    >
      {text}
    </span>
  );
}

/** Top padding (as a style) that makes room for the caption band on this scene. */
export const tilePad = (id: SceneId, caption: string) => (caption ? { paddingTop: `${captionPad(id)}%` } : undefined);

export default function StoryCard({ sceneId, caption, label, intensity = 2, loop, replayLabel = "Replay" }: Props) {
  const [play, setPlay] = useState(0);
  return (
    <figure>
      <button
        type="button"
        onClick={() => setPlay((n) => n + 1)}
        aria-label={`${label}. ${replayLabel}`}
        style={tilePad(sceneId, caption)}
        className="@container relative block w-full rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <StoryStage sceneId={sceneId} intensity={intensity} playKey={play} loop={loop} label={label} className="block aspect-square w-full" />
        {/* A span, not <figcaption>: a button may only hold phrasing content. */}
        {caption && <TileCaption text={caption} />}
      </button>
    </figure>
  );
}
