import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTask, getTasks, updateTask, toggleTaskStatus, deleteTask } from "../tasks";
import { requireAuth } from "@/actions/shared";
import { checkRateLimit } from "@/lib/rate-limiter";
import { db } from "@/db";

// Mock dependencies
vi.mock("@/actions/shared", () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: "test-user-123" }),
  ensureUserExists: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/data-fetchers", () => ({
  getCachedTasks: vi.fn().mockResolvedValue([
    { id: "123e4567-e89b-12d3-a456-426614174000", title: "Test Task 1", status: "Todo" },
    { id: "550e8400-e29b-41d4-a716-446655440000", title: "Test Task 2", status: "Done" },
  ]),
  CACHE_TAGS: {
    tasks: (userId: string) => `tasks-${userId}`,
    dashboard: (userId: string) => `dashboard-${userId}`,
  },
}));

const mocks = vi.hoisted(() => ({
  insertValues: vi.fn().mockResolvedValue([{ id: "550e8400-e29b-41d4-a716-446655440000", title: "New Task" }]),
  updateWhere: vi.fn().mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000", status: "Done" }]),
  selectWhere: vi.fn().mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000", userId: "test-user-123" }]),
  deleteWhere: vi.fn().mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000" }]),
}));

vi.mock("@/db", () => {
  return {
    db: {
      insert: vi.fn().mockReturnValue({ values: mocks.insertValues }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({ where: mocks.updateWhere }),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({ where: mocks.selectWhere }),
      }),
      delete: vi.fn().mockReturnValue({ where: mocks.deleteWhere }),
    },
  };
});

describe("Tasks Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as any).mockResolvedValue({ userId: "test-user-123" });
    (checkRateLimit as any).mockResolvedValue({ allowed: true });
  });

  describe("getTasks", () => {
    it("should return tasks successfully", async () => {
      const result = await getTasks();
      
      expect(requireAuth).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].title).toBe("Test Task 1");
      }
    });

    it("should handle unauthenticated error", async () => {
      (requireAuth as any).mockRejectedValueOnce(new Error("Unauthorized"));
      
      const result = await getTasks();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("createTask", () => {
    const validData = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Buy Groceries",
    };

    it("should create a task successfully", async () => {
      const result = await createTask(validData);
      expect(result).toEqual({ success: true, data: undefined });
      
      expect(requireAuth).toHaveBeenCalled();
      expect(checkRateLimit).toHaveBeenCalledWith("test-user-123", "create-task", 50, 60);
      expect(db.insert).toHaveBeenCalled();
      expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
        title: "Buy Groceries",
        userId: "test-user-123",
        status: "Todo",
      }));
      expect(result.success).toBe(true);
    });

    it("should reject if rate limited", async () => {
      (checkRateLimit as any).mockResolvedValueOnce({ allowed: false });
      
      const result = await createTask(validData);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain("Too Many Requests");
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should reject invalid data", async () => {
      const result = await createTask({ id: "invalid-id", title: "" }); // Empty title fails validation
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain("Task title is required");
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe("updateTask", () => {
    it("should update task properties successfully", async () => {
      const result = await updateTask({
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Updated Title",
        priority: "P1",
      });

      expect(db.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should skip DB update if no properties provided", async () => {
      const result = await updateTask({ id: "123e4567-e89b-12d3-a456-426614174000" });
      
      expect(db.update).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("toggleTaskStatus", () => {
    it("should set task to Done when completed is true", async () => {
      mocks.selectWhere.mockResolvedValueOnce([{ id: "123e4567-e89b-12d3-a456-426614174000" }]); // mock exists
      
      const result = await toggleTaskStatus("123e4567-e89b-12d3-a456-426614174000", true);
      
      expect(db.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should return success even if task doesn't exist (optimistic UI resilience)", async () => {
      mocks.selectWhere.mockResolvedValueOnce([]); // mock does not exist
      
      const result = await toggleTaskStatus("non-existent", true);
      
      expect(db.update).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("deleteTask", () => {
    it("should delete task successfully", async () => {
      const result = await deleteTask("123e4567-e89b-12d3-a456-426614174000");
      
      expect(requireAuth).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
      expect(mocks.deleteWhere).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should require valid ID", async () => {
      const result = await deleteTask("");
      expect(result.success).toBe(false);
      expect(db.delete).not.toHaveBeenCalled();
    });
  });
});
