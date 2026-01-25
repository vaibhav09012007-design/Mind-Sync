import { pgTable, text, timestamp, uuid, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["Todo", "InProgress", "Done"]);
export const priorityEnum = pgEnum("priority", ["P0", "P1", "P2", "P3"]);
export const attachmentTypeEnum = pgEnum("attachment_type", ["image", "file", "link"]);
export const goalMetricEnum = pgEnum("goal_metric", ["hours", "tasks", "streak"]);
export const goalPeriodEnum = pgEnum("goal_period", ["weekly", "monthly"]);
export const goalStatusEnum = pgEnum("goal_status", ["active", "completed", "failed"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  email: text("email").notNull().unique(),
  googleRefreshToken: text("google_refresh_token"),
  preferences: jsonb("preferences").default({ theme: "dark" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  parentId: uuid("parent_id"), // Self-reference for subtasks
  dependsOn: uuid("depends_on"), // Task dependency - blocked by another task
  title: text("title").notNull(),
  description: text("description"),
  status: statusEnum("status").default("Todo").notNull(),
  priority: priorityEnum("priority").default("P2"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedMinutes: integer("estimated_minutes"),
  actualMinutes: integer("actual_minutes"),
  linkedEventId: uuid("linked_event_id"),
  tags: text("tags").array(),
  recurrence: jsonb("recurrence"), // { type: "daily"|"weekly"|"monthly", interval: number }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tasks_user_status").on(table.userId, table.status),
  index("idx_tasks_user_due").on(table.userId, table.dueDate),
  index("idx_tasks_user_priority").on(table.userId, table.priority),
  index("idx_tasks_depends_on").on(table.dependsOn),
]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  googleEventId: text("google_event_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  meetingUrl: text("meeting_url"),
  location: text("location"),
  isRecurring: jsonb("is_recurring"), // { frequency, interval, until }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_events_user_start").on(table.userId, table.startTime),
  index("idx_events_user_end").on(table.userId, table.endTime),
]);

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  eventId: uuid("event_id").references(() => events.id),
  title: text("title").notNull().default("Untitled"),
  content: jsonb("content"), // Tiptap JSON content
  preview: text("preview"),
  tags: text("tags").array(),
  type: text("type").default("personal"), // "meeting" | "personal"
  metadata: jsonb("metadata"), // { checklist, images, etc. }
  rawTranscript: text("raw_transcript"),
  aiSummary: text("ai_summary"),
  actionItems: jsonb("action_items"),
  sentiment: text("sentiment"), // "positive" | "neutral" | "negative"
  keyDecisions: jsonb("key_decisions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notes_user_updated").on(table.userId, table.updatedAt),
  index("idx_notes_user_type").on(table.userId, table.type),
]);

// Attachments for tasks and notes
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  noteId: uuid("note_id").references(() => notes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: attachmentTypeEnum("type").notNull(),
  size: integer("size"), // bytes
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task templates for quick creation
export const taskTemplates = pgTable("task_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  tasks: jsonb("tasks").notNull(), // Array of task templates
  isPublic: jsonb("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recurring task instances
export const recurringTaskInstances = pgTable("recurring_task_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateTaskId: uuid("template_task_id")
    .references(() => tasks.id)
    .notNull(),
  instanceDate: timestamp("instance_date").notNull(),
  taskId: uuid("task_id").references(() => tasks.id), // Created task instance
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0).notNull(),
  metric: goalMetricEnum("metric").notNull(),
  period: goalPeriodEnum("period").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: goalStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rate limiting table for distributed rate limiting (works across serverless instances)
export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // Format: "userId:action"
  count: integer("count").default(0).notNull(),
  windowStart: timestamp("window_start").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_rate_limits_key").on(table.key),
  index("idx_rate_limits_expires").on(table.expiresAt),
]);
