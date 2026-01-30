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
  description: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  status: z.enum(["Todo", "InProgress", "Done"]).optional(),
  estimatedMinutes: z.number().optional(),
  tags: z.array(z.string()).optional(),
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
});

export const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  preview: z.string().max(200).optional(),
});

export const deleteNoteSchema = z.object({
  id: z.string().uuid(),
});

// --- AI Schemas ---

export const summarizeMeetingSchema = z.object({
  noteId: z.string().uuid(),
  transcript: z.string().min(10, "Transcript too short").max(50000, "Transcript too long"),
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
