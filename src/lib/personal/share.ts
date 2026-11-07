// Share the buddy card as an image. Privacy: the image contains only the photo,
// the feeling label and the buddy's own caption, never the user's message text.

/**
 * Wrap text to lines no wider than `maxWidth` using `measure` (canvas measureText).
 * Breaks at spaces for Latin text and between characters for CJK.
 */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number, maxLines = 4): string[] {
  const tokens = text.match(/[㐀-鿿　-〿＀-￯]|[^\s㐀-鿿　-〿＀-￯]+|\s+/g) ?? [];
  const lines: string[] = [];
  let line = "";
  for (const tok of tokens) {
    const candidate = line + tok;
    if (!line.trim() || measure(candidate.trimEnd()) <= maxWidth) {
      line = candidate;
      continue;
    }
    lines.push(line.trimEnd());
    line = tok.trimStart();
  }
  if (line.trim()) lines.push(line.trimEnd());
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S?$/, "…");
    return kept;
  }
  return lines;
}

/** File name for the exported card, e.g. "calmly-wronged-2026-11-07.png". */
export function shareFileName(feeling: string, now: Date): string {
  return `calmly-${feeling.replace(/[^a-z_]/gi, "")}-${now.toISOString().slice(0, 10)}.png`;
}

/**
 * Lines for the shareable week recap. Leaves out what came up in chats (triggers):
 * a shared image should say how the week felt, not what it was about.
 */
export function weekCardLines(insights: { id: string; text: string }[]): string[] {
  return insights.filter((i) => i.id !== "triggers" && i.id !== "more").map((i) => i.text);
}

/** One attribution line for several photos (CC BY / BY-SA need the authors' names). */
export function photoCredits(photos: { author: string; license: string }[]): string {
  const authors = [...new Set(photos.filter((p) => /^CC BY/i.test(p.license) && p.author).map((p) => p.author))];
  return authors.length ? `Photos: ${authors.join(", ")} · Wikimedia Commons (CC BY / BY-SA)` : "Photos: Wikimedia Commons";
}
