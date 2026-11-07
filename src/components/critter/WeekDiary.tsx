"use client";
import { FEELING_SCENES, type Lang } from "@/lib/critter/catalog";
import { photo, photoSrc } from "@/lib/critter/photos";
import { favouriteAnimal, preferredPhoto, type AnimalPrefs } from "@/lib/personal/animals";
import { diaryDays } from "@/lib/personal/diary";
import type { MoodRow } from "@/lib/personal/moods";

// Weekly photo diary on "My mood": one buddy per day for the last 7 days, the day's
// main feeling in the user's own time zone, starting with their favourite animal.

const T = {
  en: { title: "This week, in buddies", fav: "Your favourite", today: "Today", days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], checkins: (n: number) => `${n} check-in${n === 1 ? "" : "s"}` },
  zh: { title: "本周的小伙伴", fav: "你最喜欢", today: "今天", days: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"], checkins: (n: number) => `${n} 条记录` },
};
const ANIMAL_ZH: Record<string, string> = {
  cat: "猫", dog: "狗", capybara: "水豚", "red panda": "小熊猫", panda: "熊猫", quokka: "短尾矮袋鼠",
  koala: "考拉", seal: "海豹", hamster: "仓鼠", "Pallas's cat": "兔狲", meerkat: "狐獴", otter: "水獭",
};

export function WeekDiary({ rows, prefs, lang }: { rows: MoodRow[]; prefs: AnimalPrefs; lang: Lang }) {
  const now = new Date();
  const days = diaryDays(rows, now, now.getTimezoneOffset());
  if (!days.some((d) => d.feeling)) return null;
  const t = T[lang];
  const fav = favouriteAnimal(prefs);

  return (
    <section aria-labelledby="diary-title" className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200" lang={lang}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="diary-title" className="font-semibold text-slate-800">{t.title}</h2>
        {fav && <p className="text-xs text-slate-400">{t.fav}{lang === "zh" ? "：" : ": "}{lang === "zh" ? (ANIMAL_ZH[fav] ?? fav) : fav}</p>}
      </div>
      <ol className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const id = d.feeling ? preferredPhoto(d.feeling, prefs) : null;
          const label = d.feeling ? FEELING_SCENES[d.feeling].label[lang] : "";
          return (
            <li key={d.key} className="flex min-w-0 flex-col items-center gap-1 text-center">
              <div className={`aspect-square w-full overflow-hidden rounded-xl ${d.isToday ? "ring-2 ring-indigo-400" : "ring-1 ring-slate-200"} ${id ? "" : "bg-slate-100"}`}>
                {id && (
                  // eslint-disable-next-line @next/next/no-img-element -- small static JPEG
                  <img src={photoSrc(id)} alt={`${t.days[d.weekday]}: ${label}`} title={t.checkins(d.entries)} className="h-full w-full object-cover" style={{ objectPosition: photo(id).pos ?? "50% 40%" }} />
                )}
              </div>
              <span className={`text-[11px] ${d.isToday ? "font-semibold text-indigo-700" : "text-slate-500"}`}>{d.isToday ? t.today : t.days[d.weekday]}</span>
              <span className="w-full truncate text-[11px] text-slate-700" aria-hidden={!label}>{label || "·"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
