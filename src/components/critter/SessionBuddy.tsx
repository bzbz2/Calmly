"use client";
import "./critter.css";
import { useEffect, useRef, useState } from "react";
import type { Feeling, Lang } from "@/lib/critter/catalog";
import { sessionMood, sessionSelection, type SessionMessage } from "@/lib/critter/session";
import { nextPhoto, photo, photoSrc, needsCredit, type PhotoId } from "@/lib/critter/photos";
import { preferredPhoto, type AnimalPrefs, type PrefSignal } from "@/lib/personal/animals";
import { CritterStage, motionOf } from "./CritterStage";
import { FeelingPicker } from "./FeelingPicker";

// The session's mood buddy. It follows the user's latest clear mood (see sessionMood).
// "sidebar" = full card pinned to the bottom of the chat history (desktop).
// "inline"  = compact row above the messages (mobile, where the sidebar is hidden).
// Key it by the mood's source message + feeling so photo/caption swaps reset when the
// mood changes, and the card fades in to show the update.
//
// Personal touches: starts with the user's favourite animal (prefs), learns from
// "Another photo" (onPref), lets the user correct the feeling (onCorrect), and can be
// shared as an image (photo + label + caption only, never the user's message).

const UI = {
  en: { title: "How you're feeling", replay: "Replay", pause: "Pause", play: "Play", photo: "Another photo", caption: "Another caption", share: "Share as image", shared: "Shared", saved: "Image saved", fix: "Not quite right? Tap to change" },
  zh: { title: "此刻的你", replay: "重播", pause: "暂停", play: "播放", photo: "换张照片", caption: "换句话", share: "分享为图片", shared: "已分享", saved: "图片已保存", fix: "不太对？点一下修改" },
} as const;

/** How long the user has to stay on a photo for it to count as liked. */
const SETTLE_MS = 4000;

type Props = {
  msgs: SessionMessage[];
  layout: "sidebar" | "inline";
  prefs?: AnimalPrefs;
  onPref?: (s: PrefSignal) => void;
  onCorrect?: (sourceIndex: number, feeling: Feeling) => void;
};

