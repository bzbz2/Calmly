# Calmly

Stress-relief chat companion: Next.js (App Router) + LangGraph.js/LangChain.js + Neon Postgres (Drizzle) + Auth.js.

All dependencies come from the public npm registry. Do not add private or company-scoped packages; the app builds on Vercel.

## Setup
1. `cp .env.example .env` and fill in `DATABASE_URL` (Neon), `AUTH_SECRET`, `OPENAI_API_KEY`.
2. `bun install --registry https://registry.npmjs.org` (keeps `bun.lock` pointing at public npm)
3. `bun run db:migrate` (applies every `drizzle/*.sql` file in order; idempotent)
4. `bun run dev`
5. `bun run test` (unit tests, Bun's built-in runner)

## Guest mode and sign-in
- **No sign-in wall.** `/` is the chat: "How's your day going?", a looping buddy story (`files_double`), the message box and 4 mood chips. The first message quietly creates a **guest account** (Auth.js credentials provider `guest`, `src/auth.ts`), so the buddy, chats and moods are saved like anyone else's. "Log in" is a small link at the top right for returning users.
- **Limits:** a guest can send 10 messages per 24 hours (`GUEST_DAILY_MESSAGES`, checked in `/api/chat`), and one network can create at most 20 guests a day (salted IP hash, never the IP). Sending a gift needs a real account.
- **Nudges to sign up** (guests only, `GUEST_UI` in `src/lib/guest.ts`): after the first buddy ("喜欢这只小家伙吗？保存下来，明天还能看到它。"), a banner above the mood chart ("登录后，换手机也不会丢失记录"), after "Share today's me", and when the daily limit is reached. Each comes back to the same chat (`/chat?c=<id>`) after sign-up.
- **Keeping the data:** signing up as a guest turns the guest account into the real one in place (same id). Logging into an existing account, or Google/Apple with an existing email, moves the guest's chats, moods, corrections, gifts and animal preferences into it in one batch and deletes the guest (`mergeGuestInto`, `src/lib/guest-server.ts`). The guest is read from the session cookie being replaced.
- **Login page:** Apple, Google, and email + password only. Apple/Google appear when `AUTH_APPLE_ID/SECRET` or `AUTH_GOOGLE_ID/SECRET` are set (disabled placeholders in development).
- **Gifts:** a friend opens `/g/<token>` with no login, and "Which buddy am I today?" goes straight into a guest chat. Only "Send one back" asks to sign up, then returns to `/gift?reply=<token>`; a draft started as a guest is kept across sign-up.
- Migration: `drizzle/0005_guests.sql` (nullable email and password, `is_guest`, `ip_hash`).

## Agent graph (`src/lib/agent/graph.ts`)
START → crisisCheck → moodExtract → (high risk ? crisisResponse : responder ⇄ tools) → updateMemory → END
- Tools: tarot, astrology (sun sign), food therapy, breathing/grounding, CBT reframing.
- Memory: rolling per-user summary in `profiles.summary` + last 10 moods injected into the prompt.
- Moods saved per message to `mood_entries`, charted on `/mood`.

## Mood buddy (in chat)
Each chat session has a mood buddy that **follows the user's latest clear mood**: a real animal photo with a 1-2s micro-motion and a tiny overlay, plus a short first-person caption laid over the photo ("明明不是我的错，却要我来扛。"). It sits at the bottom of the chat-history sidebar (on mobile, a compact row above the messages). When a new message expresses a different feeling, the card fades in with the new photo. Neutral follow-ups ("ok", "what should I do?") keep the current buddy. The open chat's history thumbnail matches the live buddy; other chats show a thumbnail from their opening line. The caption, feeling label and buttons follow the input language. The buddy mirrors how you feel; it never responds to you or tries to comfort you. Calmly's reply does that.

- **Session rule** (`src/lib/critter/session.ts`): `sessionMood(messages)` walks user messages from newest to oldest and uses the first one with a clear feeling. A message's feeling comes from `messages.feeling` (the user's correction, or the feeling the LLM picked; `"none"` = neutral), else from keyword matching (`hasMoodSignal`), which gives an instant guess before the reply arrives. If no message has a clear signal, it falls back to the first message. It is pure and deterministic, so reopening a conversation recomputes the same buddy. Safety: a crisis message (keyword pre-screen, or the agent replied with the crisis message) hides the buddy until the user expresses a new clear mood.
- **UI** (`src/components/critter/SessionBuddy.tsx`): `layout="sidebar" | "inline"`, plus `SessionThumb` for the history list. The old `/critter` URL redirects to `/chat`.

