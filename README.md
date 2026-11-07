# Calmly

Stress-relief chat companion: Next.js (App Router) + LangGraph.js/LangChain.js + Neon Postgres (Drizzle) + Auth.js.

All dependencies come from the public npm registry. Do not add private or company-scoped packages; the app builds on Vercel.

## Setup
1. `cp .env.example .env` and fill in `DATABASE_URL` (Neon), `AUTH_SECRET`, `OPENAI_API_KEY`.
2. `bun install --registry https://registry.npmjs.org` (keeps `bun.lock` pointing at public npm)
3. `bun run db:migrate` (applies every `drizzle/*.sql` file in order; idempotent)
4. `bun run dev`
5. `bun run test` (unit tests, Bun's built-in runner)

## Agent graph (`src/lib/agent/graph.ts`)
START → crisisCheck → moodExtract → (high risk ? crisisResponse : responder ⇄ tools) → updateMemory → END
- Tools: tarot, astrology (sun sign), food therapy, breathing/grounding, CBT reframing.
- Memory: rolling per-user summary in `profiles.summary` + last 10 moods injected into the prompt.
- Moods saved per message to `mood_entries`, charted on `/mood`.

## Mood buddy (in chat)
Each chat session gets **one** mood buddy, picked from the session's **first** message: a real animal photo with a 1-2s micro-motion and a tiny overlay, plus a short first-person caption laid over the photo ("明明不是我的错，却要我来扛。"). It sits at the bottom of the chat-history sidebar (on mobile, a compact row above the messages), and every conversation in the history list shows its buddy as a small thumbnail. The caption, feeling label and buttons follow the input language. The buddy mirrors how you feel; it never responds to you or tries to comfort you. Calmly's reply does that.

- **Session rule** (`src/lib/critter/session.ts`): `sessionSelection(firstUserMessage)` is pure and deterministic, so nothing extra is stored. Reopening a conversation recomputes the same buddy from history, and later messages never change it. No buddy appears if the opening trips the crisis pre-screen or the agent replied with the crisis message.
- **UI** (`src/components/critter/SessionBuddy.tsx`): `layout="sidebar" | "inline"`, plus `SessionThumb` for the history list. The old `/critter` URL redirects to `/chat`.

- **Matching** (`src/lib/critter/match.ts`): deterministic and weighted, with no LLM call. It understands English (regex) and Chinese (keywords, with 不/没 negation) and produces two signals:
  - **situation** (meetings, task overload, social battery, unseen effort, tiny victory) picks the caption story;
  - **feeling** (29 of them, below) picks the photo, motion and overlay.
  If the user's feeling differs from a situation's usual tone ("meetings make me anxious"), the feeling wins. On a score tie, the more specific feeling wins (`FEELING_PRIORITY`); a light + heavy tie reads as `mixed`.
- **Safety** (`src/lib/critter/safety.ts`): an English + Chinese keyword crisis pre-screen runs first. On a hit, the page shows the shared support message (`src/lib/safety.ts`) and no photo. It's a coarse net; the chat agent's LLM risk check remains the primary safety path.
- **Privacy:** the buddy stores nothing of its own. It is derived from the chat history that is already saved. Mood tracking still comes only from the chat agent's `mood_entries`.
- **Card** (`src/components/critter/CritterStage.tsx`): a square photo with the caption on a soft bottom gradient, the feeling label as a small line above the caption (keeping the face clear), and an SVG overlay (z's, rain cloud, "?", steam...) on top. Motion is plain CSS keyframes in `critter.css` under `.cr-m-<feeling>`: subtle pan, tilt, breathing zoom, shake, color tint. The photo is pre-scaled to 1.08 so motion never shows an edge. Under `prefers-reduced-motion`, the card is still. Replay, Pause, **Another photo** (same feeling, next photo) and **Another caption** are provided.

### Photos and licensing
53 photos in `public/critters/`, all from Wikimedia Commons under CC0, public domain, CC BY or CC BY-SA, resized to 560px JPEG and self-hosted. Metadata (alt text, author, license, source) is in `src/lib/critter/photos.ts`; the card shows the credit line under every photo, and `public/critters/CREDITS.md` lists them all. Don't add photos with unknown or watermarked/stock licenses.

Photo rules: animals only (no people or body parts), nothing scary (no bones, skulls, bared fangs or snarling), the animal fills most of the frame, its face is clearly visible and roughly facing the camera, and the image is bright.

### Feelings
| Feeling | 中文 | Micro-motion + overlay | Photos |
|---|---|---|---|
| tired | 累 | heavy nod, dims, z's | yawning koala, yawning kitten, napping dog |
| sad | 难过 | slow sink, colors drain, rain cloud | seal pup, sandy black puppy, basset hound |
| wronged | 委屈 | quiver and sniff, a tear that won't fall | dog in a cone, sandy puppy, basset pup |
| jealous | 吃醋 | side glance and huff, green tinge, hearts | side-eye tabby, annoyed tabby, Pallas's cat |
| regret | 遗憾 | drifts back and fades, balloon floats off | guilty dog, kitten looking down, shepherd |
| dejected | 沮丧 | one long sigh, sinks, gloom lines | shepherd, Labrador on couch, flat pom |
| forlorn | 落寞 | slow drift, faded color, falling leaf | seal pup on ice, dog in snow, Labrador |
| lonely | 孤单 | slowly pulls back, typing bubble that never sends | Labrador on couch, seal pup on ice, basset hound |
| indignant | 愤愤不平 | "hmph" toss, anger mark | frowning Persian, Pallas's cat, annoyed tabby |
| furious | 暴跳如雷 | stomping shake, red flash, steam | frowning Persian, grumpy Persian |
| scared | 恐惧 | trembles, darker, shiver lines | kitten under blanket, peeking red panda |
| anxious | 忐忑不安 | restless jitter, racing heart, sweat | kitten in leaves, peeking red panda, meerkat |
| on_edge | 提心吊胆 | tense push-in and flinch, swinging weight | meerkat, kitten in leaves, peeking red panda |
| shocked | 大惊失色 | punch-in, color drains, "!" | wide-eyed kitten, open-mouthed Siamese |
| stunned | 目瞪口呆 | frozen, slow zoom, "..." | capybara face-on, standing hamster, seal pup |
| surprised | 诧异 | small jolt back, "!" | curious red panda, husky pup, white Persian |
| baffled | 莫名其妙 | head tilt both ways, "?" | head-tilt pom, husky pup, red panda |
| confused | 迷茫 | looks left/right through fog | panda cub, quokka, dog in snow |
| disgusted | 嫌弃 | recoils, green tinge, stink lines | flehmen-face cats, red panda |
| overwhelmed | 压力山大 | wobbles under falling papers | flat hamster, capybara in a tray, flat pom |
| torn | 患得患失 | tilts warm/cool, petals drop | basset with flower, white Persian, red panda |
| wistful | 留恋 | slow warm push-in, golden glow | white Persian, basset with flower, red panda |
| bored | 百无聊赖 | barely moves, looping fly | capybara in a tray, red panda, shiba |
| relieved | 释怀 | long exhale, brightens, butterfly flies off | eyes-closed cat, floating otter, quokka |
| calm | 心如止水 | slow breath | capybara face-on, capybara by water, floating otter |
| relaxed | 松弛 | lazy sway in the sun | capybara in a tray, sleeping panda, eyes-closed cat |
| happy | 开心 | gentle bounce, sparkles | smiling samoyed, smiling shibas |
| elated | 手舞足蹈 | hopping, notes and confetti | corgi in snow, running papillon, running sheepdog |
| mixed | 五味杂陈 | slow drift, tangled scribble | capybara, grumpy Persian, Pallas's cat |

`meeting_fatigue` has its own motion: a "Quick sync?" ping, then a slow, unimpressed push-in (plays once). Other situations use their situation caption with the matching feeling's card.

### Adding a photo
1. Find an openly licensed photo on Wikimedia Commons (CC0, PD, CC BY, CC BY-SA).
2. Resize it: `sips -s format jpeg -s formatOptions 72 -Z 560 in.jpg --out public/critters/<id>.jpg`.
3. Add a `PHOTOS` entry (alt, author, license, licenseUrl, source, optional `pos` focal point) and list the id under one or more feelings in `FEELING_PHOTOS` (`src/lib/critter/photos.ts`). The first id is the default.
4. Add a row to `public/critters/CREDITS.md`. `bun run test` checks that the file exists and the credit is complete.

### Adding a feeling
1. Add it to `FEELINGS` and `FEELING_SCENES` (en/zh label, en/zh first-person captions) in `src/lib/critter/catalog.ts`, and give it photos in `FEELING_PHOTOS`.
2. Add English rules, Chinese keywords and a `FEELING_PRIORITY` slot in `src/lib/critter/match.ts`.
3. Add an overlay case in `CritterStage.tsx` and keyframes under `.cr-m-<id>` in `critter.css`. The **base** CSS style is the representative still; keyframes animate from there.
4. Add tests to `tests/critter/feelings.test.ts`.

### Backlog
- Per-photo focal points (`pos`) for tighter crops, and more photos per feeling.
- Phase 3: sharing (Web Share, copy link, opt-in public page with opaque IDs, OG tags) and media export.
- Chat action "turn this into a critter", privacy-safe usage counts, and opt-in "log this mood".
