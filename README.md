# Calmly

Stress-relief chat companion: Next.js (App Router) + LangGraph.js/LangChain.js + Neon Postgres (Drizzle) + Auth.js.

## Setup
1. `cp .env.example .env.local` and fill in `DATABASE_URL` (Neon), `AUTH_SECRET`, `OPENAI_API_KEY`.
2. `bun install` (or npm/pnpm)
3. `DATABASE_URL=... bunx drizzle-kit push` (creates tables; drizzle.config reads `.env`, so export it or copy to `.env`)
4. `bun run dev`

## Agent graph (`src/lib/agent/graph.ts`)
START → crisisCheck → moodExtract → (high risk ? crisisResponse : responder ⇄ tools) → updateMemory → END
- Tools: tarot, astrology (sun sign), food therapy, breathing/grounding, CBT reframing.
- Memory: rolling per-user summary in `profiles.summary` + last 10 moods injected into the prompt.
- Moods saved per message to `mood_entries`, charted on `/mood`.
