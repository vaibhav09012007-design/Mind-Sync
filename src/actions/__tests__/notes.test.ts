import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNotes, createNote, updateNote, deleteNote } from "../notes";
import { db } from "@/db";
import { requireAuth } from "../shared";
import { checkRateLimit } from "@/lib/rate-limiter";

// --- HOISTED MOCKS (Required by Vitest for DB and Imports) ---

vi.mock("@/lib/data-fetchers", () => ({
  getCachedNotes: vi.fn().mockResolvedValue([
    { id: "123e4567-e89b-12d3-a456-426614174000", title: "Test Note 1", type: "personal" },
    { id: "550e8400-e29b-41d4-a716-446655440000", title: "Test Note 2", type: "meeting" },
  ]),
  CACHE_TAGS: {
    notes: (userId: string) => `notes-${userId}`,
  },
}));

const mocks = vi.hoisted(() => ({
  insertValues: vi.fn().mockResolvedValue([{ id: "550e8400-e29b-41d4-a716-446655440000", title: "New Note" }]),
  updateWhere: vi.fn().mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000", type: "meeting" }]),
  deleteWhere: vi.fn().mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000" }]),
}));

vi.mock("@/db", () => {
  return {
    db: {
      insert: vi.fn().mockReturnValue({ values: mocks.insertValues }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mocks.updateWhere,
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: mocks.deleteWhere,
      }),
    },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/actions/shared", () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: "test-user-123" }),
  ensureUserExists: vi.fn().mockResolvedValue(true),
}));

// --- TESTS ---

describe("Notes Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotes", () => {
    it("should return notes successfully", async () => {
      const result = await getNotes();
      expect(result).toEqual({
        success: true,
        data: expect.any(Array),
      });
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should handle unauthenticated error", async () => {
      (requireAuth as any).mockRejectedValueOnce(new Error("Unauthorized"));
      
      const result = await getNotes();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("createNote", () => {
    const validData = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Meeting Notes",
      content: "Discussed project timelines",
      preview: "Discussed project timelines...",
      date: new Date().toISOString(),
      type: "meeting" as const,
    };

    it("should create a note successfully", async () => {
      const result = await createNote(validData);
      expect(result).toEqual({ success: true, data: undefined });
      
      expect(requireAuth).toHaveBeenCalled();
      expect(checkRateLimit).toHaveBeenCalledWith("test-user-123", "create-note", 60, 60);
      expect(db.insert).toHaveBeenCalled();
      expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
        title: "Meeting Notes",
      }));
    });

    it("should reject if rate limited", async () => {
      (checkRateLimit as any).mockResolvedValueOnce({ allowed: false });
      
      const result = await createNote(validData);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain("Too Many Requests");
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should reject invalid data", async () => {
      const result = await createNote({ id: "invalid-id", title: "", content: "", preview: "", date: "" });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain("Note title is required");
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe("updateNote", () => {
    it("should update note properties successfully", async () => {
      const result = await updateNote("123e4567-e89b-12d3-a456-426614174000", {
        title: "Updated Note Title",
        type: "personal",
      });
      
      expect(db.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should skip DB update if no properties provided", async () => {
      const result = await updateNote("123e4567-e89b-12d3-a456-426614174000", {});
      
      expect(db.update).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("deleteNote", () => {
    it("should delete note successfully", async () => {
      const result = await deleteNote("123e4567-e89b-12d3-a456-426614174000");
      
      expect(requireAuth).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should require valid ID", async () => {
      const result = await deleteNote("");
      expect(result.success).toBe(false);
    });
    
    it("should return success even if invalid UUID is passed (graceful fallback)", async () => {
      // Mock db.delete to throw Postgres error code 22P02
      mocks.deleteWhere.mockRejectedValueOnce({ code: "22P02" });
      
      const result = await deleteNote("invalid-uuid-format");
      expect(db.delete).toHaveBeenCalled();
      // Should not throw, should return success
      expect(result.success).toBe(true);
    });
  });
});
