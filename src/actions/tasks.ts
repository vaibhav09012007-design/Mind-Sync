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
import { requireWorkspaceAuth, ensureUserExists } from "./shared";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getCachedTasks, CACHE_TAGS } from "@/lib/data-fetchers";
import { logger } from "@/lib/logger";

// --- Tasks ---

export async function getTasks(): Promise<ActionResult<(typeof tasks.$inferSelect)[]>> {
  try {
    const { workspaceId } = await requireWorkspaceAuth();
    // Use cached fetcher
    const result = await getCachedTasks(workspaceId);
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
    const { userId, workspaceId } = await requireWorkspaceAuth();

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
    await ensureUserExists();

    await db.insert(tasks).values({
      id: data.id,
      userId,
      workspaceId,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "Todo",
    });

    // Fire-and-forget AI auto-categorization (non-blocking)
    import("./ai-categorize").then(({ autoCategorizeTask }) => {
      autoCategorizeTask(data.id).catch(() => {
        // Silently ignore — categorization is a nice-to-have enhancement
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    revalidateTag(CACHE_TAGS.dashboard(workspaceId), "default");

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
    const { userId, workspaceId } = await requireWorkspaceAuth();

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

    await ensureUserExists();

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
      .where(and(eq(tasks.id, data.id), eq(tasks.workspaceId, workspaceId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    revalidateTag(CACHE_TAGS.dashboard(workspaceId), "default");

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
    const { userId, workspaceId } = await requireWorkspaceAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "toggle-task", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before toggling tasks.");
    }

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid task ID"] });
    }

    await ensureUserExists();

    // Check if task exists first
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspaceId)));

    if (existingTask.length === 0) {
      logger.warn("Task not found for toggle", { action: "toggleTaskStatus", taskId: id });
      // Task doesn't exist in DB - this can happen with optimistic updates
      // Return success to avoid showing error to user
      return createSuccessResult(undefined);
    }

    await db
      .update(tasks)
      .set({
        status: completed ? "Done" : "Todo",
        completedAt: completed ? new Date() : null,
      })
      .where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspaceId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    revalidateTag(CACHE_TAGS.dashboard(workspaceId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    logger.error("Failed to toggle task status", error as Error, { action: "toggleTaskStatus" });
    return createErrorResult(error);
  }
}

export async function deleteTask(id: string): Promise<ActionResult<void>> {
  try {
    const { userId, workspaceId } = await requireWorkspaceAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "delete-task", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting tasks.");
    }

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid task ID"] });
    }

    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspaceId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    revalidateTag(CACHE_TAGS.dashboard(workspaceId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteCompletedTasks(): Promise<ActionResult<void>> {
  try {
    const { userId, workspaceId } = await requireWorkspaceAuth();

    // Rate Limit: 10 requests per minute
    const rateLimit = await checkRateLimit(userId, "delete-completed-tasks", 10, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting tasks.");
    }

    await db.delete(tasks).where(and(eq(tasks.status, "Done"), eq(tasks.workspaceId, workspaceId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    revalidateTag(CACHE_TAGS.dashboard(workspaceId), "default");

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
    const { userId, workspaceId } = await requireWorkspaceAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "sync-subtask", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before syncing subtasks.");
    }

    // Check if subtask exists
    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, data.id), eq(tasks.workspaceId, workspaceId)));

    if (existing.length === 0) {
      // Create new subtask
      await db.insert(tasks).values({
        id: data.id,
        userId,
        workspaceId,
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
        .where(and(eq(tasks.id, data.id), eq(tasks.workspaceId, workspaceId)));
    }

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    // revalidateTag(CACHE_TAGS.tasks(workspaceId));

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteSubtask(id: string): Promise<ActionResult<void>> {
  try {
    const { userId, workspaceId } = await requireWorkspaceAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "delete-subtask", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting subtasks.");
    }

    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspaceId)));

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    // revalidateTag(CACHE_TAGS.tasks(workspaceId));

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
    const { userId, workspaceId } = await requireWorkspaceAuth();

    // Rate Limit: 20 requests per minute
    const rateLimit = await checkRateLimit(userId, "clone-task", 20, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before cloning tasks.");
    }

    await ensureUserExists();

    // Create cloned task
    await db.insert(tasks).values({
      id: data.id,
      userId,
      workspaceId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: (data.priority as "P0" | "P1" | "P2" | "P3") || "P2",
      estimatedMinutes: data.estimatedMinutes,
      tags: data.tags,
      status: "Todo",
    });

    // Batch-insert subtasks in a single DB call
    if (data.subtasks && data.subtasks.length > 0) {
      const subtaskValues = data.subtasks.map((st) => ({
        id: st.id,
        userId,
        workspaceId,
        parentId: data.id,
        title: st.title,
        status: (st.completed ? "Done" : "Todo") as "Todo" | "InProgress" | "Done",
      }));
      await db.insert(tasks).values(subtaskValues);
    }

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    revalidateTag(CACHE_TAGS.dashboard(workspaceId), "default");

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
    const { userId, workspaceId } = await requireWorkspaceAuth();

    // Rate Limit: 5 requests per minute (heavy operation)
    const rateLimit = await checkRateLimit(userId, "bulk-import-tasks", 5, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before importing tasks.");
    }

    await ensureUserExists();

    // Batch-insert all tasks in a single DB call
    const taskValues = tasksData.map((task) => ({
      id: task.id,
      userId,
      workspaceId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      priority: (task.priority as "P0" | "P1" | "P2" | "P3") || "P2",
      estimatedMinutes: task.estimatedMinutes,
      tags: task.tags,
      status: "Todo" as const,
    }));
    await db.insert(tasks).values(taskValues);
    const imported = taskValues.length;

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    revalidateTag(CACHE_TAGS.dashboard(workspaceId), "default");

    return createSuccessResult({ imported });
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- Recurring Tasks ---

import { recurringTaskInstances } from "@/db/schema";
import { isNotNull } from "drizzle-orm";
import { generateRecurringDates, shouldCreateInstance } from "@/lib/recurring-tasks";
import { addDays, startOfDay } from "date-fns";

/**
 * Process all recurring tasks for a user and generate instances for the next 7 days.
 * Called by cron endpoint or manually from settings.
 */
export async function processRecurringTasks(): Promise<ActionResult<{ created: number }>> {
  try {
    const { userId, workspaceId } = await requireWorkspaceAuth();
    await ensureUserExists();

    // 1. Fetch all tasks with recurrence config
    const recurringTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), isNotNull(tasks.recurrence)));

    if (recurringTasks.length === 0) {
      return createSuccessResult({ created: 0 });
    }

    const today = startOfDay(new Date());
    const rangeEnd = addDays(today, 7);

    let totalCreated = 0;

    for (const task of recurringTasks) {
      const recurrence = task.recurrence as { type: "daily" | "weekly" | "monthly"; interval: number } | null;
      if (!recurrence) continue;

      // Get the starting date for generation
      const taskStart = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt!);

      // Generate upcoming dates
      const dates = generateRecurringDates(taskStart, recurrence, today, rangeEnd);

      if (dates.length === 0) continue;

      // Fetch existing instances for this template
      const existingInstances = await db
        .select()
        .from(recurringTaskInstances)
        .where(eq(recurringTaskInstances.templateTaskId, task.id));

      const existingDates = existingInstances.map((i) => new Date(i.instanceDate));

      // Filter to only dates that need new instances
      const newDates = dates.filter((d) => shouldCreateInstance(d, existingDates));

      if (newDates.length === 0) continue;

      // Batch create task instances and tracking records
      const newTaskValues = newDates.map((date) => ({
        id: crypto.randomUUID(),
        userId,
        workspaceId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        tags: task.tags,
        dueDate: date,
        status: "Todo" as const,
      }));

      const insertedTasks = await db.insert(tasks).values(newTaskValues).returning({ id: tasks.id });

      // Track instances to prevent duplicates
      const instanceValues = newDates.map((date, i) => ({
        templateTaskId: task.id,
        instanceDate: date,
        taskId: insertedTasks[i]?.id,
      }));

      await db.insert(recurringTaskInstances).values(instanceValues);
      totalCreated += newDates.length;
    }

    if (totalCreated > 0) {
      revalidatePath("/dashboard");
      revalidatePath("/kanban");
      revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    }

    logger.info("Processed recurring tasks", {
      action: "process_recurring",
      created: totalCreated,
      templates: recurringTasks.length,
    });

    return createSuccessResult({ created: totalCreated });
  } catch (error) {
    logger.error("Failed to process recurring tasks", error as Error, { action: "process_recurring" });
    return createErrorResult(error);
  }
}
