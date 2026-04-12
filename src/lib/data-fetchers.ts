import { db } from "@/db";
import { tasks, events, notes, goals, habits, habitLogs } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

// --- Tags for Cache Invalidation ---
export const CACHE_TAGS = {
  tasks: (workspaceId: string) => `tasks-${workspaceId}`,
  events: (workspaceId: string) => `events-${workspaceId}`,
  notes: (workspaceId: string) => `notes-${workspaceId}`,
  goals: (workspaceId: string) => `goals-${workspaceId}`,
  habits: (userId: string) => `habits-${userId}`,
  habitLogs: (userId: string) => `habit-logs-${userId}`,
  dashboard: (workspaceId: string) => `dashboard-${workspaceId}`,
};

// --- Tasks Fetcher ---
export const getCachedTasks = cache(async (workspaceId: string) => {
  return unstable_cache(
    async () => {
      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.workspaceId, workspaceId))
        .orderBy(desc(tasks.createdAt));
    },
    [CACHE_TAGS.tasks(workspaceId)],
    {
      tags: [CACHE_TAGS.tasks(workspaceId)],
      revalidate: 3600, // 1 hour default (invalidated by actions)
    }
  )();
});

// --- Events Fetcher ---
export const getCachedEvents = cache(async (workspaceId: string) => {
  return unstable_cache(
    async () => {
      return await db
        .select()
        .from(events)
        .where(eq(events.workspaceId, workspaceId))
        .orderBy(asc(events.startTime));
    },
    [CACHE_TAGS.events(workspaceId)],
    {
      tags: [CACHE_TAGS.events(workspaceId)],
      revalidate: 3600,
    }
  )();
});

// --- Notes Fetcher ---
export const getCachedNotes = cache(async (workspaceId: string) => {
  return unstable_cache(
    async () => {
      return await db
        .select()
        .from(notes)
        .where(eq(notes.workspaceId, workspaceId))
        .orderBy(desc(notes.updatedAt));
    },
    [CACHE_TAGS.notes(workspaceId)],
    {
      tags: [CACHE_TAGS.notes(workspaceId)],
      revalidate: 3600,
    }
  )();
});

// --- Goals Fetcher ---
export const getCachedGoals = cache(async (workspaceId: string) => {
  try {
    return await unstable_cache(
      async () => {
        return await db
          .select()
          .from(goals)
          .where(and(eq(goals.workspaceId, workspaceId), eq(goals.status, "active")));
      },
      [CACHE_TAGS.goals(workspaceId)],
      {
        tags: [CACHE_TAGS.goals(workspaceId)],
        revalidate: 3600,
      }
    )();
  } catch (error) {
    console.error("[getCachedGoals] DB error:", error instanceof Error ? error.message : error);
    return [];
  }
});

// --- Habits Fetcher ---
export const getCachedHabits = cache(async (userId: string) => {
  try {
    return await unstable_cache(
      async () => {
        return await db
          .select()
          .from(habits)
          .where(and(eq(habits.userId, userId), eq(habits.isArchived, false)))
          .orderBy(desc(habits.createdAt));
      },
      [CACHE_TAGS.habits(userId)],
      {
        tags: [CACHE_TAGS.habits(userId)],
        revalidate: 3600,
      }
    )();
  } catch (error) {
    console.error("[getCachedHabits] DB error:", error instanceof Error ? error.message : error);
    return [];
  }
});

// --- Habit Logs Fetcher (Recent) ---
export const getCachedHabitLogs = cache(async (userId: string) => {
  try {
    return await unstable_cache(
      async () => {
        return await db
          .select()
          .from(habitLogs)
          .where(
              and(
                  eq(habitLogs.userId, userId),
              )
          )
          .orderBy(desc(habitLogs.date));
      },
      [CACHE_TAGS.habitLogs(userId)],
      {
        tags: [CACHE_TAGS.habitLogs(userId)],
        revalidate: 3600,
      }
    )();
  } catch (error) {
    console.error("[getCachedHabitLogs] DB error:", error instanceof Error ? error.message : error);
    return [];
  }
});

// --- Aggregated Dashboard Stats (Expensive Calculation) ---
// This serves as an example of server-side aggregation caching
export const getDashboardStats = cache(async (workspaceId: string) => {
  return unstable_cache(
    async () => {
      const [userTasks, userEvents] = await Promise.all([
        db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId)),
        db.select().from(events).where(eq(events.workspaceId, workspaceId)),
      ]);

      const completedTasks = userTasks.filter((t) => t.status === "Done");
      const pendingTasks = userTasks.filter((t) => t.status === "Todo");

      return {
        totalTasks: userTasks.length,
        completedCount: completedTasks.length,
        pendingCount: pendingTasks.length,
        eventsCount: userEvents.length,
        lastUpdated: new Date().toISOString(),
      };
    },
    [CACHE_TAGS.dashboard(workspaceId)],
    {
      tags: [CACHE_TAGS.tasks(workspaceId), CACHE_TAGS.events(workspaceId), CACHE_TAGS.dashboard(workspaceId)],
      revalidate: 1800, // 30 mins
    }
  )();
});
