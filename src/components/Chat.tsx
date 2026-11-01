"use client";
import { useEffect, useRef, useState } from "react";

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

  const refreshConvs = () =>
    fetch("/api/conversations").then((r) => r.json()).then((d) => setConvs(d.conversations ?? []));

  useEffect(() => { refreshConvs(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function open(id: string) {
    setConvId(id);
    setLastMood(null);
    const d = await fetch(`/api/conversations?id=${id}`).then((r) => r.json());
    setMsgs(d.messages ?? []);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, conversationId: convId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      setMsgs((m) => [...m, { role: "assistant", content: d.reply }]);
      if (d.mood) setLastMood(d.mood);
      if (!convId) { setConvId(d.conversationId); refreshConvs(); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-110px)] gap-4">
      <aside className="hidden w-52 shrink-0 flex-col gap-2 overflow-y-auto md:flex">
        <button onClick={() => { setConvId(undefined); setMsgs([]); setLastMood(null); }} className="rounded-lg bg-indigo-600 py-2 text-sm text-white hover:bg-indigo-700">+ New chat</button>
        {convs.map((c) => (
          <button key={c.id} onClick={() => open(c.id)} className={`truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-white ${c.id === convId ? "bg-white shadow-sm" : ""}`}>{c.title}</button>
        ))}
      </aside>
      <section className="flex flex-1 flex-col rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.length === 0 && (
            <div className="mt-16 space-y-2 text-center text-slate-500">
              <p>Hi{name ? ` ${name}` : ""} 👋 How was your day? Tell me whatever is on your mind.</p>
              <p className="text-sm">
                Not up for talking? <a href="/critter" className="text-indigo-600 underline">Express with a critter</a>
              </p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={m.id ?? i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>{m.content}</div>
            </div>
          ))}
          {busy && <div className="text-sm text-slate-400">Calmly is thinking…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div ref={endRef} />
        </div>
        {lastMood && (
          <div className="mx-4 mb-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
            Mood logged: <b>{lastMood.label}</b> · mood {lastMood.score}/10 · stress {lastMood.stress}/10
          </div>
        )}
        <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="What's on your mind?" className="flex-1 rounded-xl border border-slate-300 px-3 py-2" />
          <button disabled={busy || !input.trim()} className="rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-700 disabled:opacity-50">Send</button>
        </form>
      </section>
    </div>
  );
}
