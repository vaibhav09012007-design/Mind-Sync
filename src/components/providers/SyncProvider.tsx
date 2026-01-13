"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { getTasks, getEvents, getNotes } from "@/app/actions";
import { useAuth } from "@clerk/nextjs";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { setTasks, setEvents, setNotes } = useStore();

  useEffect(() => {
    async function fetchData() {
        if (!isLoaded || !isSignedIn) return;
        
        try {
            console.log("Fetching initial data from server...");
            const [tasks, events, notes] = await Promise.all([
                getTasks(),
                getEvents(),
                getNotes()
            ]);

            // Transform DB shapes to Store shapes if necessary
            
            setTasks(tasks.map(t => ({
                id: t.id,
                title: t.title,
                completed: t.status === "Done",
                dueDate: t.dueDate ? t.dueDate.toISOString() : new Date().toISOString()
            })));

            setEvents(events.map(e => ({
                id: e.id,
                title: e.title,
                start: e.startTime.toISOString(),
                end: e.endTime.toISOString(),
                type: 'work', // Default
                googleId: e.googleEventId
            })));

            setNotes(notes.map(n => ({
                id: n.id,
                title: n.title, 
                preview: "...",
                content: n.content as string, 
                date: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
                tags: [],
                type: 'personal'
            })));

            console.log("Data sync complete");

        } catch (error) {
            console.error("Failed to fetch initial data", error);
        }
    }

    fetchData();
  }, [isSignedIn, isLoaded, setTasks, setEvents, setNotes]);

  return <>{children}</>;
}
