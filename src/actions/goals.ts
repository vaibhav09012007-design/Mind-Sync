"use server";

import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuth, ensureUserExists } from "./shared";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getCachedGoals, CACHE_TAGS } from "@/lib/data-fetchers";
import {
  ActionResult,
  createSuccessResult,
  createErrorResult,
  APIError,
} from "@/lib/errors";

export async function getGoals(): Promise<ActionResult<(typeof goals.$inferSelect)[]>> {
  try {
    const { userId } = await requireAuth();
    if (!userId) return createSuccessResult([]);

    // Use cached fetcher
    const result = await getCachedGoals(userId);

    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function createGoal(data: {
  userId: string;
  title: string;
  targetValue: number;
  metric: "hours" | "tasks" | "streak";
  period: "weekly" | "monthly";
  startDate: Date;
  endDate: Date;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 20 requests per minute for goal creation
    const rateLimit = await checkRateLimit(userId, "create-goal", 20, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before creating more goals.");
    }

    await ensureUserExists(userId);

    // Ensure we use the authenticated user's ID, not the one passed in data if different
    // Although the signature takes userId, we should override it or validate it.
    // Ideally the data param shouldn't take userId, but for now we overwrite it.

    await db.insert(goals).values({
      ...data,
      userId, // Force userId from auth
    });

    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidateTag(CACHE_TAGS.goals(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function updateGoalProgress(id: string, currentValue: number): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 60 requests per minute for updates
    const rateLimit = await checkRateLimit(userId, "update-goal", 60, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before updating goals.");
    }

    await db
      .update(goals)
      .set({ currentValue, updatedAt: new Date() })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidateTag(CACHE_TAGS.goals(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteGoal(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidateTag(CACHE_TAGS.goals(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}
