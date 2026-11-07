"use client";
// Draws the buddy card on a canvas (photo, label, caption, credit) and shares it via
// the Web Share API, or downloads it as a PNG. No libraries. The user's message
// text is never included.

import { photo, photoSrc, needsCredit, type PhotoId } from "@/lib/critter/photos";
import { photoCredits, shareFileName, wrapLines } from "@/lib/personal/share";

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

export type ShareResult = "shared" | "downloaded" | "cancelled";

/** Share with the native sheet when supported, else download. Returns what happened. */
export async function shareCard(opts: { photoId: PhotoId; label: string; caption: string; feeling: string; date?: Date }): Promise<ShareResult> {
  const blob = await renderCard(opts);
  return shareImage(blob, shareFileName(opts.feeling, opts.date ?? new Date()));
}

export type WeekCardDay = { name: string; isToday: boolean; photoId: PhotoId | null; label: string };

/**
 * Week recap image: 7 buddies (one per day) and a few lines about the week.
 * Contains no chat text and no triggers (see weekCardLines).
 */
export async function renderWeekCard(opts: { title: string; days: WeekCardDay[]; lines: string[] }): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const font = (w: number, px: number) => `${w} ${px}px ui-rounded, system-ui, -apple-system, "PingFang SC", "Noto Sans SC", sans-serif`;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#eef2ff");
  bg.addColorStop(1, "#fdf2f8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1e293b";
  ctx.font = font(800, 60);
  ctx.fillText(opts.title, 70, 140);

  // 7 photo tiles.
  const pad = 70;
  const gap = 14;
  const tile = (W - pad * 2 - gap * 6) / 7;
  const top = 210;
  const imgs = await Promise.all(opts.days.map((d) => (d.photoId ? loadImage(photoSrc(d.photoId)).catch(() => null) : Promise.resolve(null))));
  opts.days.forEach((d, i) => {
    const x = pad + i * (tile + gap);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, top, tile, tile, 20);
    ctx.clip();
    const img = imgs[i];
    if (img && d.photoId) {
      const side = Math.min(img.width, img.height);
      const [fx, fy] = focal(photo(d.photoId).pos);
      ctx.drawImage(img, (img.width - side) * fx, (img.height - side) * fy, side, side, x, top, tile, tile);
    } else {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(x, top, tile, tile);
    }
    ctx.restore();
    if (d.isToday) {
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(x, top, tile, tile, 20);
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = d.isToday ? "#4338ca" : "#64748b";
    ctx.font = font(d.isToday ? 800 : 600, 26);
    ctx.fillText(d.name, x + tile / 2, top + tile + 42);
    ctx.fillStyle = "#334155";
    ctx.font = font(500, 22);
    const label = wrapLines(d.label || "·", tile, (s) => ctx.measureText(s).width, 1)[0] ?? "";
    ctx.fillText(label, x + tile / 2, top + tile + 76);
    ctx.textAlign = "left";
  });

  // Lines about the week.
  let y = top + tile + 170;
  ctx.font = font(500, 40);
  for (const l of opts.lines) {
    ctx.fillStyle = "#6366f1";
    ctx.beginPath();
    ctx.arc(pad + 12, y - 13, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#334155";
    for (const part of wrapLines(l, W - pad * 2 - 40, (s) => ctx.measureText(s).width, 2)) {
      ctx.fillText(part, pad + 40, y);
      y += 58;
    }
    y += 18;
  }

  // Footer: app name + photo credits.
  ctx.fillStyle = "#334155";
  ctx.font = font(700, 36);
  ctx.fillText("🌿 Calmly", pad, H - 90);
  ctx.fillStyle = "#94a3b8";
  ctx.font = font(400, 20);
  const ids = opts.days.map((d) => d.photoId).filter((x): x is PhotoId => !!x);
  const credits = wrapLines(photoCredits(ids.map(photo)), W - pad * 2, (s) => ctx.measureText(s).width, 2);
  credits.forEach((c, i) => ctx.fillText(c, pad, H - 50 + i * 26));

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("export failed"))), "image/png"));
}

export async function shareWeekCard(opts: { title: string; days: WeekCardDay[]; lines: string[] }): Promise<ShareResult> {
  return shareImage(await renderWeekCard(opts), shareFileName("week", new Date()));
}

async function shareImage(blob: Blob, name: string): Promise<ShareResult> {
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
