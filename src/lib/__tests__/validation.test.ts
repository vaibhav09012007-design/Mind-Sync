import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  createEventSchema,
  createNoteSchema,
  summarizeMeetingSchema,
} from "../validation";

describe("Validation Schemas", () => {
  describe("createTaskSchema", () => {
    it("should validate a valid task", () => {
      const result = createTaskSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Buy groceries",
        dueDate: "2024-01-15T10:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const result = createTaskSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID", () => {
      const result = createTaskSchema.safeParse({
        id: "not-a-uuid",
        title: "Valid title",
      });
      expect(result.success).toBe(false);
    });

    it("should allow optional dueDate", () => {
      const result = createTaskSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "No due date task",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createEventSchema", () => {
    it("should validate a valid event", () => {
      const result = createEventSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Team meeting",
        start: "2024-01-15T09:00:00.000Z",
        end: "2024-01-15T10:00:00.000Z",
        type: "meeting",
      });
      expect(result.success).toBe(true);
    });

    it("should use default type if not provided", () => {
      const result = createEventSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Work block",
        start: "2024-01-15T09:00:00.000Z",
        end: "2024-01-15T10:00:00.000Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("work");
      }
    });

    it("should reject invalid event type", () => {
      const result = createEventSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Invalid type",
        start: "2024-01-15T09:00:00.000Z",
        end: "2024-01-15T10:00:00.000Z",
        type: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createNoteSchema", () => {
    it("should validate a valid note", () => {
      const result = createNoteSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Meeting notes",
        content: "Discussion about Q4 goals",
        date: "2024-01-15T10:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("should reject too long title", () => {
      const result = createNoteSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "a".repeat(501),
        content: "Valid content",
        date: "2024-01-15T10:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("summarizeMeetingSchema", () => {
    it("should validate valid summarization input", () => {
      const result = summarizeMeetingSchema.safeParse({
        noteId: "550e8400-e29b-41d4-a716-446655440000",
        transcript: "This is a meeting transcript with enough content to summarize...",
      });
      expect(result.success).toBe(true);
    });

    it("should reject too short transcript", () => {
      const result = summarizeMeetingSchema.safeParse({
        noteId: "550e8400-e29b-41d4-a716-446655440000",
        transcript: "Too short",
      });
      expect(result.success).toBe(false);
    });
  });
});
