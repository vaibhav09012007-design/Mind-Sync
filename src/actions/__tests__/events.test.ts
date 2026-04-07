import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEvents, createEvent, updateEvent, deleteEvent, syncGoogleCalendar } from "../events";
import { db } from "@/db";
import { requireAuth } from "../shared";
import { checkRateLimit } from "@/lib/rate-limiter";
import { GoogleCalendarService } from "@/lib/google-calendar";

// --- HOISTED MOCKS (Required by Vitest for DB and Imports) ---

vi.mock("@/lib/data-fetchers", () => ({
  getCachedEvents: vi.fn().mockResolvedValue([
    { id: "123e4567-e89b-12d3-a456-426614174000", title: "Test Event 1", type: "work" },
    { id: "550e8400-e29b-41d4-a716-446655440000", title: "Test Event 2", type: "personal" },
  ]),
  CACHE_TAGS: {
    events: (userId: string) => `events-${userId}`,
    dashboard: (userId: string) => `dashboard-${userId}`,
  },
}));

const mocks = vi.hoisted(() => ({
  insertValues: vi.fn().mockResolvedValue([{ id: "550e8400-e29b-41d4-a716-446655440000", title: "New Event" }]),
  updateWhere: vi.fn().mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000", type: "personal" }]),
  selectWhere: vi.fn().mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000", userId: "test-user-123" }]),
  deleteWhere: vi.fn().mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000" }]),
}));

vi.mock("@/db", () => {
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mocks.selectWhere,
        }),
      }),
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

vi.mock("@/lib/google-calendar", () => ({
  GoogleCalendarService: {
    insertEvent: vi.fn().mockResolvedValue({ id: "google-event-1" }),
    updateEvent: vi.fn().mockResolvedValue(true),
    deleteEvent: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("@/actions/shared", () => ({
  requireAuth: vi.fn().mockResolvedValue({ 
    userId: "test-user-123",
    getToken: vi.fn().mockResolvedValue("mocked-oauth-token")
  }),
  ensureUserExists: vi.fn().mockResolvedValue(true),
}));

// --- TESTS ---

describe("Events Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEvents", () => {
    it("should return events successfully", async () => {
      const result = await getEvents();
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
      
      const result = await getEvents();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("createEvent", () => {
    const validData = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Team Meeting",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(),
      type: "meeting",
    };

    it("should create an event successfully", async () => {
      const result = await createEvent(validData);
      expect(result).toEqual({ success: true, data: undefined });
      
      expect(requireAuth).toHaveBeenCalled();
      expect(checkRateLimit).toHaveBeenCalledWith("test-user-123", "create-event", 50, 60);
      expect(GoogleCalendarService.insertEvent).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
        title: "Team Meeting",
      }));
    });

    it("should reject if rate limited", async () => {
      (checkRateLimit as any).mockResolvedValueOnce({ allowed: false });
      
      const result = await createEvent(validData);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain("Too Many Requests");
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should reject invalid data", async () => {
      const result = await createEvent({ id: "invalid-id", title: "", start: "", end: "", type: "" });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain("Event title is required");
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe("updateEvent", () => {
    it("should update event properties successfully", async () => {
      const result = await updateEvent("123e4567-e89b-12d3-a456-426614174000", {
        title: "Updated Event Title",
        type: "work",
      });
      
      expect(db.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should skip DB update if no properties provided", async () => {
      const result = await updateEvent("123e4567-e89b-12d3-a456-426614174000", {});
      
      expect(db.update).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("deleteEvent", () => {
    it("should delete event successfully", async () => {
      const result = await deleteEvent("123e4567-e89b-12d3-a456-426614174000");
      
      expect(requireAuth).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should require valid ID", async () => {
      const result = await deleteEvent("");
      expect(result.success).toBe(false);
    });
  });

  describe("syncGoogleCalendar", () => {
    it("should handle unauthorized token correctly", async () => {
      // Mock missing token
      (requireAuth as any).mockResolvedValueOnce({ 
        userId: "test-user-123",
        getToken: vi.fn().mockResolvedValue(null)
      });
      
      const result = await syncGoogleCalendar();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Please connect your Google Calendar");
      }
    });
  });
});