## Voice chat (talk and listen)
The message bar has a microphone button. Tap it and speak, and Calmly answers out loud. The conversation is hands-free (listen → send → speak the reply → listen again) until you tap **End**. Calmly waits until you've finished: short pauses mid-sentence don't end your turn; about 2 seconds of quiet does (`END_OF_SPEECH_MS`), or tap **Done**. While Calmly is speaking, tap the status chip to skip. Every reply also has a **🔊 Read aloud** button.

- **Free, no keys, no packages:** uses the browser's Web Speech APIs, `SpeechRecognition` (speech-to-text) and `speechSynthesis` (text-to-speech). In Chrome and Edge, recognition audio is processed by the browser vendor's free speech service; synthesis uses voices installed on the device.
- **Languages, automatic:** English (`en-US`) and Chinese (`zh-CN`), no toggle. Recognition listens in the language of your last message in this chat, else of your last chat, else your browser's. If a turn comes back unclear (low recognizer confidence), Calmly asks once to repeat and listens in the other language. Calmly replies in the language you used, and replies are spoken in their own language with the best installed voice (`pickVoice`).
- **Speech quality:** replies are cleaned for speech (no markdown or bullets; links read as their domain) and queued in sentence-sized chunks, because Chrome cuts off long utterances (`src/lib/voice.ts`).
- **Robustness:** recognition is paused while Calmly speaks, so it never hears itself. After about a minute of silence, voice mode pauses itself. Blocked microphone, missing speech service and unsupported browsers (e.g. Firefox) show a friendly message, and typing still works.
- **Hook:** `src/components/voice/useVoiceChat.ts`.

## Personalization
Pure logic lives in `src/lib/personal/` (unit-tested in `tests/personal.test.ts` and `tests/trend.test.ts`); DB access is in `src/lib/personal/server.ts`. Migration: `drizzle/0003_personalization.sql`.

- **LLM picks the buddy:** the agent's mood analysis returns one of the 29 feelings (or `none`), saved on the user's message and its mood entry. Keywords are only the instant first guess.
- **Correct the buddy:** tap the feeling label on the card to pick another feeling (`FeelingPicker`). `POST /api/feeling` updates the message and mood entry, and logs keyword vs LLM vs user choice in `feeling_corrections` to improve matching.
- **Favourite animals:** "Another photo" counts as a skip (−1) for that animal; staying on a photo for 4s counts as a settle (+2). Scores are clamped to ±10 and stored in `profiles.animal_prefs` (`POST /api/prefs`). Each feeling then starts with the favourite animal among its photos.
- **Quick replies** under Calmly's latest answer, matched to the feeling and language (anxious → Breathe with me, wronged → Help me say it, tired → Tiny reset, ...).
- **Gentle check-in:** a new chat opens with "Last time you felt wronged about … How did it go?" when the last mood was heavy and 3h–7 days old.
- **Patterns** over the last 8 weeks, in the user's time zone (the client sends `tzOffset`): the same heavy feeling on the same weekday three weeks in a row ("Third tired Monday in a row."), 3+ heavy days in a row, or stress climbing. Shown on the new-chat screen and given to the agent to mention once, gently.
- **My mood page** (`MoodDashboard`, `MoodTrend`, `src/lib/personal/trend.ts`), in the language you chat in:
  - Trend chart: one point per local day (several check-ins merge into the day's average; tap a point for that day's check-ins). Days without check-ins stay empty and the line never bridges them ("No entries" / "没记录"). Emoji instead of numbers on the Y axis. A **Mood | Stress** switch shows one line at a time. Default range: last 7 days.
  - This week: days with check-ins, average mood vs the previous 7 days, the most stressful day, what came up most, and a pattern if there is one. With fewer than 3 days of data: "Log a few more days and I'll start spotting your patterns."
  - Weekly photo diary: one buddy per day for the last 7 days (`WeekDiary`).
  - Anonymous **mood weather** (`GET /api/weather`): the most common feeling among everyone who checked in over the last 24 hours, one vote per person (their latest check-in), e.g. "Today 62% of people feel tired". Only counts leave the server, and below 5 people (`WEATHER_MIN_PEOPLE`) nothing about feelings is shown.
