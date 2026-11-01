"use client";
import { useState } from "react";
import Link from "next/link";
import type { AnimationSelection } from "@/lib/critter/match";
import { MAX_MOOD_LENGTH } from "@/lib/critter/match";
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

export default function CritterPage() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [playKey, setPlayKey] = useState(0);
  const [paused, setPaused] = useState(false);

  const trimmed = text.trim();
  const tooLong = trimmed.length > MAX_MOOD_LENGTH;

  async function request(input: string, variant: number) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/critter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input, variant }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Something went wrong.");
      setResult(d.crisis ? { kind: "crisis", message: d.message } : { kind: "scene", selection: d.selection });
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

  function tryAnother() {
    if (result?.kind !== "scene" || busy) return;
    request(submitted, result.selection.variant + 1);
  }

  const btn = "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Express with a critter</h1>
        <p className="text-sm text-slate-600">Turn how you feel into a tiny animated story.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-2">
        <label htmlFor="mood-text" className="block text-sm font-medium">What&apos;s your mood in one sentence?</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="mood-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_MOOD_LENGTH + 20}
            placeholder="I'm so done with meetings."
            aria-invalid={tooLong}
            aria-describedby="mood-help"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2"
          />
          <button disabled={busy || !trimmed || tooLong} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? "Making…" : "Make my mood"}
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

      {result?.kind === "scene" && (
        <section aria-label="Your critter" className={`space-y-3 rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 ${busy ? "opacity-70" : ""}`}>
          <CritterStage sceneId={result.selection.sceneId} alt={result.selection.alt} playKey={playKey} paused={paused} />
          <p aria-live="polite" className="text-center text-lg font-medium">{result.selection.caption}</p>
          {result.selection.comingSoon && (
            <p className="text-center text-xs text-slate-500">A critter for this exact mood is still being drawn. Here&apos;s Miso in the meantime.</p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className={btn} onClick={() => { setPaused(false); setPlayKey((k) => k + 1); }}>Replay</button>
            <button type="button" className={btn} onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? "Play" : "Pause"}</button>
            <button type="button" className={btn} onClick={tryAnother} disabled={busy}>Try another</button>
          </div>
          {result.selection.sceneId === "general" && (
            <p className="text-center text-xs text-slate-500">
              Want to say more? <Link href="/chat" className="text-indigo-600 underline">Chat with Calmly</Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
