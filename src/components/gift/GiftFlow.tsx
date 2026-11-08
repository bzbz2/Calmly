"use client";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/critter/catalog";
import { photo, photoSrc, type PhotoId } from "@/lib/critter/photos";
import { cleanText, giftHeadline, giftLine, giftMessage, giftPhoto, giftStory, GIFT_PHRASES, GIFT_UI, MAX_CUSTOM, MAX_NAME, PHRASES, type GiftPhrase } from "@/lib/gift/gifts";
import { GUEST_UI, signUpHref } from "@/lib/guest";
import { CritterStage } from "../critter/CritterStage";
import StoryCard from "../story/StoryCard";
import ShareMenu from "./ShareMenu";

// Send a buddy (送一只): pick a phrase → Calmly pairs an animal → get a link for the friend.
// Sending needs an account. A guest can still pick everything; "Sign up to send" keeps
// their choices on this tab, and sign-up brings them straight back here to finish.

/** Draft kept across sign-up (this tab only). */
const DRAFT = "calmly:giftDraft";
type Draft = { phrase: GiftPhrase; custom: string; toName: string; turn: number; reply: string | null };

type Sent = { token: string; toName: string | null; message: string; photoId: PhotoId; createdAt: string; openedAt: string | null };

export default function GiftFlow({ lang, myName, replyTo, initialPhrase, canSend }: { lang: Lang; myName: string; replyTo: { token: string; name: string } | null; initialPhrase?: GiftPhrase; canSend: boolean }) {
  const t = GIFT_UI[lang];
  const [phrase, setPhrase] = useState<GiftPhrase>(initialPhrase ?? "hug");
  const [custom, setCustom] = useState("");
  const [toName, setToName] = useState(replyTo?.name ?? "");
  const [turn, setTurn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState<Sent[]>([]);

  const loadSent = () => fetch("/api/gifts").then((r) => (r.ok ? r.json() : null)).then((d) => d && setSent(d.gifts ?? [])).catch(() => {});
  useEffect(() => {
    if (canSend) loadSent();
    // Back from sign-up: pick up exactly where they left off.
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT) ?? "null") as Draft | null;
      if (d && d.reply === (replyTo?.token ?? null) && d.phrase in PHRASES) {
        setPhrase(d.phrase);
        setCustom(d.custom);
        setToName(d.toName);
        setTurn(d.turn);
      }
      if (canSend) sessionStorage.removeItem(DRAFT);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on load
  }, []);

  const photoId = giftPhoto(phrase, turn);
  const message = giftMessage(phrase, lang, custom);
  const to = cleanText(toName, MAX_NAME);
  const story = giftStory(phrase);

  function pick(p: GiftPhrase) {
    setPhrase(p);
    setTurn(0);
    setError("");
  }

  /** A guest: save the draft and go sign up; they come back to this page to send it. */
  function signUpToSend() {
    if (!message) return setError(t.empty);
    const d: Draft = { phrase, custom, toName, turn, reply: replyTo?.token ?? null };
    sessionStorage.setItem(DRAFT, JSON.stringify(d));
    window.location.href = signUpHref(window.location.pathname + window.location.search);
  }

  async function create() {
    if (!canSend) return signUpToSend();
    if (!message) return setError(t.empty);
    setBusy(true);
    setError("");
    const r = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase, custom: phrase === "custom" ? custom : undefined, photoId, toName: to || undefined, lang, replyTo: replyTo?.token }),
    }).catch(() => null);
    setBusy(false);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r?.status === 403 && d.error === "account") return signUpToSend();
    if (!r?.ok) return setError(d.error === "limit" ? t.limit : d.error === "empty" ? t.empty : "Something went wrong.");
    setLink(`${window.location.origin}${d.path}`);
    loadSent();
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function again() {
    setLink(null);
    setCustom("");
    setToName("");
    setTurn(0);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5" lang={lang}>
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-slate-800">{t.title}</h1>
        <p className="text-sm text-slate-500">{replyTo ? t.replyTo(replyTo.name) : t.sub}</p>
      </div>

      <div className="mx-auto w-60">
        {story ? (
          <StoryCard key={phrase} sceneId={story} label={giftHeadline(myName, photoId, lang, phrase)} caption={message || t.customPh} loop={1600} />
        ) : (
        <CritterStage
          key={`${phrase}-${turn}`}
          sceneId={`feel_${PHRASES[phrase].motion}`}
          photoId={photoId}
          label={giftHeadline(myName, photoId, lang, phrase)}
          caption={message || t.customPh}
          lang={lang}
          playKey={0}
          paused={false}
        />
        )}
      </div>

      {!link ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label={t.sub}>
            {GIFT_PHRASES.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={phrase === p}
                onClick={() => pick(p)}
                className={`rounded-full px-4 py-1.5 text-sm ring-1 transition ${phrase === p ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50"}`}
              >
                <span aria-hidden="true">{PHRASES[p].emoji}</span> {PHRASES[p].text[lang]}
              </button>
            ))}
          </div>
          {phrase === "custom" && (
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              maxLength={MAX_CUSTOM}
              placeholder={t.customPh}
              aria-label={t.customPh}
              autoFocus
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          )}
          <label className="block text-sm text-slate-600">
            {t.to}
            <input value={toName} onChange={(e) => setToName(e.target.value)} maxLength={MAX_NAME} placeholder={t.toPh} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          {!canSend && <p className="text-center text-xs text-slate-500">{GUEST_UI[lang].giftNeedsAccount.text}</p>}
          <div className="flex gap-2">
            {!story && (
              <button type="button" onClick={() => setTurn((n) => n + 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                🔀 {t.another}
              </button>
            )}
            <button type="button" onClick={create} disabled={busy} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
              {busy ? t.creating : canSend ? t.create : GUEST_UI[lang].giftNeedsAccount.cta}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">{t.ready}</p>
          <div className="flex items-center gap-2">
            <input readOnly value={link} aria-label="Link" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
            <button type="button" onClick={copy} className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">{copied ? t.copied : t.copy}</button>
          </div>
          <div className="flex gap-2">
            <ShareMenu lang={lang} text={giftLine({ senderName: myName, photoId, message, lang, phrase })} url={link} onCopy={copy} />
            <button type="button" onClick={again} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{t.again}</button>
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <section aria-labelledby="sent-title" className="space-y-2">
          <h2 id="sent-title" className="text-sm font-semibold text-slate-600">{t.sent}</h2>
          <ul className="space-y-1.5">
            {sent.map((g) => (
              <li key={g.token} className="flex items-center gap-3 rounded-xl bg-white/80 p-2 ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element -- small static JPEG */}
                <img src={photoSrc(g.photoId)} alt="" className="h-10 w-10 rounded-lg object-cover" style={{ objectPosition: photo(g.photoId)?.pos ?? "50% 40%" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-800">{g.message}</p>
                  {g.toName && <p className="truncate text-xs text-slate-400">{t.forYou(g.toName)}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${g.openedAt ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {g.openedAt ? t.opened : t.unopened}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
