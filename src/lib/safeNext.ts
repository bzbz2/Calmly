/** Only same-site paths are allowed as a post-login destination (no open redirects). */
export function safeNext(raw: string | null | undefined, fallback = "/chat"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
