"use server";

import { db } from "@/db";
import { tasks, events, notes, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); 

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

export async function deleteCompletedTasks() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(tasks)
    .where(and(eq(tasks.status, "Done"), eq(tasks.userId, userId)));
    
  revalidatePath("/dashboard");
}

import { GoogleCalendarService } from "@/lib/google-calendar";

// --- Events ---

export async function getEvents() {
    const { userId } = await auth();
    if (!userId) return [];
    
    return await db.select().from(events).where(eq(events.userId, userId));
}
  
export async function createEvent(data: { id: string; title: string; start: string; end: string; type: string }) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await syncUser();

  let googleEventId = "local-" + data.id;

  // Sync to Google Calendar
  try {
      const token = await getToken({ template: "oauth_google" });
      if (token) {
          const googleEvent = await GoogleCalendarService.insertEvent(token, {
              title: data.title,
              start: data.start,
              end: data.end
          });
          googleEventId = googleEvent.id;
      }
  } catch (e) {
      console.error("Failed to sync new event to Google Calendar", e);
      // We continue to save locally even if sync fails
  }

  await db.insert(events).values({
    id: data.id,
    userId,
    title: data.title,
    startTime: new Date(data.start),
    endTime: new Date(data.end),
    googleEventId: googleEventId, 
  });
  
  revalidatePath("/calendar");
}

export async function deleteEvent(id: string) {
    const { userId, getToken } = await auth();
    if (!userId) throw new Error("Unauthorized");
  
    // Get event to find Google ID
    const [eventToDelete] = await db.select().from(events).where(and(eq(events.id, id), eq(events.userId, userId)));

    if (eventToDelete && eventToDelete.googleEventId && !eventToDelete.googleEventId.startsWith("local-")) {
        try {
            const token = await getToken({ template: "oauth_google" });
            if (token) {
                await GoogleCalendarService.deleteEvent(token, eventToDelete.googleEventId);
            }
        } catch (e) {
            console.error("Failed to delete event from Google Calendar", e);
        }
    }

    await db.delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
      
    revalidatePath("/calendar");
}

export async function updateEvent(id: string, data: { title?: string; start?: string; end?: string }) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const updates: any = {};
  if (data.title) updates.title = data.title;
  if (data.start) updates.startTime = new Date(data.start);
  if (data.end) updates.endTime = new Date(data.end);

  // Sync to Google Calendar
  const [eventToUpdate] = await db.select().from(events).where(and(eq(events.id, id), eq(events.userId, userId)));
  
  if (eventToUpdate && eventToUpdate.googleEventId && !eventToUpdate.googleEventId.startsWith("local-")) {
      try {
          const token = await getToken({ template: "oauth_google" });
          if (token) {
              await GoogleCalendarService.updateEvent(token, eventToUpdate.googleEventId, {
                  title: data.title,
                  start: data.start,
                  end: data.end
              });
          }
      } catch (e) {
          console.error("Failed to update event in Google Calendar", e);
      }
  }

  await db.update(events)
    .set(updates)
    .where(and(eq(events.id, id), eq(events.userId, userId)));
    
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
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
      content: JSON.stringify(data.content), 
      createdAt: new Date(data.date),
    });
    
    revalidatePath("/notes");
}

export async function updateNote(id: string, data: { title?: string; content?: string; preview?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const updates: any = {};
  if (data.title) updates.title = data.title;
  if (data.content) updates.content = JSON.stringify(data.content);

  await db.update(notes)
    .set(updates)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
    
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  
    await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
      
    revalidatePath("/notes");
}

export async function summarizeMeeting(noteId: string, transcript: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are an expert meeting assistant. Below is a meeting transcript.
      Please provide:
      1. A concise summary of the meeting.
      2. A list of key decisions made.
      3. A list of actionable items with owners if mentioned.

      Format the output as a clean JSON object with keys: "summary", "decisions", and "actionItems" (array of strings).

      Transcript:
      ${transcript}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, decisions: [], actionItems: [] };

    // Update note in DB
    await db.update(notes)
      .set({
        aiSummary: data.summary,
        actionItems: data.actionItems,
        rawTranscript: transcript
      })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));

    revalidatePath(`\/notes\/${noteId}`);
    return { success: true, data };
  } catch (error) {
    console.error("AI Summarization Error:", error);
    return { success: false, error: "Failed to summarize meeting" };
  }
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
      
      // --- AI Scheduling ---
      
      export async function generateSchedule() {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
      
        try {
          // 1. Fetch Context
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
      
          const [todoTasks, dayEvents] = await Promise.all([
            db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "Todo"))),
            db.select().from(events).where(and(
              eq(events.userId, userId),
              // Simple day filter (in real app use date-fns startOfDay/endOfDay)
            ))
          ]);
      
          // Filter events for today in JS to save DB complexity for prototype
          const todaysEvents = dayEvents.filter(e => {
              const eDate = new Date(e.startTime);
              return eDate >= today && eDate < tomorrow;
          });
      
          if (todoTasks.length === 0) return { success: false, error: "No tasks to schedule" };
      
          // 2. Prompt Gemini
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          
          const prompt = `
            I am an AI assistant helping a user plan their day.
            
            Current Date: ${today.toDateString()}
            Working Hours: 09:00 AM to 5:00 PM
            
            Existing Calendar Events:
            ${todaysEvents.map(e => `- ${e.title}: ${e.startTime.toLocaleTimeString()} to ${e.endTime.toLocaleTimeString()}`).join('\n')}
            
            Tasks to Schedule (Prioritize by importance if implied, otherwise order is flexible):
            ${todoTasks.map(t => `- ${t.title} (ID: ${t.id})`).join('\n')}
            
            Goal: create a schedule that fits as many tasks as possible into the free slots between 09:00 and 17:00. 
            Do not overlap with existing events. 
            Default task duration is 30 minutes unless the title implies otherwise (e.g., "Quick call" = 15m, "Deep work" = 60m).
            
            Return STRICTLY a JSON array of objects. No markdown formatting.
            Format:
            [
              {
                "taskId": "UUID",
                "title": "Task Title",
                "start": "ISO 8601 String",
                "end": "ISO 8601 String"
              }
            ]
          `;
      
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text().replace(/```json|```/g, '').trim(); // Clean cleanup
          
          const proposedSchedule = JSON.parse(text);
      
          // 3. Apply Schedule (Create Events)
          const newEvents = [];
          for (const item of proposedSchedule) {
              // Double check taskId validity
              const relatedTask = todoTasks.find(t => t.id === item.taskId);
              if (!relatedTask) continue;
      
              // Create the event
              const eventId = crypto.randomUUID();
              
              // Sync User & Insert
              await syncUser();
              await db.insert(events).values({
                  id: eventId,
                  userId,
                  title: item.title,
                  startTime: new Date(item.start),
                  endTime: new Date(item.end),
                  googleEventId: "local-ai-" + eventId
              });
      
              newEvents.push(item);
          }
      
          revalidatePath("/dashboard");
          revalidatePath("/calendar");
          
          return { success: true, count: newEvents.length };
      
        } catch (error) {
          console.error("AI Schedule Error:", error);
          return { success: false, error: "Failed to generate schedule" };
        }
      }
      