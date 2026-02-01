import { db } from "@/db";
import { tasks, events, notes, goals } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

// --- Tags for Cache Invalidation ---
export const CACHE_TAGS = {
  tasks: (userId: string) => `tasks-${userId}`,
  events: (userId: string) => `events-${userId}`,
  notes: (userId: string) => `notes-${userId}`,
  goals: (userId: string) => `goals-${userId}`,
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
