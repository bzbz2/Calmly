// Static scene catalog for "Express with a critter".
// No database table: scenes are code. To add a scene, add an entry here, a
// matching component in src/components/critter/scenes/, and register it in
// CritterStage. Only set `enabled: true` once original art exists.

export const MOOD_INTENTS = ["meeting_fatigue", "task_overload", "social_battery", "unseen_effort", "tiny_victory", "general"] as const;
export type MoodIntent = (typeof MOOD_INTENTS)[number];

export type CharacterId = "cat" | "hamster" | "dog";

export type Scene = {
  sceneId: MoodIntent;
  characterId: CharacterId;
  description: string;
  moodTags: string[];
  captions: string[]; // variants; "Try another" cycles through them
  alt: string; // accessible description of what the animation shows
  durationMs: number;
  enabled: boolean; // false = art not produced yet; selection falls back to `general`
  version: number;
};

export const SCENES: Record<MoodIntent, Scene> = {
  meeting_fatigue: {
    sceneId: "meeting_fatigue",
    characterId: "cat",
    description: "Cat at a laptop hears another meeting ping, freezes, then slowly gives the camera a long, knowing look.",
    moodTags: ["exasperated", "drained", "meetings"],
    captions: ["Another quick sync?", "This could have been an email.", "Camera off. Soul also off.", "Per my last meeting…"],
    alt: "An orange cat at a laptop hears a 'Quick sync?' notification, freezes, then slowly turns to give you a long, unimpressed look.",
    durationMs: 2000,
    enabled: true,
    version: 1,
  },
  task_overload: {
    sceneId: "task_overload",
    characterId: "hamster",
    description: "Hamster holds one sheet; more land; it disappears behind a tall paper stack.",
    moodTags: ["overwhelmed", "busy"],
    captions: ["Just one more thing…", "The to-do list has a to-do list.", "Inbox: yes."],
    alt: "A hamster holding one sheet of paper vanishes behind a growing paper stack.",
    durationMs: 2000,
    enabled: false,
    version: 0,
  },
  social_battery: {
    sceneId: "social_battery",
    characterId: "dog",
    description: "Dog gives a polite wave, then slides into a blanket burrito.",
    moodTags: ["socially drained", "introvert"],
    captions: ["Social battery: 1%", "Peopled out. Please recharge.", "Blanket mode activated."],
    alt: "A dog gives a polite wave and then rolls itself into a blanket burrito.",
    durationMs: 2000,
    enabled: false,
    version: 0,
  },
  unseen_effort: {
    sceneId: "unseen_effort",
    characterId: "hamster",
    description: "Hamster looks around, then quietly crowns itself with a paper crown.",
    moodTags: ["unappreciated", "overlooked"],
    captions: ["Employee of my own day", "I see you. (It's me. I'm you.)", "Self-appointed MVP."],
    alt: "A hamster looks around, then quietly places a tiny paper crown on its own head.",
    durationMs: 2000,
    enabled: false,
    version: 0,
  },
  tiny_victory: {
    sceneId: "tiny_victory",
    characterId: "dog",
    description: "Dog plants its feet, puffs out its chest, and strikes a triumphant pose.",
    moodTags: ["proud", "relieved"],
    captions: ["A legendary achievement", "Historians will write about this.", "Small win, big chest puff."],
    alt: "A dog plants its feet, puffs out its chest, and strikes a heroic pose.",
    durationMs: 2000,
    enabled: false,
    version: 0,
  },
  general: {
    sceneId: "general",
    characterId: "cat",
    description: "Cat with a mug of tea gives a slow, friendly blink.",
    moodTags: ["any"],
    captions: ["Feelings received. Slow blink sent.", "Noted. Tea is steeping.", "Whatever it is, you're allowed to feel it."],
    alt: "An orange cat holding a steaming mug of tea gives you a slow, friendly blink.",
    durationMs: 2000,
    enabled: true,
    version: 1,
  },
};
