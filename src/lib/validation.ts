/**
 * Zod validation schemas for MindSync
 * Used to validate all inputs in server actions
 */
import { z } from "zod";

// --- Task Schemas ---

export const createTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Task title is required").max(500, "Title too long"),
  dueDate: z.string().datetime().optional(),
});

export const toggleTaskSchema = z.object({
  id: z.string().uuid(),
  completed: z.boolean(),
});

export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000, "Description too long").optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  status: z.enum(["Todo", "InProgress", "Done"]).optional(),
  estimatedMinutes: z.number().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  columnId: z.string().optional(),
});

// --- Event Schemas ---

export const createEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Event title is required").max(500),
  start: z.string().datetime(),
  end: z.string().datetime(),
  type: z.enum(["work", "personal", "meeting"]).default("work"),
});

export const updateEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  type: z.enum(["work", "personal", "meeting"]).optional(),
});

export const deleteEventSchema = z.object({
  id: z.string().uuid(),
});

// --- Note Schemas ---

export const createNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Note title is required").max(500),
  content: z.string(),
  date: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  type: z.enum(["meeting", "personal", "journal"]).optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  eventId: z.string().uuid().optional(),
});

export const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  content: z.string().max(100000, "Note too long").optional(),
  preview: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  type: z.enum(["meeting", "personal", "journal"]).optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().refine(
    (v) => !v || JSON.stringify(v).length < 10000,
    { message: "Metadata too large (max 10KB)" }
  ),
  eventId: z.string().uuid().nullable().optional(),
});

export const deleteNoteSchema = z.object({
  id: z.string().uuid(),
});

// --- AI Schemas ---

export const summarizeMeetingSchema = z.object({
  noteId: z.string().uuid(),
  transcript: z.string().min(10, "Transcript too short").max(50000, "Transcript too long"),
});

// --- Habit Schemas ---

export const createHabitSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Habit title is required").max(500),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).default("daily"),
  targetDays: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday
  targetCount: z.number().min(1).default(1),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "anytime"]).default("anytime"),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
});

export const updateHabitSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).optional(),
  targetDays: z.array(z.number()).optional(),
  targetCount: z.number().optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "anytime"]).optional(),
  reminderTime: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export const logHabitSchema = z.object({
  habitId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  notes: z.string().optional(),
  completed: z.boolean(), // true to complete, false to undo
});

// --- Type exports ---

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type SummarizeMeetingInput = z.infer<typeof summarizeMeetingSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type LogHabitInput = z.infer<typeof logHabitSchema>;
