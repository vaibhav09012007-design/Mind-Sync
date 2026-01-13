import { pgTable, text, timestamp, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["Todo", "InProgress", "Done"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  email: text("email").notNull().unique(),
  googleRefreshToken: text("google_refresh_token"),
  preferences: jsonb("preferences").default({ theme: "dark" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  status: statusEnum("status").default("Todo").notNull(),
  dueDate: timestamp("due_date"),
  linkedEventId: uuid("linked_event_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  googleEventId: text("google_event_id").notNull(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  meetingUrl: text("meeting_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  eventId: uuid("event_id").references(() => events.id),
  title: text("title").notNull().default("Untitled"),
  content: jsonb("content"), // Tiptap JSON content
  rawTranscript: text("raw_transcript"),
  aiSummary: text("ai_summary"),
  actionItems: jsonb("action_items"),
  createdAt: timestamp("created_at").defaultNow(),
});
