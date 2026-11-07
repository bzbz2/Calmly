"use client";
import "./critter.css";
import { useState } from "react";
import { sessionSelection } from "@/lib/critter/session";
import { nextPhoto, photo, photoSrc, needsCredit, type PhotoId } from "@/lib/critter/photos";
import { CritterStage, motionOf } from "./CritterStage";

// The session's mood buddy: one photo per chat, chosen from the first message.
// "sidebar" = full card pinned to the bottom of the chat history (desktop).
// "inline"  = compact row above the messages (mobile, where the sidebar is hidden).
// Give it key={firstUser} so swapping photo/caption resets per session.

const UI = {
  en: { title: "How you're feeling", replay: "Replay", pause: "Pause", play: "Play", photo: "Another photo", caption: "Another caption" },
  zh: { title: "此刻的你", replay: "重播", pause: "暂停", play: "播放", photo: "换张照片", caption: "换句话" },
} as const;

export function SessionBuddy({ firstUser, firstReply, layout }: { firstUser?: string; firstReply?: string; layout: "sidebar" | "inline" }) {
  const [variant, setVariant] = useState(0);
  const [photoId, setPhotoId] = useState<PhotoId | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [paused, setPaused] = useState(false);

  const sel = sessionSelection(firstUser, { variant, firstReply });
  if (!sel) return null;

  const pid = photoId ?? sel.photoId;
  const t = UI[sel.lang];
  const replay = () => { setPaused(false); setPlayKey((k) => k + 1); };
  const swapPhoto = () => { setPhotoId(nextPhoto(sel.feeling, pid)); replay(); };
  const swapCaption = () => { setVariant((v) => v + 1); replay(); };

  if (layout === "inline") {
    const p = photo(pid);
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-2 pr-3 ring-1 ring-slate-200" aria-live="polite">
        <button type="button" onClick={swapPhoto} aria-label={t.photo} title={t.photo} className={`cr-card cr-m-${motionOf(sel.sceneId)} relative h-14 w-14 shrink-0 overflow-hidden rounded-xl`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small static JPEG; motion is CSS */}
          <img src={photoSrc(pid)} alt={p.alt} className="cr-photo h-full w-full object-cover" style={{ objectPosition: p.pos ?? "50% 40%" }} />
        </button>
        <div className="min-w-0 flex-1" lang={sel.lang}>
          <p className="text-[11px] font-semibold text-slate-500">{sel.feelingLabel}</p>
          <p className="truncate text-[13px] text-slate-800">{sel.caption}</p>
          <p className="truncate text-[10px] text-slate-400">
            <a href={p.source} target="_blank" rel="noreferrer" className="hover:underline">Photo: {needsCredit(p) ? p.author : "Wikimedia Commons"} · {p.license}</a>
          </p>
        </div>
        <button type="button" onClick={swapCaption} aria-label={t.caption} title={t.caption} className="shrink-0 rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">💬</button>
      </div>
    );
  }

  const icon = "flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-slate-500 ring-1 ring-slate-200 hover:bg-white";
  return (
    <section aria-label={t.title} aria-live="polite" className="space-y-2 border-t border-slate-200 pt-3" lang={sel.lang}>
      <p className="px-1 text-[11px] font-medium tracking-wide text-slate-400">{t.title}</p>
      <CritterStage sceneId={sel.sceneId} photoId={pid} caption={sel.caption} label={sel.feelingLabel} lang={sel.lang} playKey={playKey} paused={paused} />
      <div className="flex justify-center gap-1.5">
        <button type="button" className={icon} onClick={replay} aria-label={t.replay} title={t.replay}>↻</button>
        <button type="button" className={icon} onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? t.play : t.pause} title={paused ? t.play : t.pause}>{paused ? "▶" : "❚❚"}</button>
        <button type="button" className={icon} onClick={swapPhoto} aria-label={t.photo} title={t.photo}>🖼</button>
        <button type="button" className={icon} onClick={swapCaption} aria-label={t.caption} title={t.caption}>💬</button>
      </div>
    </section>
  );
}

/** Tiny per-session thumbnail for the chat history list (from the conversation title). */
export function SessionThumb({ title }: { title: string }) {
  const sel = sessionSelection(title);
  if (!sel) return <span className="h-6 w-6 shrink-0 rounded-md bg-slate-200" aria-hidden="true" />;
  const p = photo(sel.photoId);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative 24px thumbnail
    <img src={photoSrc(sel.photoId)} alt="" aria-hidden="true" className="h-6 w-6 shrink-0 rounded-md object-cover" style={{ objectPosition: p.pos ?? "50% 40%" }} />
  );
}
