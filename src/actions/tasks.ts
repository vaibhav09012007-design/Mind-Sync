"use server";

/**
 * Task-related server actions
 */

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  ValidationError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { createTaskSchema } from "@/lib/validation";
import { requireAuth, ensureUserExists } from "./shared";

// --- Tasks ---

export async function getTasks(): Promise<ActionResult<(typeof tasks.$inferSelect)[]>> {
  try {
    const { userId } = await requireAuth();
    const result = await db.select().from(tasks).where(eq(tasks.userId, userId));
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
    return createSuccessResult(undefined);
  } catch (error) {
    console.error("[toggleTaskStatus] Error:", error);
    return createErrorResult(error);
  }
}

export async function deleteTask(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid task ID"] });
    }

    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteCompletedTasks(): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    await db.delete(tasks).where(and(eq(tasks.status, "Done"), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
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
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteSubtask(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
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
    return createSuccessResult({ imported });
  } catch (error) {
    return createErrorResult(error);
  }
}
