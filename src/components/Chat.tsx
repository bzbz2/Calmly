"use client";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/critter/catalog";
import { detectLang } from "@/lib/critter/match";
import { sessionMood } from "@/lib/critter/session";
import { defaultVoiceLang } from "@/lib/voice";
import { SessionBuddy, SessionThumb } from "./critter/SessionBuddy";
import { useVoiceChat, type VoicePhase } from "./voice/useVoiceChat";

type Msg = { id?: string; role: "user" | "assistant"; content: string };
type Conv = { id: string; title: string };
type Mood = { label: string; score: number; stress: number };

const VOICE_UI: Record<Lang, Record<VoicePhase | "talk" | "end" | "skip" | "read" | "stop" | "unsupported", string>> = {
  en: { talk: "Talk", end: "End", off: "", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…", skip: "Tap to skip", read: "Read aloud", stop: "Stop", unsupported: "Voice input isn't supported in this browser. Try Chrome, Edge or Safari." },
  zh: { talk: "说话", end: "结束", off: "", listening: "在听…", thinking: "在想…", speaking: "在说…", skip: "点一下跳过", read: "朗读", stop: "停止", unsupported: "这个浏览器不支持语音输入，试试 Chrome、Edge 或 Safari。" },
};

export default function Chat({ name }: { name: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [convId, setConvId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastMood, setLastMood] = useState<Mood | null>(null);
  const [error, setError] = useState("");
  const [navLang, setNavLang] = useState<string | undefined>();
  const [langOverride, setLangOverride] = useState<Lang | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // Bumped whenever the user switches chats, so a late reply never lands in the wrong one.
  const viewRef = useRef(0);

  const refreshConvs = () =>
    fetch("/api/conversations").then((r) => r.json()).then((d) => setConvs(d.conversations ?? []));

  useEffect(() => { refreshConvs(); setNavLang(navigator.language); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  // The buddy follows the latest clear mood in this chat.
  const mood = sessionMood(msgs);
  const moodKey = mood ? `${mood.sourceIndex}:${msgs[mood.sourceIndex].content}` : "none";

  // Voice language: manual toggle, else the language of the last thing the user said, else the browser's.
  const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.content;
  const voiceLang: Lang = langOverride ?? defaultVoiceLang(lastUser ? detectLang(lastUser) : undefined, navLang);
  const v = VOICE_UI[voiceLang];

  /** Send one message; resolves to Calmly's reply (or null on error / chat switch). */
  async function sendText(raw: string): Promise<string | null> {
    const text = raw.trim();
    if (!text || busy) return null;
    setError("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    const view = viewRef.current;
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, conversationId: convId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      if (!convId) refreshConvs(); // the new chat shows up in history either way
      if (view !== viewRef.current) return null; // user moved to another chat; it's saved server-side
      setMsgs((m) => [...m, { role: "assistant", content: d.reply }]);
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
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input;
    if (!text.trim() || busy) return;
    setInput("");
    sendText(text);
  }

  return (
    <div className="flex h-[calc(100vh-110px)] gap-4">
      <aside className="hidden w-56 shrink-0 flex-col gap-2 md:flex">
        <button onClick={newChat} className="rounded-lg bg-indigo-600 py-2 text-sm text-white hover:bg-indigo-700">+ New chat</button>
        <nav aria-label="Chat history" className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {convs.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c.id)}
              aria-current={c.id === convId ? "true" : undefined}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white ${c.id === convId ? "bg-white shadow-sm" : ""}`}
            >
              <SessionThumb title={c.title} photoId={c.id === convId ? (mood?.selection.photoId ?? null) : undefined} />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </nav>
        <SessionBuddy key={moodKey} msgs={msgs} layout="sidebar" />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200">
        {mood && (
          <div className="px-3 pt-3 md:hidden">
            <SessionBuddy key={moodKey} msgs={msgs} layout="inline" />
          </div>
        )}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.length === 0 && (
            <div className="mt-16 space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-slate-800">How are you feeling today{name ? `, ${name}` : ""}?</h1>
              <p className="text-sm text-slate-500">Type or tap 🎤 Talk, in English or 中文. A little buddy will show up to mirror your mood.</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={m.id ?? i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
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
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3">
          {!voiceOn ? (
            <button
              type="button"
              onClick={voice.start}
              disabled={!voice.supported.stt}
              title={voice.supported.stt ? v.talk : v.unsupported}
              aria-label={v.talk}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <span aria-hidden="true">🎤</span>
              <span className="hidden sm:inline">{v.talk}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={voice.phase === "speaking" ? voice.skip : undefined}
              aria-live="polite"
              title={voice.phase === "speaking" ? v.skip : undefined}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-700"
            >
              <span className={`h-2 w-2 rounded-full ${voice.phase === "listening" ? "animate-pulse bg-rose-500" : voice.phase === "speaking" ? "animate-pulse bg-indigo-500" : "bg-slate-400"}`} aria-hidden="true" />
              <span className="hidden sm:inline">{v[voice.phase]}</span>
            </button>
          )}
          {voice.supported.stt && (
            <button
              type="button"
              onClick={() => setLangOverride(voiceLang === "en" ? "zh" : "en")}
              disabled={voice.phase === "listening"}
              title={voiceLang === "en" ? "Speaking English. Switch to 中文" : "说中文。切换到 English"}
              className="shrink-0 rounded-lg px-1.5 py-1 text-xs text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              {voiceLang === "en" ? "EN" : "中"}
            </button>
          )}
          <input
            value={voice.phase === "listening" && voice.interim ? voice.interim : input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={voice.phase === "listening"}
            placeholder={voice.phase === "listening" ? v.listening : msgs.length ? "What's on your mind?" : "I'm so done with meetings. / 明明不是我的错…"}
            aria-label="Message"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
          />
          {voiceOn && (
            <button type="button" onClick={voice.end} className="shrink-0 rounded-xl bg-rose-500 px-3 py-2 text-sm text-white hover:bg-rose-600">
              {v.end}
            </button>
          )}
          <button disabled={busy || !input.trim()} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Send</button>
        </form>
      </section>
    </div>
  );
}
