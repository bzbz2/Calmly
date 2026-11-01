"use client";
import { useState } from "react";
import Link from "next/link";
import type { AnimationSelection } from "@/lib/critter/match";
import { MAX_MOOD_LENGTH } from "@/lib/critter/match";
import { HEAVY_FEELINGS } from "@/lib/critter/catalog";
import { nextPhoto, type PhotoId } from "@/lib/critter/photos";
import { CritterStage } from "./CritterStage";

type Result = { kind: "scene"; selection: AnimationSelection } | { kind: "crisis"; message: string };

// Render **bold** segments from the shared crisis message without a markdown lib.
function BoldText({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>))}
    </>
  );
}

const UI = {
  en: { replay: "Replay", pause: "Pause", play: "Play", photo: "Another photo", caption: "Another caption", talk: "Want to talk about it?", chat: "Chat with Calmly" },
  zh: { replay: "重播", pause: "暂停", play: "播放", photo: "换张照片", caption: "换句话", talk: "想聊聊吗？", chat: "和 Calmly 聊聊" },
} as const;

export default function CritterPage() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [playKey, setPlayKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [photoId, setPhotoId] = useState<PhotoId | null>(null);

  const trimmed = text.trim();
  const tooLong = trimmed.length > MAX_MOOD_LENGTH;

  async function request(input: string, variant: number, keepPhoto = false) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/critter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input, variant }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Something went wrong.");
      setResult(d.crisis ? { kind: "crisis", message: d.message } : { kind: "scene", selection: d.selection });
      if (!d.crisis && !keepPhoto) setPhotoId(d.selection.photoId);
      setPaused(false);
      setPlayKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again?");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || tooLong || busy) return;
    setSubmitted(trimmed);
    request(trimmed, 0);
  }

  function anotherCaption() {
    if (result?.kind !== "scene" || busy) return;
    request(submitted, result.selection.variant + 1, true);
  }

  // Same feeling and caption, another photo for it. Client-side only, no request.
  function anotherPhoto() {
    if (result?.kind !== "scene" || !photoId) return;
    setPhotoId(nextPhoto(result.selection.feeling, photoId));
    setPaused(false);
    setPlayKey((k) => k + 1);
  }

  const pill = "rounded-full px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-50";
  const scene = result?.kind === "scene" ? result.selection : null;
  const t = UI[scene?.lang ?? "en"];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <form onSubmit={onSubmit} className="space-y-2">
        <h1 className="text-2xl font-semibold">
          <label htmlFor="mood-text">How are you feeling today?</label>
        </h1>
        <div className="flex gap-2">
          <input
            id="mood-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_MOOD_LENGTH + 20}
            placeholder="I'm so done with meetings. / 明明不是我的错…"
            aria-invalid={tooLong}
            aria-describedby="mood-help"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2"
          />
          <button disabled={busy || !trimmed || tooLong} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? "…" : "Share"}
          </button>
        </div>
        <p id="mood-help" className={`text-xs ${tooLong ? "text-red-600" : "text-slate-500"}`}>
          {tooLong ? `Keep it to one sentence (${MAX_MOOD_LENGTH} characters max).` : "Private: your sentence isn't saved or added to your mood chart."}
        </p>
      </form>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {result?.kind === "crisis" && (
        <div role="alert" className="space-y-3 rounded-2xl bg-white p-5 text-sm ring-1 ring-rose-200">
          <p className="whitespace-pre-wrap"><BoldText text={result.message} /></p>
          <Link href="/chat" className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Talk it through in chat</Link>
        </div>
      )}

      {scene && photoId && (
        <section aria-label="Your feeling" aria-live="polite" className={`mx-auto max-w-[260px] space-y-3 ${busy ? "opacity-70" : ""}`}>
          <CritterStage
            sceneId={scene.sceneId}
            photoId={photoId}
            caption={scene.caption}
            label={scene.feelingLabel}
            lang={scene.lang}
            playKey={playKey}
            paused={paused}
          />
          <div className="flex flex-wrap justify-center gap-1.5" lang={scene.lang}>
            <button type="button" className={pill} onClick={() => { setPaused(false); setPlayKey((k) => k + 1); }}>{t.replay}</button>
            <button type="button" className={pill} onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? t.play : t.pause}</button>
            <button type="button" className={pill} onClick={anotherPhoto}>{t.photo}</button>
            <button type="button" className={pill} onClick={anotherCaption} disabled={busy}>{t.caption}</button>
          </div>
          {HEAVY_FEELINGS.includes(scene.feeling) && (
            <p className="text-center text-xs text-slate-500" lang={scene.lang}>
              {t.talk} <Link href="/chat" className="text-indigo-600 underline">{t.chat}</Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
