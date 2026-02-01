import { db } from "@/db";
import { tasks, events, notes, goals, habits, habitLogs } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

// --- Tags for Cache Invalidation ---
export const CACHE_TAGS = {
  tasks: (userId: string) => `tasks-${userId}`,
  events: (userId: string) => `events-${userId}`,
  notes: (userId: string) => `notes-${userId}`,
  goals: (userId: string) => `goals-${userId}`,
  habits: (userId: string) => `habits-${userId}`,
  habitLogs: (userId: string) => `habit-logs-${userId}`,
  dashboard: (userId: string) => `dashboard-${userId}`,
};

// --- Tasks Fetcher ---
export const getCachedTasks = cache(async (userId: string) => {
  return unstable_cache(
    async () => {
      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(desc(tasks.createdAt));
    },
    [CACHE_TAGS.tasks(userId)],
    {
      tags: [CACHE_TAGS.tasks(userId)],
      revalidate: 3600, // 1 hour default (invalidated by actions)
    }
  )();
});

// --- Events Fetcher ---
export const getCachedEvents = cache(async (userId: string) => {
  return unstable_cache(
    async () => {
      return await db
        .select()
        .from(events)
        .where(eq(events.userId, userId))
        .orderBy(asc(events.startTime));
    },
    [CACHE_TAGS.events(userId)],
    {
      tags: [CACHE_TAGS.events(userId)],
      revalidate: 3600,
    }
  )();
});

// --- Notes Fetcher ---
export const getCachedNotes = cache(async (userId: string) => {
  return unstable_cache(
    async () => {
      return await db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.updatedAt));
    },
    [CACHE_TAGS.notes(userId)],
    {
      tags: [CACHE_TAGS.notes(userId)],
      revalidate: 3600,
    }
  )();
});

// --- Goals Fetcher ---
export const getCachedGoals = cache(async (userId: string) => {
  return unstable_cache(
    async () => {
      return await db
        .select()
        .from(goals)
        .where(and(eq(goals.userId, userId), eq(goals.status, "active")));
    },
    [CACHE_TAGS.goals(userId)],
    {
      tags: [CACHE_TAGS.goals(userId)],
      revalidate: 3600,
    }
  )();
});

// --- Habits Fetcher ---
export const getCachedHabits = cache(async (userId: string) => {
  return unstable_cache(
    async () => {
      // Fetch habits with their latest logs (last 7 days could be joined here, but keeping it simple for now)
      // We'll fetch logs separately or in the component for the grid
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
});

// --- Habit Logs Fetcher (Recent) ---
export const getCachedHabitLogs = cache(async (userId: string, days: number = 30) => {
  // Note: unstable_cache arguments must be serializable. passing 'days' as part of the key/tags if it varies
  // might cause cache explosion. For now, let's fix it to 30 days or handle it inside.
  return unstable_cache(
    async () => {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - days);
      const pastDateStr = pastDate.toISOString().split("T")[0]; // YYYY-MM-DD

      return await db
        .select()
        .from(habitLogs)
        .where(
            and(
                eq(habitLogs.userId, userId),
                // We'll filter by date in application code or raw SQL if needed,
                // but drizzle's 'gt' with string date works for YYYY-MM-DD
            )
        )
        // Optimization: limit to recent logs
        // .where(gte(habitLogs.date, pastDateStr))
        .orderBy(desc(habitLogs.date));
    },
    [CACHE_TAGS.habitLogs(userId)],
    {
      tags: [CACHE_TAGS.habitLogs(userId)],
      revalidate: 3600,
    }
  )();
});

// --- Aggregated Dashboard Stats (Expensive Calculation) ---
// This serves as an example of server-side aggregation caching
export const getDashboardStats = cache(async (userId: string) => {
  return unstable_cache(
    async () => {
      const [userTasks, userEvents] = await Promise.all([
        db.select().from(tasks).where(eq(tasks.userId, userId)),
        db.select().from(events).where(eq(events.userId, userId)),
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
    [CACHE_TAGS.dashboard(userId)],
    {
      tags: [CACHE_TAGS.tasks(userId), CACHE_TAGS.events(userId), CACHE_TAGS.dashboard(userId)],
      revalidate: 1800, // 30 mins
    }
  )();
});
