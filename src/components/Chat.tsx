"use client";
import { useEffect, useRef, useState } from "react";
import type { Feeling, Lang } from "@/lib/critter/catalog";
import { detectLang } from "@/lib/critter/match";
import { sessionMood } from "@/lib/critter/session";
import { preferredPhoto, type AnimalPrefs, type PrefSignal } from "@/lib/personal/animals";
import { buildCheckIn, type LastMood } from "@/lib/personal/checkin";
import type { MoodRow } from "@/lib/personal/moods";
import { describePattern, findPatterns } from "@/lib/personal/patterns";
import { quickReplies } from "@/lib/personal/quickReplies";
import { moodChips, welcomeText } from "@/lib/personal/welcome";
import { defaultVoiceLang } from "@/lib/voice";
import { SessionBuddy, SessionThumb, WelcomeBuddy, type BuddyCard } from "./critter/SessionBuddy";
import { useVoiceChat, type VoicePhase } from "./voice/useVoiceChat";

/**
 * `key` is a local id for every message added in this tab (user and assistant), so React
 * keys stay unique and stable even after the server returns the user message's `id`.
 * Messages loaded from history have only `id`.
 */
type Msg = { id?: string; key?: number; role: "user" | "assistant"; content: string; feeling?: string | null };
type Conv = { id: string; title: string };
type Mood = { label: string; score: number; stress: number };
type Insights = { moods: MoodRow[]; last: LastMood | null; animalPrefs: AnimalPrefs };

/** Chats shown in the sidebar by default. Older ones stay saved and one tap away. */
const RECENT_CHATS = 3;

const VOICE_UI: Record<Lang, Record<VoicePhase | "talk" | "end" | "done" | "skip" | "read" | "stop" | "unsupported", string>> = {
  en: { talk: "Tap to talk", end: "End", done: "Done", off: "", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…", skip: "Tap to skip", read: "Read aloud", stop: "Stop", unsupported: "Voice input isn't supported in this browser. Try Chrome, Edge or Safari." },
  zh: { talk: "点我说话", end: "结束", done: "说完了", off: "", listening: "在听…", thinking: "在想…", speaking: "在说…", skip: "点一下跳过", read: "朗读", stop: "停止", unsupported: "这个浏览器不支持语音输入，试试 Chrome、Edge 或 Safari。" },
};

function MicIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </svg>
  );
}

const PATTERN_UI: Record<Lang, { yes: string; send: string }> = {
  en: { yes: "Yes, let's look", send: "Yes, let's look at that pattern together." },
  zh: { yes: "好，一起看看", send: "好，我们一起看看这个规律吧。" },
};

const SHARE_UI: Record<Lang, { share: string; shared: string; downloaded: string }> = {
  en: { share: "Share today's me", shared: "Shared", downloaded: "Image saved" },
  zh: { share: "分享今天的我", shared: "已分享", downloaded: "图片已保存" },
};

