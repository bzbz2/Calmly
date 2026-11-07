"use client";
import type { Lang } from "@/lib/critter/catalog";
import { innerGaps, segments, type TrendDay } from "@/lib/personal/trend";

// Mood or stress per day as a hand-drawn SVG line: one dot per day, gaps stay gaps
// (the line never bridges a day without check-ins), emoji instead of numbers on the
// Y axis, today filled. Dots are buttons that open the day's details.

export type Metric = "mood" | "stress";

const W = 640;
const H = 250;
const PAD = { l: 46, r: 14, t: 18, b: 36 };
const COLOR: Record<Metric, string> = { mood: "#6366f1", stress: "#f97316" };
const TICKS: Record<Metric, [number, string][]> = {
  mood: [[10, "😊"], [5.5, "😐"], [1, "😫"]],
  stress: [[10, "😫"], [5.5, "😐"], [1, "😌"]],
};
const SHORT_DAY: Record<Lang, string[]> = { en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], zh: ["日", "一", "二", "三", "四", "五", "六"] };
const T = {
  en: { none: "No entries", today: "Today", mood: "mood", stress: "stress", entries: (n: number) => `${n} check-in${n === 1 ? "" : "s"}` },
  zh: { none: "没记录", today: "今天", mood: "心情", stress: "压力", entries: (n: number) => `${n} 条记录` },
};

export function MoodTrend({ days, metric, lang, selected, onSelect }: { days: TrendDay[]; metric: Metric; lang: Lang; selected: string | null; onSelect: (key: string | null) => void }) {
  const t = T[lang];
  const n = days.length;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const step = plotW / n;
  const x = (i: number) => PAD.l + step * (i + 0.5);
  const y = (v: number) => PAD.t + ((10 - v) / 9) * plotH;
  const values = days.map((d) => d[metric]);
  const dense = n > 10;
  const r = n <= 7 ? 7 : n <= 31 ? 4.5 : 3;
  const color = COLOR[metric];
  const labelEvery = n <= 7 ? 1 : n <= 31 ? 5 : 15;

  const xLabel = (d: TrendDay, i: number) => {
    if (d.isToday) return t.today;
    if (!dense) return SHORT_DAY[lang][d.weekday];
    if ((n - 1 - i) % labelEvery !== 0) return "";
    const [, m, day] = d.key.split("-").map(Number);
    return `${m}/${day}`;
  };
  const dayName = (d: TrendDay) => (d.isToday ? t.today : `${d.key.slice(5).replace("-", "/")} ${SHORT_DAY[lang][d.weekday]}`);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="group" aria-label={`${t[metric]} · ${days[0]?.key} – ${days[n - 1]?.key}`}>
      {TICKS[metric].map(([v, emoji]) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeDasharray="4 6" />
          <text x={PAD.l - 26} y={y(v)} dominantBaseline="central" textAnchor="middle" fontSize="20" aria-hidden="true">{emoji}</text>
        </g>
      ))}

      {innerGaps(values)
        .filter(([a, b]) => !dense || b - a >= 2)
        .map(([a, b]) => (
          <text key={a} x={(x(a) + x(b)) / 2} y={y(4)} textAnchor="middle" fontSize="13" fill="#94a3b8">{t.none}</text>
        ))}

      {segments(values).map((seg) =>
        seg.length > 1 ? (
          <polyline key={seg[0]} points={seg.map((i) => `${x(i)},${y(values[i]!)}`).join(" ")} fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
        ) : null,
      )}

      {days.map((d, i) => {
        const v = values[i];
        const label = xLabel(d, i);
        return (
          <g key={d.key}>
            {label && (
              <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="13" fill={d.isToday ? color : "#64748b"} fontWeight={d.isToday ? 700 : 500}>{label}</text>
            )}
            {v !== null && (
              <g
                role="button"
                tabIndex={0}
                aria-pressed={selected === d.key}
                aria-label={`${dayName(d)}: ${t[metric]} ${v}/10, ${t.entries(d.entries.length)}`}
                onClick={() => onSelect(selected === d.key ? null : d.key)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(selected === d.key ? null : d.key))}
                className="cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-slate-800"
              >
                {selected === d.key && <circle cx={x(i)} cy={y(v)} r={r + 6} fill={color} opacity={0.15} />}
                <circle cx={x(i)} cy={y(v)} r={Math.max(r + 8, 14)} fill="transparent" />
                <circle cx={x(i)} cy={y(v)} r={r} fill={d.isToday ? color : "#fff"} stroke={color} strokeWidth={3} />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
