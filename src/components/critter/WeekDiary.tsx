"use client";
import { useEffect, useState } from "react";
import { FEELING_SCENES } from "@/lib/critter/catalog";
import { photo, photoSrc } from "@/lib/critter/photos";
import { favouriteAnimal, preferredPhoto, type AnimalPrefs } from "@/lib/personal/animals";
import { diaryDays, type DiaryDay } from "@/lib/personal/diary";
import type { MoodRow } from "@/lib/personal/moods";

// Weekly photo diary on "My mood": one buddy per day for the last 7 days, the day's
// main feeling in the user's own time zone, starting with their favourite animal.

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekDiary() {
  const [days, setDays] = useState<DiaryDay[] | null>(null);
  const [prefs, setPrefs] = useState<AnimalPrefs>({});

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { moods: MoodRow[]; animalPrefs: AnimalPrefs } | null) => {
        const now = new Date();
        setDays(diaryDays(d?.moods ?? [], now, now.getTimezoneOffset()));
        setPrefs(d?.animalPrefs ?? {});
      })
      .catch(() => setDays([]));
  }, []);

  if (!days?.some((d) => d.feeling)) return null;
  const fav = favouriteAnimal(prefs);

  return (
    <section aria-labelledby="diary-title" className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="diary-title" className="font-semibold text-slate-800">This week, in buddies</h2>
        {fav && <p className="text-xs text-slate-400">Your favourite: {fav}</p>}
      </div>
      <ol className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const id = d.feeling ? preferredPhoto(d.feeling, prefs) : null;
          const label = d.feeling ? FEELING_SCENES[d.feeling].label.en : "";
          return (
            <li key={d.key} className="flex flex-col items-center gap-1 text-center">
              <div className={`aspect-square w-full overflow-hidden rounded-xl ${d.isToday ? "ring-2 ring-indigo-400" : "ring-1 ring-slate-200"} ${id ? "" : "bg-slate-100"}`}>
                {id && (
                  // eslint-disable-next-line @next/next/no-img-element -- small static JPEG
                  <img src={photoSrc(id)} alt={`${WEEKDAY[d.weekday]}: ${label}`} title={`${d.entries} check-in${d.entries === 1 ? "" : "s"}`} className="h-full w-full object-cover" style={{ objectPosition: photo(id).pos ?? "50% 40%" }} />
                )}
              </div>
              <span className={`text-[11px] ${d.isToday ? "font-semibold text-indigo-700" : "text-slate-500"}`}>{d.isToday ? "Today" : WEEKDAY[d.weekday]}</span>
              <span className="min-h-[1em] truncate text-[11px] text-slate-700" aria-hidden={!label}>{label || "·"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
