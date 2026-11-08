"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/critter/catalog";
import { STORY_SCENES, type SceneId } from "@/lib/story/scenes";
import type { Intensity } from "./kit";
import { hasArt } from "./registry";
import { TileCaption, tilePad } from "./StoryCard";
import StoryStage, { sceneDuration } from "./StoryStage";

function Card({ id, intensity, speed, playAll, lang }: { id: SceneId; intensity: Intensity; speed: number; playAll: number; lang: Lang }) {
  const [play, setPlay] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const meta = STORY_SCENES.find((s) => s.id === id)!;
  const dur = sceneDuration(id);
  const caption = meta.caption[lang];
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
      <button type="button" title={`${id} · ${meta.character} · ${dur}ms`} style={tilePad(id, caption)} className="@container relative block w-full rounded-xl ring-1 ring-black/5" onClick={() => (setScrub(null), setPlay((n) => n + 1))} aria-label="Replay">
        <StoryStage sceneId={id} intensity={intensity} speed={speed} playKey={play + playAll * 1000} at={scrub ?? undefined} className="block aspect-square w-full rounded-xl" />
        <TileCaption text={caption} />
      </button>
      <input
        type="range"
        min={0}
        max={dur}
        step={20}
        value={scrub ?? dur}
        onChange={(e) => setScrub(Number(e.target.value))}
        className="mt-2 w-full"
        aria-label="Scrub"
      />
    </div>
  );
}

export default function StoryLab() {
  const [intensity, setIntensity] = useState<Intensity>(2);
  const [speed, setSpeed] = useState(1);
  const [playAll, setPlayAll] = useState(0);
  const [onlyDone, setOnlyDone] = useState(true);
  // One caption, in the viewer's language (like the app); hover a tile for its id.
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en"), []);
  const ids = STORY_SCENES.map((s) => s.id).filter((id) => !onlyDone || hasArt(id));
  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-xl font-semibold">Story lab</h1>
      <p className="text-sm text-gray-500">Tap a scene to replay. Drag the slider to scrub. Dev only.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1">
          Intensity
          {([1, 2, 3] as const).map((n) => (
            <button key={n} type="button" onClick={() => setIntensity(n)} className={`rounded-full px-2 py-0.5 ${intensity === n ? "bg-gray-900 text-white" : "bg-gray-100"}`}>
              {n}
            </button>
          ))}
        </label>
        <label className="flex items-center gap-1">
          Speed
          {[1, 0.5, 0.25].map((n) => (
            <button key={n} type="button" onClick={() => setSpeed(n)} className={`rounded-full px-2 py-0.5 ${speed === n ? "bg-gray-900 text-white" : "bg-gray-100"}`}>
              {n}×
            </button>
          ))}
        </label>
        <button type="button" onClick={() => setPlayAll((n) => n + 1)} className="rounded-full bg-gray-100 px-3 py-0.5">
          ▶ Play all
        </button>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={onlyDone} onChange={(e) => setOnlyDone(e.target.checked)} /> Drawn only
        </label>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3">
        {ids.map((id) => (
          <Card key={id} id={id} intensity={intensity} speed={speed} playAll={playAll} lang={lang} />
        ))}
      </div>
    </div>
  );
}
