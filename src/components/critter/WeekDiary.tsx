"use client";
import { useState } from "react";
import { FEELING_SCENES, type Lang } from "@/lib/critter/catalog";
import { photo, photoSrc } from "@/lib/critter/photos";
import { animalName, favouriteAnimal, preferredPhoto, type AnimalPrefs } from "@/lib/personal/animals";
import { diaryDays } from "@/lib/personal/diary";
import type { MoodRow } from "@/lib/personal/moods";
import type { WeekCardDay } from "./shareCard";

// Weekly photo diary on "My mood": one buddy per day for the last 7 days, the day's
// main feeling in the user's own time zone, starting with their favourite animal.
// Tap a day to share that day's card.

const T = {
  en: {
    title: "This week, in buddies", fav: "Your favourite", today: "Today", hint: "Tap a day to share its card",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], checkins: (n: number) => `${n} check-in${n === 1 ? "" : "s"}`,
    share: (d: string) => `Share ${d}'s card`, shared: "Shared", downloaded: "Image saved",
  },
  zh: {
    title: "本周的小伙伴", fav: "你最喜欢", today: "今天", hint: "点某一天，分享那天的卡片",
    days: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"], checkins: (n: number) => `${n} 条记录`,
    share: (d: string) => `分享${d}的卡片`, shared: "已分享", downloaded: "图片已保存",
  },
};

/** The 7 diary days as tiles for the week recap image. */
export function weekCardDays(rows: MoodRow[], prefs: AnimalPrefs, lang: Lang): WeekCardDay[] {
  const now = new Date();
  return diaryDays(rows, now, now.getTimezoneOffset()).map((d) => ({
    name: d.isToday ? T[lang].today : T[lang].days[d.weekday],
    isToday: d.isToday,
    photoId: d.feeling ? preferredPhoto(d.feeling, prefs) : null,
    label: d.feeling ? FEELING_SCENES[d.feeling].label[lang] : "",
  }));
}

export function WeekDiary({ rows, prefs, lang }: { rows: MoodRow[]; prefs: AnimalPrefs; lang: Lang }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const now = new Date();
  const days = diaryDays(rows, now, now.getTimezoneOffset());
  if (!days.some((d) => d.feeling)) return null;
  const t = T[lang];
  const fav = favouriteAnimal(prefs);
  const day = days.find((d) => d.key === picked && d.feeling);
  const dayName = (d: (typeof days)[number]) => (d.isToday ? t.today : t.days[d.weekday]);

  async function share() {
    if (!day?.feeling) return;
    const scene = FEELING_SCENES[day.feeling];
    const { shareCard } = await import("./shareCard");
    const r = await shareCard({
      photoId: preferredPhoto(day.feeling, prefs),
      label: `${dayName(day)} · ${scene.label[lang]}`,
      caption: scene.captions[lang][0],
      feeling: day.feeling,
      date: new Date(`${day.key}T12:00:00`),
    }).catch(() => "cancelled" as const);
    if (r === "cancelled") return;
    setNote(t[r]);
    setTimeout(() => setNote(""), 2500);
  }

  return (
    <section aria-labelledby="diary-title" className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200" lang={lang}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="diary-title" className="font-semibold text-slate-800">{t.title}</h2>
        <p className="text-xs text-slate-400">
          {fav ? `${t.fav}${lang === "zh" ? "：" : ": "}${animalName(fav, lang)} · ` : ""}
          {t.hint}
        </p>
      </div>
      <ol className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const id = d.feeling ? preferredPhoto(d.feeling, prefs) : null;
          const label = d.feeling ? FEELING_SCENES[d.feeling].label[lang] : "";
          const ring = picked === d.key ? "ring-2 ring-amber-400" : d.isToday ? "ring-2 ring-indigo-400" : "ring-1 ring-slate-200";
          return (
            <li key={d.key} className="flex min-w-0 flex-col items-center gap-1 text-center">
              {id ? (
                <button
                  type="button"
                  onClick={() => setPicked(picked === d.key ? null : d.key)}
                  aria-pressed={picked === d.key}
                  aria-label={`${dayName(d)}: ${label}. ${t.checkins(d.entries)}`}
                  className={`aspect-square w-full overflow-hidden rounded-xl ${ring} transition hover:opacity-90`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- small static JPEG */}
                  <img src={photoSrc(id)} alt="" className="h-full w-full object-cover" style={{ objectPosition: photo(id).pos ?? "50% 40%" }} />
                </button>
              ) : (
                <div className={`aspect-square w-full rounded-xl bg-slate-100 ${ring}`} />
              )}
              <span className={`text-[11px] ${d.isToday ? "font-semibold text-indigo-700" : "text-slate-500"}`}>{dayName(d)}</span>
              <span className="w-full truncate text-[11px] text-slate-700" aria-hidden={!label}>{label || "·"}</span>
            </li>
          );
        })}
      </ol>
      {day && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" onClick={share} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100">
            📤 {t.share(dayName(day))}
          </button>
          {note && <span role="status" className="text-xs text-slate-500">{note}</span>}
        </div>
      )}
    </section>
  );
}
