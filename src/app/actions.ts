"use server";

import { db } from "@/db";
import { tasks, events, notes, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// --- User Sync ---
export async function syncUser() {
  const user = await currentUser();
  if (!user) return null;

  // Check if user exists
  const existingUser = await db.select().from(users).where(eq(users.id, user.id));
  
  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      preferences: { theme: "system" }
    });
  }
  return user.id;
}

// --- Tasks ---

export async function getTasks() {
  const { userId } = await auth();
  if (!userId) return [];
  
  return await db.select().from(tasks).where(eq(tasks.userId, userId));
}

export async function createTask(data: { id: string; title: string; dueDate?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Ensure user exists in DB first
  await syncUser();

  await db.insert(tasks).values({
    id: data.id,
    userId,
    title: data.title,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    status: "Todo",
  });
  
  revalidatePath("/dashboard");
}

export async function toggleTaskStatus(id: string, completed: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.update(tasks)
    .set({ status: completed ? "Done" : "Todo" })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    
  revalidatePath("/dashboard");
}

// --- Events ---

export async function getEvents() {
    const { userId } = await auth();
    if (!userId) return [];
    
    return await db.select().from(events).where(eq(events.userId, userId));
}
  
export async function createEvent(data: { id: string; title: string; start: string; end: string; type: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await syncUser();

  await db.insert(events).values({
    id: data.id,
    userId,
    title: data.title,
    startTime: new Date(data.start),
    endTime: new Date(data.end),
    googleEventId: "local-" + data.id, // Placeholder until real Google Sync
  });
  
  revalidatePath("/calendar");
}

export async function deleteEvent(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  
    await db.delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
      
    revalidatePath("/calendar");
}

// --- Notes ---

export async function getNotes() {
    const { userId } = await auth();
    if (!userId) return [];
    
    return await db.select().from(notes).where(eq(notes.userId, userId));
}

export async function createNote(data: { id: string; title: string; content: string; date: string }) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  
    await syncUser();
  
    await db.insert(notes).values({
      id: data.id,
      userId,
      title: data.title,
      content: JSON.stringify(data.content), // Storing HTML string as JSONB for now or plain text
      // Note: schema has content as jsonb, but we are passing string. 
      // Ideally we should match tiptap json. For now, let's wrap it.
      createdAt: new Date(data.date),
    });
    
    revalidatePath("/notes");
}

export async function deleteNote(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  
    await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
      
    revalidatePath("/notes");
}

// --- Calendar Sync ---

export async function syncGoogleCalendar() {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get the OAuth Access Token from Clerk
  const token = await getToken({ template: "oauth_google" }); 
  
  if (!token) {
      console.error("No Google OAuth token found. Ensure you have connected Google Account in Clerk.");
      return { success: false, error: "No Google Token" };
  }

  try {
      // 1. Fetch from Google
      const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=20&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
      );

      if (!response.ok) {
          const err = await response.text();
          console.error("Google API Error:", err);
          throw new Error("Failed to fetch from Google");
      }

      const data = await response.json();
      const googleEvents = data.items || [];

      // 2. Save to DB
      await syncUser();

      for (const gEvent of googleEvents) {
          if (!gEvent.start || !gEvent.end) continue;

          const start = gEvent.start.dateTime || gEvent.start.date;
          const end = gEvent.end.dateTime || gEvent.end.date;

          // Check for duplicate
          const existing = await db.select().from(events).where(
              and(eq(events.userId, userId), eq(events.googleEventId, gEvent.id))
          );

          if (existing.length === 0) {
              await db.insert(events).values({
                  userId,
                  googleEventId: gEvent.id,
                  title: gEvent.summary || "(No Title)",
                  startTime: new Date(start),
                  endTime: new Date(end),
                  meetingUrl: gEvent.hangoutLink || gEvent.htmlLink,
              });
          }
      }

      revalidatePath("/calendar");
      revalidatePath("/dashboard");
      return { success: true, count: googleEvents.length };

  } catch (error) {
      console.error("Sync Error:", error);
      return { success: false, error: "Sync failed" };
  }
}
