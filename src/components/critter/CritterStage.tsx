"use client";
import "./critter.css";
import type { MoodIntent } from "@/lib/critter/catalog";
import { CatGeneral } from "./scenes/CatGeneral";
import { CatMeetingFatigue } from "./scenes/CatMeetingFatigue";

// Register scene art here. Unregistered scenes render the general fallback.
const SCENE_ART: Partial<Record<MoodIntent, () => React.JSX.Element>> = {
  meeting_fatigue: CatMeetingFatigue,
  general: CatGeneral,
};

export function CritterStage({ sceneId, alt, playKey, paused }: { sceneId: MoodIntent; alt: string; playKey: number; paused: boolean }) {
  const Scene = SCENE_ART[sceneId] ?? CatGeneral;
  return (
    <div role="img" aria-label={alt} className={`cr-stage mx-auto w-full max-w-xs ${paused ? "cr-paused" : ""}`} style={{ aspectRatio: "240 / 232" }}>
      <Scene key={playKey} />
    </div>
  );
}
