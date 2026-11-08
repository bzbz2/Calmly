"use client";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/critter/catalog";
import { GIFT_UI } from "@/lib/gift/gifts";

// Our own share menu for a gift link. The OS share sheet can't be filtered (it shows
// Notes, Freeform, Reminders…), so we list only the places people send a buddy to.

type Target = { id: string; label: string; bg: string; glyph: string; href?: (text: string, url: string) => string; app?: boolean };

const enc = encodeURIComponent;

const TARGETS: Target[] = [
  { id: "email", label: "Email", bg: "bg-slate-600", glyph: "✉", app: true, href: (t, u) => `mailto:?subject=${enc("Calmly")}&body=${enc(`${t}\n${u}`)}` },
  { id: "messages", label: "Messages", bg: "bg-green-500", glyph: "💬", app: true, href: (t, u) => `sms:?&body=${enc(`${t} ${u}`)}` },
  { id: "whatsapp", label: "WhatsApp", bg: "bg-[#25D366]", glyph: "✆", href: (t, u) => `https://wa.me/?text=${enc(`${t} ${u}`)}` },
  { id: "x", label: "X (Twitter)", bg: "bg-black", glyph: "𝕏", href: (t, u) => `https://x.com/intent/tweet?text=${enc(t)}&url=${enc(u)}` },
  { id: "facebook", label: "Facebook", bg: "bg-[#1877F2]", glyph: "f", href: (_t, u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
  { id: "telegram", label: "Telegram", bg: "bg-[#229ED9]", glyph: "➤", href: (t, u) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}` },
  // Instagram has no web share link: copy the link, then open Instagram DMs to paste it.
  { id: "instagram", label: "Instagram", bg: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]", glyph: "◎" },
];

export default function ShareMenu({ lang, text, url, onCopy }: { lang: Lang; text: string; url: string; onCopy: () => Promise<void> }) {
  const t = GIFT_UI[lang];
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function go(target: Target) {
    if (target.id === "instagram") {
      await onCopy();
      setNote(t.instagramCopied);
      setTimeout(() => setNote(""), 3000);
      window.open("https://www.instagram.com/direct/inbox/", "_blank", "noopener,noreferrer");
    } else if (target.href) {
      const href = target.href(text, url);
      if (target.app) window.location.href = href;
      else window.open(href, "_blank", "noopener,noreferrer");
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        {t.share}
      </button>
      {open && (
        <div role="menu" aria-label={t.share} className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200">
          {TARGETS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="menuitem"
              onClick={() => go(x)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white ${x.bg}`}>{x.glyph}</span>
              {x.label}
            </button>
          ))}
        </div>
      )}
      {note && <p role="status" className="mt-1 text-center text-xs text-slate-500">{note}</p>}
    </div>
  );
}
