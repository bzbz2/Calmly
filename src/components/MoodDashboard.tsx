"use client";
import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/critter/catalog";
import type { AnimalPrefs } from "@/lib/personal/animals";
import type { LastMood } from "@/lib/personal/checkin";
import { describePattern, findPatterns } from "@/lib/personal/patterns";
import { dailySeries, describeWeather, entryLabel, weekInsights, type TrendRow, type Weather } from "@/lib/personal/trend";
import { GUEST_UI, signUpHref } from "@/lib/guest";
import { defaultVoiceLang } from "@/lib/voice";
import Link from "next/link";
import { WeekDiary, weekCardDays } from "./critter/WeekDiary";
import { weekCardLines } from "@/lib/personal/share";
import { MoodTrend, type Metric } from "./mood/MoodTrend";

// "My mood": one point per day (tap for details), mood or stress, a few plain-language
// insights, the weekly photo diary, and an anonymous "mood weather".

type Entry = TrendRow & { id: string; createdAt: string; triggers: string[] };

const RANGES = [7, 30, 90] as const;
const T = {
  en: {
    title: "Your mood", mood: "Mood", stress: "Stress", range: (d: number) => `Last ${d} days`, loading: "Loading…",
    empty: "No data yet. Chat with Calmly and your mood will be tracked here automatically.",
    week: "This week", weather: "Mood weather", anon: "Anonymous. Built from counts only, never anyone's messages.",
    checkins: (n: number) => `${n} check-in${n === 1 ? "" : "s"}`, moodN: "mood", stressN: "stress", close: "Close",
    shareWeek: "Share my week", weekTitle: "My week with Calmly", shared: "Shared", downloaded: "Image saved",
  },
  zh: {
    title: "你的心情", mood: "心情", stress: "压力", range: (d: number) => `最近 ${d} 天`, loading: "加载中…",
    empty: "还没有记录。和 Calmly 聊聊，你的心情会自动记在这里。",
    week: "本周小结", weather: "心情天气", anon: "匿名统计，只用人数，不含任何人的聊天内容。",
    checkins: (n: number) => `${n} 条记录`, moodN: "心情", stressN: "压力", close: "收起",
    shareWeek: "分享周回顾", weekTitle: "我的一周", shared: "已分享", downloaded: "图片已保存",
  },
};

