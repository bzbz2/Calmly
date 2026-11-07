"use client";
// Draws the buddy card on a canvas (photo, label, caption, credit) and shares it via
// the Web Share API, or downloads it as a PNG. No libraries. The user's message
// text is never included.

import { photo, photoSrc, needsCredit, type PhotoId } from "@/lib/critter/photos";
import { shareFileName, wrapLines } from "@/lib/personal/share";

const SIZE = 1080;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Parse "50% 40%" into fractions. */
function focal(pos: string | undefined): [number, number] {
  const m = (pos ?? "50% 40%").match(/(\d+)%\s+(\d+)%/);
  return m ? [Number(m[1]) / 100, Number(m[2]) / 100] : [0.5, 0.4];
}

export async function renderCard(opts: { photoId: PhotoId; label: string; caption: string }): Promise<Blob> {
  const p = photo(opts.photoId);
  const img = await loadImage(photoSrc(opts.photoId));
  const footer = 120;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE + footer;
  const ctx = canvas.getContext("2d")!;

  // Photo, cover-cropped at the photo's focal point.
  const side = Math.min(img.width, img.height);
  const [fx, fy] = focal(p.pos);
  ctx.drawImage(img, (img.width - side) * fx, (img.height - side) * fy, side, side, 0, 0, SIZE, SIZE);

  // Bottom gradient for legibility.
  const g = ctx.createLinearGradient(0, SIZE * 0.45, 0, SIZE);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, SIZE * 0.45, SIZE, SIZE * 0.55);

  const font = (w: number, px: number) => `${w} ${px}px ui-rounded, system-ui, -apple-system, "PingFang SC", "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 6;

  ctx.font = font(500, 52);
  const lines = wrapLines(opts.caption, SIZE - 140, (s) => ctx.measureText(s).width, 3);
  const lineH = 66;
  let y = SIZE - 70 - (lines.length - 1) * lineH;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = font(700, 34);
  ctx.fillText(opts.label, 70, y - 70);
  ctx.fillStyle = "#ffffff";
  ctx.font = font(500, 52);
  for (const l of lines) {
    ctx.fillText(l, 70, y);
    y += lineH;
  }

  // Footer: app name + photo credit (required for CC BY / BY-SA).
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, SIZE, SIZE, footer);
  ctx.fillStyle = "#334155";
  ctx.font = font(700, 36);
  ctx.fillText("🌿 Calmly", 60, SIZE + 72);
  ctx.fillStyle = "#94a3b8";
  ctx.font = font(400, 24);
  const credit = `Photo: ${needsCredit(p) ? p.author : "Wikimedia Commons"} · ${p.license}`;
  const cw = ctx.measureText(credit).width;
  ctx.fillText(credit.length > 70 ? `${credit.slice(0, 68)}…` : credit, Math.max(320, SIZE - 60 - cw), SIZE + 70);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("export failed"))), "image/png"));
}

/** Share with the native sheet when supported, else download. Returns what happened. */
export async function shareCard(opts: { photoId: PhotoId; label: string; caption: string; feeling: string }): Promise<"shared" | "downloaded" | "cancelled"> {
  const blob = await renderCard(opts);
  const name = shareFileName(opts.feeling, new Date());
  const file = new File([blob], name, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "My mood buddy" });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}
