// Favourite animals. Learned from "Another photo": skipping a photo nudges its
// animal down a little; settling on one (no more swaps for a few seconds) nudges
// it up more. Next time, each feeling starts with the user's favourite animal
// among that feeling's photos. Stored per user in profiles.animal_prefs.

import type { Feeling } from "../critter/catalog";
import { FEELING_PHOTOS, PHOTOS, type PhotoId } from "../critter/photos";

export type AnimalPrefs = Record<string, number>;
export type PrefSignal = { photoId: PhotoId; action: "skip" | "settle" };

const ANIMAL_PREFIXES: [prefix: string, animal: string][] = [
  ["kitten-", "cat"], ["tabby-", "cat"], ["persian-", "cat"], ["siamese-", "cat"], ["fold-", "cat"],
  ["redpanda-", "red panda"], ["panda-", "panda"], ["capybara-", "capybara"], ["quokka-", "quokka"],
  ["koala-", "koala"], ["seal-", "seal"], ["hamster-", "hamster"], ["manul-", "Pallas's cat"],
  ["meerkat-", "meerkat"], ["otter-", "otter"],
];

/** The animal in a photo ("cat", "dog", "capybara", ...). Dog breeds are all "dog". */
export function animalOf(photoId: string): string {
  return ANIMAL_PREFIXES.find(([p]) => photoId.startsWith(p))?.[1] ?? "dog";
}

const WEIGHT = { skip: -1, settle: 2 } as const;
const CLAMP = 10;

/** Apply one signal; scores are clamped so old habits can still change. */
export function updatePrefs(prefs: AnimalPrefs, { photoId, action }: PrefSignal): AnimalPrefs {
  const a = animalOf(photoId);
  const next = Math.max(-CLAMP, Math.min(CLAMP, (prefs[a] ?? 0) + WEIGHT[action]));
  return { ...prefs, [a]: next };
}

/** Keep only known animals and finite, clamped numbers (input from the client or DB). */
export function sanitizePrefs(raw: unknown): AnimalPrefs {
  const known = new Set(Object.keys(PHOTOS).map(animalOf));
  const out: AnimalPrefs = {};
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (known.has(k) && typeof v === "number" && Number.isFinite(v)) out[k] = Math.max(-CLAMP, Math.min(CLAMP, v));
    }
  }
  return out;
}

/**
 * The photo a feeling should start with: the highest-scoring animal among the
 * feeling's photos. Ties (and users with no history) keep the curated order.
 */
export function preferredPhoto(feeling: Feeling, prefs: AnimalPrefs | undefined): PhotoId {
  const list = FEELING_PHOTOS[feeling];
  if (!prefs) return list[0];
  let best = list[0];
  let bestScore = prefs[animalOf(best)] ?? 0;
  for (const id of list.slice(1)) {
    const s = prefs[animalOf(id)] ?? 0;
    if (s > bestScore) {
      best = id;
      bestScore = s;
    }
  }
  return best;
}

/** The user's favourite animal, if they clearly have one. */
export function favouriteAnimal(prefs: AnimalPrefs | undefined): string | null {
  const top = Object.entries(prefs ?? {}).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 4 ? top[0] : null;
}