export function SessionBuddy({ msgs, layout, prefs, onPref, onCorrect }: Props) {
  const [variant, setVariant] = useState(0);
  const [photoId, setPhotoId] = useState<PhotoId | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [picking, setPicking] = useState(false);
  const [note, setNote] = useState("");
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(settle.current), []);

  const mood = sessionMood(msgs, { variant });
  if (!mood) return null;
  const sel = mood.selection;

  // Keep the first default photo for this card, so prefs updating mid-card doesn't swap it.
  const pid = photoId ?? preferredPhoto(sel.feeling, prefs);
  const t = UI[sel.lang];
  const replay = () => { setPaused(false); setPlayKey((k) => k + 1); };
  const swapPhoto = () => {
    const next = nextPhoto(sel.feeling, pid);
    onPref?.({ photoId: pid, action: "skip" });
    clearTimeout(settle.current);
    settle.current = setTimeout(() => onPref?.({ photoId: next, action: "settle" }), SETTLE_MS);
    setPhotoId(next);
    replay();
  };
  const swapCaption = () => { setVariant((v) => v + 1); replay(); };
  const correct = (f: Feeling) => {
    setPicking(false);
    if (f !== sel.feeling) onCorrect?.(mood.sourceIndex, f);
  };
  const share = async () => {
    const { shareCard } = await import("./shareCard");
    try {
      const r = await shareCard({ photoId: pid, label: sel.feelingLabel, caption: sel.caption, feeling: sel.feeling });
      if (r !== "cancelled") setNote(r === "shared" ? t.shared : t.saved);
    } catch {
      setNote("…");
    }
    setTimeout(() => setNote(""), 2500);
  };

  const labelBtn = (cls: string) =>
    onCorrect ? (
      <button type="button" onClick={() => setPicking((p) => !p)} aria-expanded={picking} title={t.fix} className={`${cls} rounded-full hover:bg-slate-100`}>
        {sel.feelingLabel} <span aria-hidden="true" className="text-slate-400">▾</span>
        <span className="sr-only">. {t.fix}</span>
      </button>
    ) : (
      <span className={cls}>{sel.feelingLabel}</span>
    );
  const picker = picking && <FeelingPicker lang={sel.lang} current={sel.feeling} onPick={correct} onClose={() => setPicking(false)} />;

  if (layout === "inline") {
    const p = photo(pid);
    return (
      <div className="cr-enter space-y-2" lang={sel.lang}>
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-2 pr-3 ring-1 ring-slate-200" aria-live="polite">
          <button type="button" onClick={swapPhoto} aria-label={t.photo} title={t.photo} className={`cr-card cr-m-${motionOf(sel.sceneId)} relative h-14 w-14 shrink-0 overflow-hidden rounded-xl`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- small static JPEG; motion is CSS */}
            <img src={photoSrc(pid)} alt={p.alt} className="cr-photo h-full w-full object-cover" style={{ objectPosition: p.pos ?? "50% 40%" }} />
          </button>
          <div className="min-w-0 flex-1">
            {labelBtn("-ml-1 px-1 text-[11px] font-semibold text-slate-500")}
            <p className="truncate text-[13px] text-slate-800">{sel.caption}</p>
            <p className="truncate text-[10px] text-slate-400">
              <a href={p.source} target="_blank" rel="noreferrer" className="hover:underline">Photo: {needsCredit(p) ? p.author : "Wikimedia Commons"} · {p.license}</a>
            </p>
          </div>
          <button type="button" onClick={swapCaption} aria-label={t.caption} title={t.caption} className="shrink-0 rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">💬</button>
          <button type="button" onClick={share} aria-label={t.share} title={t.share} className="shrink-0 rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">⤴</button>
        </div>
        {picker}
        {note && <p role="status" className="text-center text-[11px] text-slate-500">{note}</p>}
      </div>
    );
  }

  const icon = "flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-slate-500 ring-1 ring-slate-200 hover:bg-white";
  return (
    <section aria-label={t.title} aria-live="polite" className="cr-enter relative space-y-2 border-t border-slate-200 pt-3" lang={sel.lang}>
      <div className="flex items-center justify-between gap-1 px-1">
        <p className="text-[11px] font-medium tracking-wide text-slate-400">{t.title}</p>
        {labelBtn("px-1.5 text-[11px] font-semibold text-slate-600")}
      </div>
      {picker && <div className="absolute inset-x-0 bottom-full mb-1">{picker}</div>}
      <CritterStage sceneId={sel.sceneId} photoId={pid} caption={sel.caption} label={sel.feelingLabel} lang={sel.lang} playKey={playKey} paused={paused} />
      <div className="flex justify-center gap-1.5">
        <button type="button" className={icon} onClick={replay} aria-label={t.replay} title={t.replay}>↻</button>
        <button type="button" className={icon} onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? t.play : t.pause} title={paused ? t.play : t.pause}>{paused ? "▶" : "❚❚"}</button>
        <button type="button" className={icon} onClick={swapPhoto} aria-label={t.photo} title={t.photo}>🖼</button>
        <button type="button" className={icon} onClick={swapCaption} aria-label={t.caption} title={t.caption}>💬</button>
        <button type="button" className={icon} onClick={share} aria-label={t.share} title={t.share}>⤴</button>
      </div>
      {note && <p role="status" className="text-center text-[11px] text-slate-500">{note}</p>}
    </section>
  );
}

/**
 * Placeholder buddy on the first screen of a new chat, so there's a face before the
 * user types. A calm photo of their favourite animal; it's replaced by their mood buddy
 * as soon as they share how they feel.
 */
export function WelcomeBuddy({ lang, label, caption, prefs }: { lang: Lang; label: string; caption: string; prefs?: AnimalPrefs }) {
  return (
    <div className="cr-enter mx-auto w-44 sm:w-52">
      <CritterStage sceneId="feel_calm" photoId={preferredPhoto("calm", prefs)} caption={caption} label={label} lang={lang} playKey={0} paused={false} />
    </div>
  );
}

/**
 * Tiny per-session thumbnail for the chat history list. Uses the conversation title
 * (its opening line), or `photoId` for the open chat so it matches the live buddy.
 */
export function SessionThumb({ title, photoId, prefs }: { title: string; photoId?: PhotoId | null; prefs?: AnimalPrefs }) {
  let id = photoId;
  if (id === undefined) {
    const sel = sessionSelection(title);
    id = sel ? preferredPhoto(sel.feeling, prefs) : null;
  }
  if (!id) return <span className="h-6 w-6 shrink-0 rounded-md bg-slate-200" aria-hidden="true" />;
  const p = photo(id);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative 24px thumbnail
    <img src={photoSrc(id)} alt="" aria-hidden="true" className="h-6 w-6 shrink-0 rounded-md object-cover" style={{ objectPosition: p.pos ?? "50% 40%" }} />
  );
}