- **Share my mood card** (a 1080×1200 PNG drawn on a canvas: photo, feeling, caption and photo credit, never the user's messages; native share sheet when available, else download):
  - in chat, at the reveal moment: one small **📤 Share today's me / 分享今天的我** button under Calmly's reply once the buddy is shown (it shares exactly what the card shows, after any photo/caption swaps). Also ⤴ on the card;
  - on My mood, tap a day in the weekly diary to share that day's card;
  - **Share my week / 分享周回顾**: a 1080×1350 recap with the 7 daily buddies and how the week felt. It leaves out "what came up" (triggers).
- **First screen:** a placeholder buddy (a calm photo of your favourite animal), "Hi {name}, How's your day going?", and 4 one-tap moods (😫 Tired / 😐 Meh / 😊 Good / 😰 Anxious; 累 / 一般 / 不错 / 焦虑 in Chinese). A chip sends a short message with its feeling, so the buddy appears instantly and your own choice is stored instead of the LLM's guess (`src/lib/personal/welcome.ts`).
- **Sidebar:** shows the 3 most recent chats (plus the open one). "Show earlier chats" reveals the rest; nothing is deleted. `GET /api/insights` returns mood rows, the last mood and animal prefs, never message text.

- **Matching** (`src/lib/critter/match.ts`): deterministic and weighted, with no LLM call. It understands English (regex) and Chinese (keywords, with 不/没 negation) and produces two signals:
  - **situation** (meetings, task overload, social battery, unseen effort, tiny victory) picks the caption story;
  - **feeling** (29 of them, below) picks the photo, motion and overlay.
  If the user's feeling differs from a situation's usual tone ("meetings make me anxious"), the feeling wins. On a score tie, the more specific feeling wins (`FEELING_PRIORITY`); a light + heavy tie reads as `mixed`.
- **Safety** (`src/lib/critter/safety.ts`): an English + Chinese keyword crisis pre-screen runs first. On a hit, the page shows the shared support message (`src/lib/safety.ts`) and no photo. It's a coarse net; the chat agent's LLM risk check remains the primary safety path.
- **Privacy:** the buddy is derived from the saved chat history plus the feeling stored on each message. Mood tracking still comes only from the chat agent's `mood_entries`.
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
- Sharing beyond images: copy link, opt-in public page with opaque IDs, OG tags.
- Chat action "turn this into a critter", privacy-safe usage counts, and opt-in "log this mood".

## Send a buddy (送一只 🎁)
Caring for someone else, separate from your own mood: the buddy comes from what you want to say, never from how you feel.

- **Entry points:** a permanent nav link **Send a buddy 🎁 / 送一只 🎁** (`/gift`), and a gentle line on the buddy card only when your mood is good ("心情不错，要不要把好心情送给谁？"). Never shown on low moods.
- **Flow** (`src/components/gift/GiftFlow.tsx`): pick a phrase (想你了 / 加油 / 抱抱 / 辛苦了 / 生日快乐 / 自己写; Miss you / You've got this / Hugs / You've worked so hard / Happy birthday / Write your own), and Calmly pairs a matching animal (抱抱 → koala). **Another animal** cycles the phrase's photos. Optional "to" name. **Create link** gives a `/g/<token>` link with Copy and Share. "Sent recently" shows whether each gift was opened.
- **The friend's page** (`/g/<token>`, public, no login): "小明送你一只考拉：抱抱 🐨", the animated card, and two buttons: **回送一只 / Send one back** (`/gift?reply=<token>`, the loop that spreads it) and **看看今天的我是哪只 / Which buddy am I today?** (into Calmly). Logged-out friends go through sign-up first and land where they were going (`?next=`, same-site paths only). The page has link-preview tags (title + photo) and is `noindex`.
- **Privacy and safety:** the link token is 16 random bytes (unguessable); the page shows only the sender's display name, the message and the photo. Custom text is one line, max 40 characters, with links and control characters removed. Limit: 30 gifts per person per day. Data: `gifts` table (`drizzle/0004_gifts.sql`), logic in `src/lib/gift/`.
- **Later:** suggest a gift when the user mentions someone else having a hard time ("我朋友最近压力很大" → "要不要送 TA 一只 buddy？"). Needs simple intent detection.
