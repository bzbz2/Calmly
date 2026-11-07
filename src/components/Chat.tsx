"use client";
import { useEffect, useRef, useState } from "react";
import { sessionOpening } from "@/lib/critter/session";
import { SessionBuddy, SessionThumb } from "./critter/SessionBuddy";

type Msg = { id?: string; role: "user" | "assistant"; content: string };
type Conv = { id: string; title: string };
type Mood = { label: string; score: number; stress: number };

export default function Chat({ name }: { name: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [convId, setConvId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastMood, setLastMood] = useState<Mood | null>(null);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  // Bumped whenever the user switches chats, so a late reply never lands in the wrong one.
  const viewRef = useRef(0);

  const refreshConvs = () =>
    fetch("/api/conversations").then((r) => r.json()).then((d) => setConvs(d.conversations ?? []));

  useEffect(() => { refreshConvs(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  // One buddy per session, from the first user message (and Calmly's first reply, for safety).
  const { firstUser, firstReply } = sessionOpening(msgs);

  async function open(id: string) {
    const view = ++viewRef.current;
    setConvId(id);
    setLastMood(null);
    setError("");
    setBusy(false);
    const d = await fetch(`/api/conversations?id=${id}`).then((r) => r.json());
    if (view === viewRef.current) setMsgs(d.messages ?? []);
  }

  function newChat() {
    viewRef.current++;
    setBusy(false);
    setConvId(undefined);
    setMsgs([]);
    setLastMood(null);
    setError("");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    const view = viewRef.current;
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, conversationId: convId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      if (!convId) refreshConvs(); // the new chat shows up in history either way
      if (view !== viewRef.current) return; // user moved to another chat; it's saved server-side
      setMsgs((m) => [...m, { role: "assistant", content: d.reply }]);
      if (d.mood) setLastMood(d.mood);
      if (!convId) setConvId(d.conversationId);
    } catch (err) {
      if (view === viewRef.current) setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (view === viewRef.current) setBusy(false);
    }
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
              <SessionThumb title={c.title} />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </nav>
        <SessionBuddy key={firstUser ?? ""} firstUser={firstUser} firstReply={firstReply} layout="sidebar" />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200">
        {firstUser && (
          <div className="px-3 pt-3 md:hidden">
            <SessionBuddy key={firstUser} firstUser={firstUser} firstReply={firstReply} layout="inline" />
          </div>
        )}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.length === 0 && (
            <div className="mt-16 space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-slate-800">How are you feeling today{name ? `, ${name}` : ""}?</h1>
              <p className="text-sm text-slate-500">Say it in a sentence, in English or 中文. A little buddy will show up to mirror your mood.</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={m.id ?? i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>{m.content}</div>
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
        <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={msgs.length ? "What's on your mind?" : "I'm so done with meetings. / 明明不是我的错…"}
            aria-label="Message"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
          />
          <button disabled={busy || !input.trim()} className="rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-700 disabled:opacity-50">Send</button>
        </form>
      </section>
    </div>
  );
}
