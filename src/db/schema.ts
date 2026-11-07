import { pgTable, text, timestamp, integer, jsonb, uuid, real, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
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
