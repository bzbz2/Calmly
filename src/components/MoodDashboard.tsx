"use client";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Entry = { id: string; score: number; stress: number; label: string; triggers: string[]; createdAt: string };

export default function MoodDashboard() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<Entry[] | null>(null);

  useEffect(() => {
    setRows(null);
    fetch(`/api/moods?days=${days}`).then((r) => r.json()).then((d) => setRows(d.moods ?? []));
  }, [days]);

  const data = useMemo(
    () => (rows ?? []).map((r) => ({ ...r, t: new Date(r.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric" }) })),
    [rows],
  );

  const stats = useMemo(() => {
    if (!rows?.length) return null;
    const avg = rows.reduce((a, r) => a + r.score, 0) / rows.length;
    const count = (xs: string[]) => Object.entries(xs.reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { avg, labels: count(rows.map((r) => r.label)), triggers: count(rows.flatMap((r) => r.triggers.map((t) => t.toLowerCase()))) };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your mood over time</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>
      {rows === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-slate-500 ring-1 ring-slate-200">No data yet. Chat with Calmly and your mood will be tracked here automatically.</p>
      ) : (
        <>
          <div className="h-72 rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" name="Mood" stroke="#4f46e5" strokeWidth={2} dot />
                <Line type="monotone" dataKey="stress" name="Stress" stroke="#f97316" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {stats && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Card title="Average mood">{stats.avg.toFixed(1)} / 10</Card>
              <Card title="Common feelings">{stats.labels.map(([l, n]) => `${l} (${n})`).join(", ")}</Card>
              <Card title="Common triggers">{stats.triggers.length ? stats.triggers.map(([l, n]) => `${l} (${n})`).join(", ") : "—"}</Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/80 p-4 ring-1 ring-slate-200">
      <div className="text-xs uppercase text-slate-500">{title}</div>
      <div className="mt-1 font-medium">{children}</div>
    </div>
  );
}
