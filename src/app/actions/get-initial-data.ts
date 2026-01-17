"use server";

/**
 * Server-side data fetching for initial hydration
 * This avoids the client-side waterfall of fetching data after mount
 */

import { db } from "@/db";
import { tasks, events, notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export interface InitialData {
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    dueDate: string;
    completedAt?: string;
    priority: "P0" | "P1" | "P2" | "P3";
    tags: string[];
    description?: string;
    estimatedMinutes?: number;
    actualMinutes?: number;
    recurrence: { type: "daily" | "weekly" | "monthly"; interval: number } | null;
    columnId?: string;
  }[];
  events: {
    id: string;
    title: string;
    start: string;
    end: string;
    type: "work" | "personal" | "meeting";
    googleId?: string;
  }[];
  notes: {
    id: string;
    title: string;
    preview: string;
    content: string;
    date: string;
    tags: string[];
    type: "meeting" | "personal";
  }[];
}

export async function getInitialData(): Promise<InitialData | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const [tasksData, eventsData, notesData] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.userId, userId)),
      db.select().from(events).where(eq(events.userId, userId)),
      db.select().from(notes).where(eq(notes.userId, userId)),
    ]);

    return {
      tasks: tasksData.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.status === "Done",
        dueDate: t.dueDate ? t.dueDate.toISOString() : new Date().toISOString(),
        completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
        priority: (t.priority as "P0" | "P1" | "P2" | "P3") || "P2",
        tags: t.tags || [],
        description: t.description || undefined,
        estimatedMinutes: t.estimatedMinutes || undefined,
        actualMinutes: t.actualMinutes || undefined,
        recurrence: t.recurrence as { type: "daily" | "weekly" | "monthly"; interval: number } | null,
        columnId: t.status || "Todo",
      })),
      events: eventsData.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.startTime.toISOString(),
        end: e.endTime.toISOString(),
        type: "work" as const,
        googleId: e.googleEventId,
      })),
      notes: notesData.map((n) => ({
        id: n.id,
        title: n.title,
        preview: n.preview || "...",
        content: typeof n.content === "string" ? n.content : JSON.stringify(n.content),
        date: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
        tags: n.tags || [],
        type: (n.type as "meeting" | "personal") || "personal",
      })),
    };
  } catch (error) {
    console.error("[getInitialData] Error fetching initial data:", error);
    return null;
  }
}
