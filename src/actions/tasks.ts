"use server";

/**
 * Task-related server actions
 */

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  ValidationError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
  APIError,
} from "@/lib/errors";
import { createTaskSchema, updateTaskSchema } from "@/lib/validation";
import { requireAuth, ensureUserExists } from "./shared";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getCachedTasks, CACHE_TAGS } from "@/lib/data-fetchers";

// --- Tasks ---

export async function getTasks(): Promise<ActionResult<(typeof tasks.$inferSelect)[]>> {
  try {
    const { userId } = await requireAuth();
    // Use cached fetcher
    const result = await getCachedTasks(userId);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function createTask(data: {
  id: string;
  title: string;
  dueDate?: string;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 50 requests per minute
    const rateLimit = await checkRateLimit(userId, "create-task", 50, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before creating more tasks.");
    }

    // Validate input
    const validated = createTaskSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    // Ensure user exists in database (handles race conditions)
    await ensureUserExists(userId);

    await db.insert(tasks).values({
      id: data.id,
      userId,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "Todo",
    });

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function updateTask(data: {
  id: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: "P0" | "P1" | "P2" | "P3";
  status?: "Todo" | "InProgress" | "Done";
  estimatedMinutes?: number;
  tags?: string[];
  columnId?: string;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "update-task", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before updating tasks.");
    }

    // Validate input
    const validated = updateTaskSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    await ensureUserExists(userId);

    // Prepare update object
    const updates: Partial<typeof tasks.$inferInsert> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.estimatedMinutes !== undefined) updates.estimatedMinutes = data.estimatedMinutes;
    if (data.tags !== undefined) updates.tags = data.tags;

    // Handle status update (direct or via columnId)
    if (data.status !== undefined) {
      updates.status = data.status;
    } else if (data.columnId !== undefined) {
      // Map columnId to status
      if (data.columnId === "Todo") updates.status = "Todo";
      else if (data.columnId === "InProgress") updates.status = "InProgress";
      else if (data.columnId === "Done") updates.status = "Done";
      // Other columns like "Backlog" mapping to Todo or ignored depending on requirements
      // For now, we only map known statuses
    }

    if (Object.keys(updates).length === 0) {
      return createSuccessResult(undefined);
    }

    updates.updatedAt = new Date();

    await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, data.id), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function toggleTaskStatus(
  id: string,
  completed: boolean
): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "toggle-task", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before toggling tasks.");
    }

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid task ID"] });
    }

    await ensureUserExists(userId);

    // Check if task exists first
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    if (existingTask.length === 0) {
      console.warn(`[toggleTaskStatus] Task not found: ${id} for user ${userId}`);
      // Task doesn't exist in DB - this can happen with optimistic updates
      // Return success to avoid showing error to user
      return createSuccessResult(undefined);
    }

    await db
      .update(tasks)
      .set({ status: completed ? "Done" : "Todo" })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    console.error("[toggleTaskStatus] Error:", error);
    return createErrorResult(error);
  }
}

export async function deleteTask(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "delete-task", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting tasks.");
    }

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid task ID"] });
    }

    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteCompletedTasks(): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 10 requests per minute
    const rateLimit = await checkRateLimit(userId, "delete-completed-tasks", 10, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting tasks.");
    }

    await db.delete(tasks).where(and(eq(tasks.status, "Done"), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- Subtask Sync ---

export async function syncSubtask(data: {
  id: string;
  parentId: string;
  title: string;
  completed: boolean;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "sync-subtask", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before syncing subtasks.");
    }

    // Check if subtask exists
    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, data.id), eq(tasks.userId, userId)));

    if (existing.length === 0) {
      // Create new subtask
      await db.insert(tasks).values({
        id: data.id,
        userId,
        parentId: data.parentId,
        title: data.title,
        status: data.completed ? "Done" : "Todo",
      });
    } else {
      // Update existing subtask
      await db
        .update(tasks)
        .set({
          title: data.title,
          status: data.completed ? "Done" : "Todo",
          completedAt: data.completed ? new Date() : null,
        })
        .where(and(eq(tasks.id, data.id), eq(tasks.userId, userId)));
    }

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    // revalidateTag(CACHE_TAGS.tasks(userId));

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteSubtask(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "delete-subtask", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting subtasks.");
    }

    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    // revalidateTag(CACHE_TAGS.tasks(userId));

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- Task Clone ---

export async function cloneTaskToDb(data: {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  estimatedMinutes?: number;
  tags?: string[];
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 20 requests per minute
    const rateLimit = await checkRateLimit(userId, "clone-task", 20, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before cloning tasks.");
    }

    await ensureUserExists(userId);

    // Create cloned task
    await db.insert(tasks).values({
      id: data.id,
      userId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: (data.priority as "P0" | "P1" | "P2" | "P3") || "P2",
      estimatedMinutes: data.estimatedMinutes,
      tags: data.tags,
      status: "Todo",
    });

    // Create subtasks
    if (data.subtasks && data.subtasks.length > 0) {
      for (const st of data.subtasks) {
        await db.insert(tasks).values({
          id: st.id,
          userId,
          parentId: data.id,
          title: st.title,
          status: st.completed ? "Done" : "Todo",
        });
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- Bulk Import ---

export async function bulkImportTasks(
  tasksData: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    estimatedMinutes?: number;
    tags?: string[];
  }>
): Promise<ActionResult<{ imported: number }>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 5 requests per minute (heavy operation)
    const rateLimit = await checkRateLimit(userId, "bulk-import-tasks", 5, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before importing tasks.");
    }

    await ensureUserExists(userId);

    let imported = 0;
    for (const task of tasksData) {
      await db.insert(tasks).values({
        id: task.id,
        userId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        priority: (task.priority as "P0" | "P1" | "P2" | "P3") || "P2",
        estimatedMinutes: task.estimatedMinutes,
        tags: task.tags,
        status: "Todo",
      });
      imported++;
    }

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult({ imported });
  } catch (error) {
    return createErrorResult(error);
  }
}
