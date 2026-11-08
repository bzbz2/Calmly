import { pgTable, text, timestamp, integer, jsonb, uuid, real, index, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Guests (made on the first message, no sign-up) have no email or password yet.
  email: text("email").unique(),
  name: text("name"),
  passwordHash: text("password_hash"), // null for guests and Google/Apple sign-ins
  isGuest: boolean("is_guest").notNull().default(false),
  ipHash: text("ip_hash"), // guests only: salted hash of the creating IP, to cap guest sign-ups
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  birthdate: text("birthdate"), // YYYY-MM-DD, optional, for astrology
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  // Rolling memory: what the agent knows about this person
  summary: text("summary").notNull().default(""),
  // Favourite animals learned from "Another photo" (see src/lib/personal/animals.ts)
  animalPrefs: jsonb("animal_prefs").$type<Record<string, number>>().notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("conv_user_idx").on(t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    // User messages: feeling the LLM picked (a Feeling, or "none"); a user correction overwrites it.
    feeling: text("feeling"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("msg_conv_idx").on(t.conversationId, t.createdAt)],
);

export const moodEntries = pgTable(
  "mood_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
    score: real("score").notNull(), // 1 (very low) .. 10 (great)
    stress: integer("stress").notNull(), // 1..10
    label: text("label").notNull(), // primary emotion
    emotions: jsonb("emotions").$type<string[]>().notNull().default([]),
    triggers: jsonb("triggers").$type<string[]>().notNull().default([]),
    feeling: text("feeling"), // one of the 29 feelings; null if none/unknown
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("mood_user_idx").on(t.userId, t.createdAt)],
);

export const feelingCorrections = pgTable(
  "feeling_corrections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    matcherFeeling: text("matcher_feeling"),
    llmFeeling: text("llm_feeling"),
    correctedFeeling: text("corrected_feeling").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("corr_user_idx").on(t.userId, t.createdAt)],
);

// "Send a buddy" gifts (see src/lib/gift/gifts.ts). Public at /g/<token>.
export const gifts = pgTable(
  "gifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    senderName: text("sender_name").notNull(),
    toName: text("to_name"),
    phrase: text("phrase").notNull(),
    message: text("message").notNull(),
    photoId: text("photo_id").notNull(),
    lang: text("lang").notNull(),
    replyTo: uuid("reply_to"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    openedAt: timestamp("opened_at"),
  },
  (t) => [index("gift_sender_idx").on(t.senderId, t.createdAt)],
);

/**
 * One-time codes for "Forgot password". Only a keyed hash of the code is stored; a
 * code lasts 5 minutes, allows a few wrong tries, and is marked used once it works.
 */
export const passwordResetCodes = pgTable(
  "password_reset_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("reset_email_idx").on(t.email, t.createdAt)],
);
