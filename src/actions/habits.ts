"use server";

import { db } from "@/db";
import { habits, habitLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  ValidationError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
  APIError,
} from "@/lib/errors";
import { createHabitSchema, updateHabitSchema, logHabitSchema } from "@/lib/validation";
import { requireAuth, ensureUserExists } from "./shared";
import { checkRateLimit } from "@/lib/rate-limiter";
import { CACHE_TAGS } from "@/lib/data-fetchers";

// --- Habit Management ---

export async function createHabit(data: {
  id: string;
  title: string;
  description?: string;
  frequency?: "daily" | "weekly" | "custom";
  targetDays?: number[];
  targetCount?: number;
  timeOfDay?: "morning" | "afternoon" | "evening" | "anytime";
  reminderTime?: string;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 20 requests per minute
    const rateLimit = await checkRateLimit(userId, "create-habit", 20, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before creating more habits.");
    }

    // Validate input
    const validated = createHabitSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    await ensureUserExists();

    await db.insert(habits).values({
      id: data.id,
      userId,
      title: data.title,
      description: data.description,
      frequency: data.frequency || "daily",
      targetDays: data.targetDays,
      targetCount: data.targetCount,
      timeOfDay: data.timeOfDay || "anytime",
      reminderTime: data.reminderTime,
      currentStreak: 0,
      longestStreak: 0,
    });

    revalidateTag(CACHE_TAGS.habits(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");
    revalidatePath("/habits");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function updateHabit(data: {
  id: string;
  title?: string;
  description?: string;
  frequency?: "daily" | "weekly" | "custom";
  targetDays?: number[];
  targetCount?: number;
  timeOfDay?: "morning" | "afternoon" | "evening" | "anytime";
  reminderTime?: string;
  isArchived?: boolean;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    const rateLimit = await checkRateLimit(userId, "update-habit", 50, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before updating habits.");
    }

    const validated = updateHabitSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    await ensureUserExists();

    const updates: Partial<typeof habits.$inferInsert> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.frequency !== undefined) updates.frequency = data.frequency;
    if (data.targetDays !== undefined) updates.targetDays = data.targetDays;
    if (data.targetCount !== undefined) updates.targetCount = data.targetCount;
    if (data.timeOfDay !== undefined) updates.timeOfDay = data.timeOfDay;
    if (data.reminderTime !== undefined) updates.reminderTime = data.reminderTime;
    if (data.isArchived !== undefined) updates.isArchived = data.isArchived;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db
        .update(habits)
        .set(updates)
        .where(and(eq(habits.id, data.id), eq(habits.userId, userId)));
    }

    revalidateTag(CACHE_TAGS.habits(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");
    revalidatePath("/habits");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteHabit(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    const rateLimit = await checkRateLimit(userId, "delete-habit", 20, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting habits.");
    }

    await ensureUserExists();

    await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, userId)));

    revalidateTag(CACHE_TAGS.habits(userId), "default");
    revalidateTag(CACHE_TAGS.habitLogs(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");
    revalidatePath("/habits");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- Habit Logging ---

export async function logHabit(data: {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // High rate limit for logging (interactive)
    const rateLimit = await checkRateLimit(userId, "log-habit", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before logging habits.");
    }

    const validated = logHabitSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    await ensureUserExists();

    // Check if habit belongs to user
    const habit = await db
        .select()
        .from(habits)
        .where(and(eq(habits.id, data.habitId), eq(habits.userId, userId)))
        .limit(1);

    if (!habit || habit.length === 0) {
        throw new ValidationError({ habitId: ["Habit not found"] });
    }

    if (data.completed) {
      // Upsert log
      const existing = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, data.habitId),
            eq(habitLogs.date, data.date)
          )
        );

      if (existing.length === 0) {
        await db.insert(habitLogs).values({
          habitId: data.habitId,
          userId,
          date: data.date,
          notes: data.notes,
          completedAt: new Date(),
        });
      }
      // If already logged, we do nothing or update notes (skipping update for now)
    } else {
      // Remove log (undo)
      await db
        .delete(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, data.habitId),
            eq(habitLogs.date, data.date)
          )
        );
    }

    // Recalculate streaks (Simplified logic for now)
    // In a real app, we'd trigger a background job or use a stored procedure
    // Here we'll just increment/decrement casually or leave it for a separate sync
    // For MVP, let's just revalidate.

    revalidateTag(CACHE_TAGS.habitLogs(userId), "default");
    // Also revalidate habits to update streak if we implemented that
    revalidateTag(CACHE_TAGS.habits(userId), "default");
    revalidatePath("/habits");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}