const postJson = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function Chat({ name }: { name: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [showAllChats, setShowAllChats] = useState(false);
  const [convId, setConvId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastMood, setLastMood] = useState<Mood | null>(null);
  const [error, setError] = useState("");
  const [navLang, setNavLang] = useState<string | undefined>();
  const [insights, setInsights] = useState<Insights | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // Bumped whenever the user switches chats, so a late reply never lands in the wrong one.
  const viewRef = useRef(0);
  const keyRef = useRef(0);
  // Corrections made before the server returned the message id; sent once it does.
  const pendingFix = useRef(new Map<number, Feeling>());
  // What the buddy card shows right now (after any photo/caption swaps), for "Share today's me".
  const buddyCard = useRef<BuddyCard | null>(null);
  const [shareNote, setShareNote] = useState("");

  const refreshConvs = () =>
    fetch("/api/conversations").then((r) => r.json()).then((d) => setConvs(d.conversations ?? []));
  const refreshInsights = () =>
    fetch("/api/insights").then((r) => (r.ok ? r.json() : null)).then((d) => d && setInsights(d)).catch(() => {});

  useEffect(() => { refreshConvs(); refreshInsights(); setNavLang(navigator.language); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const prefs = insights?.animalPrefs;

  // The buddy follows the latest clear mood in this chat.
  const mood = sessionMood(msgs);
  const moodKey = mood ? `${mood.sourceIndex}:${mood.selection.feeling}:${msgs[mood.sourceIndex].content}` : "none";

  // Language is automatic (no toggle): what the user last said or typed in this chat,
  // else the language of their last chat, else the browser's. Calmly replies in the
  // user's language, and replies are spoken in their own language.
  const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.content;
  const voiceLang: Lang = defaultVoiceLang(lastUser ? detectLang(lastUser) : insights?.last?.lang, navLang);
  const v = VOICE_UI[voiceLang];
  const w = welcomeText(name, voiceLang);

  /**
   * Send one message; resolves to Calmly's reply (or null on error / chat switch).
   * `feeling` = the user picked it (mood chip): the buddy shows it at once and it's stored as theirs.
   */
  async function sendText(raw: string, opts: { feeling?: Feeling } = {}): Promise<string | null> {
    const text = raw.trim();
    if (!text || busy) return null;
    setError("");
    const key = ++keyRef.current;
    setMsgs((m) => [...m, { key, role: "user", content: text, feeling: opts.feeling }]);
    setBusy(true);
    const view = viewRef.current;
    try {
      const r = await postJson("/api/chat", { text, conversationId: convId, tzOffset: new Date().getTimezoneOffset(), feeling: opts.feeling });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      if (!convId) refreshConvs(); // the new chat shows up in history either way
      const fix = pendingFix.current.get(key);
      pendingFix.current.delete(key);
      if (fix && d.userMessageId) saveCorrection(d.userMessageId, fix);
      if (view !== viewRef.current) return null; // user moved to another chat; it's saved server-side
      setMsgs((m) => [
        // The LLM's feeling replaces the instant keyword guess, unless the user already corrected it.
        ...m.map((x) => (x.key === key ? { ...x, id: d.userMessageId, feeling: fix ?? d.feeling ?? x.feeling } : x)),
        { key: ++keyRef.current, role: "assistant" as const, content: d.reply },
      ]);
      if (d.mood) setLastMood(d.mood);
      if (!convId) setConvId(d.conversationId);
      return d.reply as string;
    } catch (err) {
      if (view === viewRef.current) setError(err instanceof Error ? err.message : "Something went wrong.");
      return null;
    } finally {
      if (view === viewRef.current) setBusy(false);
    }
  }

  function saveCorrection(messageId: string, feeling: Feeling) {
    postJson("/api/feeling", { messageId, feeling }).catch(() => {});
  }

  /** The user tapped the buddy's label and picked how they actually feel. */
  function correctFeeling(index: number, feeling: Feeling) {
    const m = msgs[index];
    if (!m || m.role !== "user") return;
    setMsgs((ms) => ms.map((x, i) => (i === index ? { ...x, feeling } : x)));
    if (m.id) saveCorrection(m.id, feeling);
    else if (m.key !== undefined) pendingFix.current.set(m.key, feeling);
  }

  function sendPref(s: PrefSignal) {
    postJson("/api/prefs", s).catch(() => {});
  }

  /** Share the buddy card as an image: photo, feeling and caption only, never the chat. */
  async function shareToday() {
    if (!mood) return;
    const sel = mood.selection;
    const card = buddyCard.current ?? { photoId: preferredPhoto(sel.feeling, prefs), label: sel.feelingLabel, caption: sel.caption, feeling: sel.feeling };
    const { shareCard } = await import("./critter/shareCard");
    const r = await shareCard(card).catch(() => "cancelled" as const);
    if (r === "cancelled") return;
    setShareNote(SHARE_UI[sel.lang][r]);
    setTimeout(() => setShareNote(""), 2500);
  }

  const voice = useVoiceChat({ lang: voiceLang, onUtterance: sendText });
  const voiceOn = voice.phase !== "off";

  function leaveChat() {
    viewRef.current++;
    voice.end();
    setBusy(false);
    setLastMood(null);
    setError("");
  }

  async function open(id: string) {
    leaveChat();
    const view = viewRef.current;
    setConvId(id);
    const d = await fetch(`/api/conversations?id=${id}`).then((r) => r.json());
    if (view === viewRef.current) setMsgs(d.messages ?? []);
  }

  function newChat() {
    leaveChat();
    setConvId(undefined);
    setMsgs([]);
    refreshInsights();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input;
    if (!text.trim() || busy) return;
    setInput("");
    sendText(text);
  }

  // Sidebar: the 3 most recent chats (plus the open one if it's older).
  const shownChats = showAllChats ? convs : convs.slice(0, RECENT_CHATS);
  const openOlder = !showAllChats && convId ? convs.slice(RECENT_CHATS).find((c) => c.id === convId) : undefined;
  const hiddenCount = Math.max(0, convs.length - RECENT_CHATS);

  // Empty state: a gentle check-in on the last heavy mood, and one pattern if there is one.
  const now = new Date();
  const checkIn = insights ? buildCheckIn(insights.last, now) : null;
  const pattern = insights ? findPatterns(insights.moods, now, now.getTimezoneOffset())[0] : undefined;
  const insightLang: Lang = insights?.last?.lang ?? voiceLang;
  const patternText = pattern ? describePattern(pattern, insightLang) : null;

  // Quick replies under Calmly's latest answer, matched to the buddy's feeling.
  const last = msgs[msgs.length - 1];
  const replies = mood && last?.role === "assistant" && !busy && !voiceOn ? quickReplies(mood.selection.feeling, mood.selection.lang) : [];

  const chip = "rounded-full bg-white px-3 py-1 text-sm text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 disabled:opacity-50";

  return (
    <div className="flex h-[calc(100vh-110px)] gap-4">
      <aside className="hidden w-56 shrink-0 flex-col gap-2 md:flex">
        <button onClick={newChat} className="rounded-lg bg-indigo-600 py-2 text-sm text-white hover:bg-indigo-700">+ New chat</button>
        <nav aria-label="Chat history" className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {[...shownChats, ...(openOlder ? [openOlder] : [])].map((c) => (
            <button
              key={c.id}
              onClick={() => open(c.id)}
              aria-current={c.id === convId ? "true" : undefined}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white ${c.id === convId ? "bg-white shadow-sm" : ""}`}
            >
              <SessionThumb title={c.title} prefs={prefs} photoId={c.id === convId ? (mood ? preferredPhoto(mood.selection.feeling, prefs) : null) : undefined} />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllChats((s) => !s)}
              aria-expanded={showAllChats}
              className="w-full px-2 py-1 text-left text-xs text-slate-400 hover:text-slate-600"
            >
              {showAllChats ? "Show less" : `Show earlier chats (${hiddenCount})`}
            </button>
          )}
        </nav>
        <SessionBuddy key={moodKey} msgs={msgs} layout="sidebar" prefs={prefs} onPref={sendPref} onCorrect={correctFeeling} onState={(c) => (buddyCard.current = c)} />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200">
        {mood && (
          <div className="px-3 pt-3 md:hidden">
            <SessionBuddy key={moodKey} msgs={msgs} layout="inline" prefs={prefs} onPref={sendPref} onCorrect={correctFeeling} onState={(c) => (buddyCard.current = c)} />
          </div>
        )}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.length === 0 && (
            <div className="mx-auto mt-6 max-w-md space-y-4 text-center" lang={voiceLang}>
              <WelcomeBuddy lang={voiceLang} label={w.buddyLabel} caption={w.buddyCaption} prefs={prefs} />
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold text-slate-800">{w.title}</h1>
                <p className="text-sm text-slate-500">{w.sub}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2" aria-label={w.sub}>
                {moodChips(voiceLang).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={busy}
                    onClick={() => sendText(c.send, { feeling: c.feeling })}
                    className="rounded-full bg-white px-4 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-indigo-50 hover:ring-indigo-200 disabled:opacity-50"
                  >
                    <span aria-hidden="true">{c.emoji}</span> {c.label}
                  </button>
                ))}
              </div>
              {checkIn && (
                <div className="space-y-2 rounded-2xl bg-indigo-50/70 p-3" lang={checkIn.lang}>
                  <p className="text-sm text-slate-700">{checkIn.text}</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {checkIn.chips.map((c) => (
                      <button key={c.label} type="button" disabled={busy} onClick={() => sendText(c.send)} className={chip}>{c.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {patternText && (
                <div className="space-y-2 rounded-2xl bg-amber-50/70 p-3" lang={insightLang}>
                  <p className="text-sm text-slate-700"><span aria-hidden="true">🔎 </span>{patternText.text} {patternText.ask}</p>
                  <button type="button" disabled={busy} onClick={() => sendText(PATTERN_UI[insightLang].send)} className={chip}>{PATTERN_UI[insightLang].yes}</button>
                </div>
              )}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={m.key !== undefined ? `k${m.key}` : (m.id ?? `i${i}`)} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>{m.content}</div>
              {m.role === "assistant" && voice.supported.tts && !voiceOn && (
                <button
                  type="button"
                  onClick={() => (voice.speakingText === m.content ? voice.stopSpeaking() : voice.speak(m.content))}
                  className="mt-0.5 px-2 text-[11px] text-slate-400 hover:text-slate-600"
                >
                  {voice.speakingText === m.content ? `■ ${v.stop}` : `🔊 ${v.read}`}
                </button>
              )}
            </div>
          ))}
          {mood && last?.role === "assistant" && !busy && (
            // The reveal moment: one button only, to share how I feel today.
            <div className="flex items-center gap-2" lang={mood.selection.lang}>
              <button type="button" onClick={shareToday} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100">
                📤 {SHARE_UI[mood.selection.lang].share}
              </button>
              {shareNote && <span role="status" className="text-xs text-slate-500">{shareNote}</span>}
            </div>
          )}
          {replies.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Quick replies" lang={mood?.selection.lang}>
              {replies.map((q) => (
                <button key={q.id} type="button" onClick={() => sendText(q.send)} className={chip}>{q.label}</button>
              ))}
            </div>
          )}
          {busy && <div className="text-sm text-slate-400">Calmly is thinking…</div>}
          {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
          <div ref={endRef} />
        </div>
        {lastMood && (
          <div className="mx-4 mb-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
            Mood logged: <b>{lastMood.label}</b> · mood {lastMood.score}/10 · stress {lastMood.stress}/10
          </div>
        )}
        {voice.error && (
          <p role="alert" className="mx-4 mb-1 text-xs text-rose-600">
            {voice.error}{" "}
            <button type="button" onClick={() => voice.setError("")} className="underline">OK</button>
          </p>
        )}
        {voice.notice && <p role="status" className="mx-4 mb-1 text-xs text-indigo-700">{voice.notice}</p>}
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3">
          {!voiceOn ? (
            <button
              type="button"
              onClick={voice.start}
              disabled={!voice.supported.stt}
              title={voice.supported.stt ? v.talk : v.unsupported}
              aria-label={v.talk}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40"
            >
              <MicIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={voice.phase === "speaking" ? voice.skip : undefined}
              aria-live="polite"
              aria-label={v[voice.phase]}
              title={voice.phase === "speaking" ? v.skip : undefined}
              className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm ${voice.phase === "listening" ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-700"}`}
            >
              {voice.phase === "listening" && <span className="absolute inset-0 animate-ping rounded-full bg-rose-200/60" aria-hidden="true" />}
              <MicIcon className="relative h-5 w-5" />
              <span className="relative hidden sm:inline">{v[voice.phase]}</span>
            </button>
          )}
          <input
            value={voice.phase === "listening" && voice.interim ? voice.interim : input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={voice.phase === "listening"}
            placeholder={voice.phase === "listening" ? v.listening : w.placeholder}
            aria-label="Message"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
          />
          {voice.phase === "listening" && (
            <button type="button" onClick={voice.finish} className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">
              {v.done}
            </button>
          )}
          {voiceOn && (
            <button type="button" onClick={voice.end} className="shrink-0 rounded-xl bg-rose-500 px-3 py-2 text-sm text-white hover:bg-rose-600">
              {v.end}
            </button>
          )}
          {!voiceOn && (
            <button disabled={busy || !input.trim()} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Send</button>
          )}
        </form>
      </section>
    </div>
  );
}
