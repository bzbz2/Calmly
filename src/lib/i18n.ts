// Tiny server-side language pick for pages without a chat history to go on.

import { headers } from "next/headers";
import type { Lang } from "./critter/catalog";

/** "zh" if the browser's preferred language is Chinese, else "en". */
export async function requestLang(): Promise<Lang> {
  const al = (await headers()).get("accept-language") ?? "";
  return al.trim().toLowerCase().startsWith("zh") ? "zh" : "en";
}
