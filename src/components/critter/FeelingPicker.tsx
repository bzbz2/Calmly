"use client";
import { useEffect, useRef } from "react";
import { FEELINGS, FEELING_SCENES, type Feeling, type Lang } from "@/lib/critter/catalog";

// "Not quite right?" Tap the buddy's label to pick the feeling yourself.
// The choice is saved on the message and logged to improve matching.

const UI = {
  en: { title: "How do you actually feel?", close: "Close" },
  zh: { title: "你其实是什么感觉？", close: "关闭" },
} as const;

export function FeelingPicker({ lang, current, onPick, onClose }: { lang: Lang; current: Feeling; onPick: (f: Feeling) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("[aria-pressed='true']")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [onClose]);

  return (
    <div ref={ref} role="dialog" aria-label={UI[lang].title} lang={lang} className="cr-enter z-20 w-full rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold text-slate-600">{UI[lang].title}</p>
        <button type="button" onClick={onClose} aria-label={UI[lang].close} className="px-1 text-xs text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <div className="flex max-h-44 flex-wrap gap-1 overflow-y-auto">
        {FEELINGS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === current}
            onClick={() => onPick(f)}
            className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${f === current ? "bg-indigo-600 text-white ring-indigo-600" : "text-slate-700 ring-slate-200 hover:bg-slate-50"}`}
          >
            {FEELING_SCENES[f].label[lang]}
          </button>
        ))}
      </div>
    </div>
  );
}
