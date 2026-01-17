"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { getTasks, getEvents, getNotes } from "@/app/actions";
import { useAuth } from "@clerk/nextjs";

interface SyncProviderProps {
  children: React.ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { setTasks, setEvents, setNotes } = useStore();
  const hasHydrated = useRef(false);

  // Fetch data client-side when authenticated
  useEffect(() => {
    async function fetchData() {
      if (!isLoaded || !isSignedIn) return;
      if (hasHydrated.current) return;

      try {
        console.log("[SyncProvider] Fetching data client-side...");
        const [tasksResult, eventsResult, notesResult] = await Promise.all([
          getTasks(),
          getEvents(),
          getNotes(),
        ]);

        if (tasksResult.success) {
          setTasks(
            tasksResult.data.map((t) => ({
              id: t.id,
              title: t.title,
              completed: t.status === "Done",
              dueDate: t.dueDate ? t.dueDate.toISOString() : new Date().toISOString(),
              priority: (t.priority as "P0" | "P1" | "P2" | "P3") || "P2",
              tags: t.tags || [],
              recurrence: t.recurrence as {
                type: "daily" | "weekly" | "monthly";
                interval: number;
              } | null,
            }))
          );
        }

        if (eventsResult.success) {
          setEvents(
            eventsResult.data.map((e) => ({
              id: e.id,
              title: e.title,
              start: e.startTime.toISOString(),
              end: e.endTime.toISOString(),
              type: "work" as const,
              googleId: e.googleEventId,
            }))
          );
        }

        if (notesResult.success) {
          setNotes(
            notesResult.data.map((n) => ({
              id: n.id,
              title: n.title,
              preview: "...",
              content: n.content as string,
              date: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
              tags: [],
              type: "personal" as const,
            }))
          );
        }

        hasHydrated.current = true;
        console.log("[SyncProvider] Data sync complete");
      } catch (error) {
        console.error("[SyncProvider] Failed to fetch data:", error);
      }
    }

    fetchData();
  }, [isSignedIn, isLoaded, setTasks, setEvents, setNotes]);

  return <>{children}</>;
}

