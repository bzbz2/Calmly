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

## Express with a critter (`/critter`)
Type one sentence and get a 2-second original animal micro-animation.

- **Matching** (`src/lib/critter/match.ts`): deterministic weighted phrases, so there is no LLM call or cost. Ambiguous or low-confidence text falls back to the `general` scene.
- **Safety** (`src/lib/critter/safety.ts`): a keyword crisis pre-screen runs first. On a hit, the page shows the shared support message (`src/lib/safety.ts`) and no animation. It's a coarse net; the chat agent's LLM risk check remains the primary safety path.
- **Privacy:** the sentence is not stored, logged, or echoed back, and critter use never writes to `mood_entries`.
- **Art:** an original hand-authored SVG cat ("Miso", `src/components/critter/Cat.tsx`), animated with plain CSS keyframes (`critter.css`). Under `prefers-reduced-motion`, the final frame shows as a still. Pause and Replay controls are provided.

### Scene status
| Scene | Character | Status |
|---|---|---|
| `meeting_fatigue` | cat | done |
| `general` (fallback) | cat | done |
| `task_overload` | hamster | not drawn yet (`enabled: false`, falls back to `general` art and says so) |
| `social_battery` | dog | not drawn yet |
| `unseen_effort` | hamster | not drawn yet |
| `tiny_victory` | dog | not drawn yet |

### Adding a scene
1. Draw it as a component in `src/components/critter/scenes/`. Give each part a `cr-*` class. The **base** style must be the final pose, and the keyframes start from the opening pose with `fill-mode: both`.
2. Add its keyframes to `critter.css`, scoped under `.cr-scene-<name>`.
3. Register it in `SCENE_ART` (`CritterStage.tsx`) and set `enabled: true` in `src/lib/critter/catalog.ts`.
4. Add matching tests to `tests/critter/match.test.ts`.

### Backlog
- Phase 2: hamster and dog characters plus their 4 scenes.
- Phase 3: sharing (Web Share, copy link, opt-in public page with opaque IDs, OG tags) and media export.
- Chat action "turn this into a critter", privacy-safe usage counts, and opt-in "log this mood".
