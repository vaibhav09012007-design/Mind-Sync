import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth module
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock the database module
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

// Mock the schema
vi.mock("@/db/schema", () => ({
  tasks: { userId: "user_id" },
  events: { userId: "user_id" },
  notes: { userId: "user_id" },
}));

describe("getInitialData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when user is not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

    const { getInitialData } = await import("../get-initial-data");
    const result = await getInitialData();

    expect(result).toBeNull();
  });

  it("should return initial data structure when authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user_123" });

    const { db } = await import("@/db");
    const mockWhere = vi.fn();

    // Mock tasks query
    mockWhere.mockResolvedValueOnce([
      {
        id: "task-1",
        title: "Test Task",
        status: "Todo",
        dueDate: new Date("2024-01-15"),
        priority: "P2",
        tags: ["work"],
        description: "Test description",
        recurrence: null,
      },
    ]);

    // Mock events query
    mockWhere.mockResolvedValueOnce([
      {
        id: "event-1",
        title: "Test Event",
        startTime: new Date("2024-01-15T09:00:00Z"),
        endTime: new Date("2024-01-15T10:00:00Z"),
        googleEventId: "google-123",
      },
    ]);

    // Mock notes query
    mockWhere.mockResolvedValueOnce([
      {
        id: "note-1",
        title: "Test Note",
        preview: "Preview text",
        content: '{"type":"doc"}',
        createdAt: new Date("2024-01-15"),
        tags: ["meeting"],
        type: "personal",
      },
    ]);

    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: mockWhere,
      }),
    });

    const { getInitialData } = await import("../get-initial-data");
    const result = await getInitialData();

    expect(result).not.toBeNull();
    expect(result?.tasks).toBeDefined();
    expect(result?.events).toBeDefined();
    expect(result?.notes).toBeDefined();
  });

  it("should handle database errors gracefully", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user_123" });

    const { db } = await import("@/db");
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("Database error");
    });

    const { getInitialData } = await import("../get-initial-data");
    const result = await getInitialData();

    expect(result).toBeNull();
  });
});