export default function MoodDashboard({ guest = false }: { guest?: boolean }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const [metric, setMetric] = useState<Metric>("mood");
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [prefs, setPrefs] = useState<AnimalPrefs>({});
  const [lang, setLang] = useState<Lang>("en");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/moods?days=90").then((r) => r.json()).then((d) => setRows(d.moods ?? [])).catch(() => setRows([]));
    fetch("/api/insights")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { animalPrefs: AnimalPrefs; last: LastMood | null } | null) => {
        setPrefs(d?.animalPrefs ?? {});
        setLang(defaultVoiceLang(d?.last?.lang, navigator.language));
      })
      .catch(() => setLang(defaultVoiceLang(undefined, navigator.language)));
    fetch("/api/weather").then((r) => (r.ok ? r.json() : null)).then(setWeather).catch(() => {});
  }, []);

  const t = T[lang];
  const now = useMemo(() => new Date(), []);
  const tz = now.getTimezoneOffset();
  const series = useMemo(() => dailySeries(rows ?? [], now, tz, days), [rows, now, tz, days]);
  const insights = useMemo(() => (rows ? weekInsights(rows, now, tz, lang) : []), [rows, now, tz, lang]);
  const pattern = useMemo(() => (rows ? findPatterns(rows, now, tz)[0] : undefined), [rows, now, tz]);
  const day = series.find((d) => d.key === selected);
  const [weekNote, setWeekNote] = useState("");

  /** Week recap image: 7 buddies + how the week felt (no triggers, no chat text). */
  async function shareWeek() {
    if (!rows) return;
    const { shareWeekCard } = await import("./critter/shareCard");
    const r = await shareWeekCard({ title: t.weekTitle, days: weekCardDays(rows, prefs, lang), lines: weekCardLines(insights) }).catch(() => "cancelled" as const);
    if (r === "cancelled") return;
    setWeekNote(guest ? `${t[r]} · ${GUEST_UI[lang].shareSave.text}` : t[r]);
    setTimeout(() => setWeekNote(""), guest ? 5000 : 2500);
  }

  return (
    <div className="space-y-4" lang={lang}>
      <h1 className="text-2xl font-semibold">{t.title}</h1>

      {rows && <WeekDiary rows={rows} prefs={prefs} lang={lang} />}

      {guest && (
        // A guest's history lives on this device's guest account: offer to keep it.
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl bg-indigo-50/80 px-4 py-2.5 text-sm text-slate-700 ring-1 ring-indigo-100">
          <span className="min-w-0 flex-1">🔒 {GUEST_UI[lang].moodBanner.text}</span>
          <Link href={signUpHref("/mood")} className="shrink-0 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">
            {GUEST_UI[lang].moodBanner.cta}
          </Link>
        </div>
      )}

      <section className="space-y-3 rounded-3xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div role="radiogroup" aria-label={`${t.mood} | ${t.stress}`} className="flex rounded-full bg-slate-100 p-1">
            {(["mood", "stress"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={metric === m}
                onClick={() => setMetric(m)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${metric === m ? (m === "mood" ? "bg-white text-indigo-700 shadow-sm" : "bg-white text-orange-600 shadow-sm") : "text-slate-500 hover:text-slate-700"}`}
              >
                {t[m]}
              </button>
            ))}
          </div>
          <select
            value={days}
            onChange={(e) => { setDays(Number(e.target.value) as (typeof RANGES)[number]); setSelected(null); }}
            aria-label={t.range(days)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
          >
            {RANGES.map((d) => <option key={d} value={d}>{t.range(d)}</option>)}
          </select>
        </div>

        {rows === null ? (
          <p className="py-16 text-center text-slate-500">{t.loading}</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-slate-500">{t.empty}</p>
        ) : (
          <>
            <MoodTrend days={series} metric={metric} lang={lang} selected={selected} onSelect={setSelected} />
            {day && (
              <div className="space-y-2 rounded-2xl bg-slate-50 p-3" aria-live="polite">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(`${day.key}T12:00:00`).toLocaleDateString(lang === "zh" ? "zh-CN" : undefined, { weekday: "long", month: "short", day: "numeric" })} · {t.checkins(day.entries.length)}
                  </p>
                  <button type="button" onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-slate-600">{t.close}</button>
                </div>
                <ul className="space-y-1.5">
                  {day.entries.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-baseline gap-x-2 text-sm text-slate-700">
                      <span className="tabular-nums text-xs text-slate-400">{new Date(e.createdAt).toLocaleTimeString(lang === "zh" ? "zh-CN" : undefined, { hour: "numeric", minute: "2-digit" })}</span>
                      <b className="font-medium">{entryLabel(e, lang)}</b>
                      <span className="text-xs text-slate-500">{t.moodN} {e.score}/10 · {t.stressN} {e.stress}/10</span>
                      {e.triggers.length > 0 && <span className="text-xs text-slate-400">· {e.triggers.join(lang === "zh" ? "、" : ", ")}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {rows !== null && rows.length > 0 && (
        <section aria-labelledby="week-title" className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="week-title" className="font-semibold text-slate-800">{t.week}</h2>
            {insights[0]?.id !== "more" && (
              <span className="flex items-center gap-2">
                {weekNote && <span role="status" className="text-xs text-slate-500">{weekNote}</span>}
                <button type="button" onClick={shareWeek} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100">
                  📤 {t.shareWeek}
                </button>
              </span>
            )}
          </div>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {insights.map((i) => (
              <li key={i.id} className="flex gap-2"><span aria-hidden="true">{i.icon}</span><span>{i.text}</span></li>
            ))}
            {pattern && insights[0]?.id !== "more" && (
              <li className="flex gap-2"><span aria-hidden="true">🔎</span><span>{describePattern(pattern, lang).text}</span></li>
            )}
          </ul>
        </section>
      )}

      {weather && (
        <section aria-labelledby="weather-title" className="rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 p-4 ring-1 ring-sky-100">
          <h2 id="weather-title" className="font-semibold text-slate-800"><span aria-hidden="true">⛅ </span>{t.weather}</h2>
          <p className="mt-1 text-slate-700">{describeWeather(weather, lang)}</p>
          <p className="mt-1 text-[11px] text-slate-400">{t.anon}</p>
        </section>
      )}
    </div>
  );
}
