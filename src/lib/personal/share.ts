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
