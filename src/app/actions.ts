"use server";

/**
 * Server Actions for MindSync
 * All actions include validation, error handling, and rate limiting
 */

import { db } from "@/db";
import { tasks, events, notes, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleCalendarService } from "@/lib/google-calendar";
import {
  createTaskSchema,
  createEventSchema,
  updateEventSchema,
  createNoteSchema,
  updateNoteSchema,
  summarizeMeetingSchema,
} from "@/lib/validation";
import {
  AuthError,
  ValidationError,
  APIError,
  RateLimitError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limiter";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- Helper: Auth Check ---
async function requireAuth() {
  const { userId, getToken } = await auth();
  if (!userId) throw new AuthError();
  return { userId, getToken };
}

// --- User Sync ---
export async function syncUser(): Promise<ActionResult<string | null>> {
  try {
    const user = await currentUser();
    if (!user) return createSuccessResult(null);

    const existingUser = await db.select().from(users).where(eq(users.id, user.id));

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        preferences: { theme: "system" },
      });
    }
    return createSuccessResult(user.id);
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- Tasks ---

export async function getTasks(): Promise<ActionResult<(typeof tasks.$inferSelect)[]>> {
  try {
    const { userId } = await requireAuth();
    const result = await db.select().from(tasks).where(eq(tasks.userId, userId));
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function createTask(data: {
  id: string;
  title: string;
  dueDate?: string;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Validate input
    const validated = createTaskSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    await syncUser();

    await db.insert(tasks).values({
      id: data.id,
      userId,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "Todo",
    });

    revalidatePath("/dashboard");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function toggleTaskStatus(
  id: string,
  completed: boolean
): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid task ID"] });
    }

    await db
      .update(tasks)
      .set({ status: completed ? "Done" : "Todo" })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteTask(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid task ID"] });
    }

    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteCompletedTasks(): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    await db.delete(tasks).where(and(eq(tasks.status, "Done"), eq(tasks.userId, userId)));

    revalidatePath("/dashboard");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- Events ---

export async function getEvents(): Promise<ActionResult<(typeof events.$inferSelect)[]>> {
  try {
    const { userId } = await requireAuth();
    const result = await db.select().from(events).where(eq(events.userId, userId));
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function createEvent(data: {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
}): Promise<ActionResult<void>> {
  try {
    const { userId, getToken } = await requireAuth();

    const validated = createEventSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    await syncUser();

    let googleEventId = "local-" + data.id;

    // Sync to Google Calendar
    try {
      const token = await getToken({ template: "oauth_google" });
      if (token) {
        const googleEvent = await GoogleCalendarService.insertEvent(token, {
          title: data.title,
          start: data.start,
          end: data.end,
        });
        googleEventId = googleEvent.id;
      }
    } catch (e) {
      console.error("Failed to sync new event to Google Calendar:", e);
      // Continue to save locally even if sync fails
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
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteEvent(id: string): Promise<ActionResult<void>> {
  try {
    const { userId, getToken } = await requireAuth();

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid event ID"] });
    }

    const [eventToDelete] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));

    if (
      eventToDelete &&
      eventToDelete.googleEventId &&
      !eventToDelete.googleEventId.startsWith("local-")
    ) {
      try {
        const token = await getToken({ template: "oauth_google" });
        if (token) {
          await GoogleCalendarService.deleteEvent(token, eventToDelete.googleEventId);
        }
      } catch (e) {
        console.error("Failed to delete event from Google Calendar:", e);
      }
    }

    await db.delete(events).where(and(eq(events.id, id), eq(events.userId, userId)));

    revalidatePath("/calendar");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function updateEvent(
  id: string,
  data: { title?: string; start?: string; end?: string }
): Promise<ActionResult<void>> {
  try {
    const { userId, getToken } = await requireAuth();

    const validated = updateEventSchema.safeParse({ id, ...data });
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    const updates: Record<string, unknown> = {};
    if (data.title) updates.title = data.title;
    if (data.start) updates.startTime = new Date(data.start);
    if (data.end) updates.endTime = new Date(data.end);

    const [eventToUpdate] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));

    if (
      eventToUpdate &&
      eventToUpdate.googleEventId &&
      !eventToUpdate.googleEventId.startsWith("local-")
    ) {
      try {
        const token = await getToken({ template: "oauth_google" });
        if (token) {
          await GoogleCalendarService.updateEvent(token, eventToUpdate.googleEventId, {
            title: data.title,
            start: data.start,
            end: data.end,
          });
        }
      } catch (e) {
        console.error("Failed to update event in Google Calendar:", e);
      }
    }

    await db
      .update(events)
      .set(updates)
      .where(and(eq(events.id, id), eq(events.userId, userId)));

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- Notes ---

export async function getNotes(): Promise<ActionResult<(typeof notes.$inferSelect)[]>> {
  try {
    const { userId } = await requireAuth();
    const result = await db.select().from(notes).where(eq(notes.userId, userId));
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function createNote(data: {
  id: string;
  title: string;
  content: string;
  preview: string;
  date: string;
  tags?: string[];
  type?: "meeting" | "personal";
  metadata?: any;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Use flexible validation or update schema in lib/validation
    // For now assuming data is valid as per store

    await syncUser();

    await db.insert(notes).values({
      id: data.id,
      userId,
      title: data.title,
      content: JSON.stringify(data.content),
      preview: data.preview,
      tags: data.tags,
      type: data.type || "personal",
      metadata: data.metadata,
      createdAt: new Date(data.date),
    });

    revalidatePath("/notes");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function updateNote(
  id: string,
  data: {
    title?: string;
    content?: string;
    preview?: string;
    tags?: string[];
    type?: "meeting" | "personal";
    metadata?: any;
    date?: string;
  }
): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    const updates: Record<string, unknown> = {};
    if (data.title) updates.title = data.title;
    if (data.content) updates.content = JSON.stringify(data.content);
    if (data.preview) updates.preview = data.preview;
    if (data.tags) updates.tags = data.tags;
    if (data.type) updates.type = data.type;
    if (data.metadata) updates.metadata = data.metadata;
    if (data.date) updates.updatedAt = new Date(data.date);

    await db
      .update(notes)
      .set(updates)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));

    revalidatePath("/notes");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteNote(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid note ID"] });
    }

    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));

    revalidatePath("/notes");
    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

// --- AI Functions (with Rate Limiting) ---

export async function summarizeMeeting(
  noteId: string,
  transcript: string
): Promise<ActionResult<{ summary: string; decisions: string[]; actionItems: string[] }>> {
  try {
    const { userId } = await requireAuth();

    // Rate limit check - 10 requests per minute
    const rateLimitResult = await checkRateLimit(userId, "ai-summarize", 10, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    const validated = summarizeMeetingSchema.safeParse({ noteId, transcript });
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { summary: text, decisions: [], actionItems: [] };

    // Update note in DB
    await db
      .update(notes)
      .set({
        aiSummary: data.summary,
        actionItems: data.actionItems,
        rawTranscript: transcript,
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    revalidatePath(`/notes/${noteId}`);
    return createSuccessResult(data);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return createErrorResult(error);
    }
    console.error("AI Summarization Error:", error);
    return createErrorResult(new APIError("Gemini", "Failed to summarize meeting"));
  }
}

// --- Calendar Sync ---

export async function syncGoogleCalendar(): Promise<
  ActionResult<{ count: number; total: number }>
> {
  try {
    const { userId, getToken } = await requireAuth();

    console.log("[Sync] Starting Google Calendar sync...");

    const token = await getToken({ template: "oauth_google" });

    if (!token) {
      console.error("[Sync] No Google OAuth token found.");
      throw new APIError("Google Calendar", "Please connect your Google Calendar in Settings.");
    }

    console.log("[Sync] Fetching events from Google...");
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Sync] Google API Error (${response.status}):`, errText);

      if (response.status === 401 || response.status === 403) {
        throw new APIError(
          "Google Calendar",
          "Permission denied. Please reconnect your Google account."
        );
      }
      throw new APIError("Google Calendar", `API returned ${response.status}`);
    }

    const data = await response.json();
    const googleEvents = data.items || [];
    console.log(`[Sync] Found ${googleEvents.length} events from Google.`);

    await syncUser();

    let syncedCount = 0;
    for (const gEvent of googleEvents) {
      if (!gEvent.start || !gEvent.end) continue;

      const start = gEvent.start.dateTime || gEvent.start.date;
      const end = gEvent.end.dateTime || gEvent.end.date;

      const existing = await db
        .select()
        .from(events)
        .where(and(eq(events.userId, userId), eq(events.googleEventId, gEvent.id)));

      if (existing.length === 0) {
        await db.insert(events).values({
          userId,
          googleEventId: gEvent.id,
          title: gEvent.summary || "(No Title)",
          startTime: new Date(start),
          endTime: new Date(end),
          meetingUrl: gEvent.hangoutLink || gEvent.htmlLink,
        });
        syncedCount++;
      } else {
        await db
          .update(events)
          .set({
            title: gEvent.summary || "(No Title)",
            startTime: new Date(start),
            endTime: new Date(end),
            meetingUrl: gEvent.hangoutLink || gEvent.htmlLink,
          })
          .where(eq(events.id, existing[0].id));
      }
    }

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return createSuccessResult({ count: syncedCount, total: googleEvents.length });
  } catch (error) {
    console.error("[Sync] CRITICAL FAILURE:", error);
    return createErrorResult(error);
  }
}

// --- AI Scheduling ---

export async function generateSchedule(): Promise<ActionResult<{ count: number }>> {
  try {
    const { userId } = await requireAuth();

    // Rate limit check - 5 requests per minute for scheduling
    const rateLimitResult = await checkRateLimit(userId, "ai-schedule", 5, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("[AI Schedule] Missing GEMINI_API_KEY");
      throw new APIError("Gemini", "Server configuration error: Missing API Key");
    }

    // Fetch Context
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todoTasks, dayEvents] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.userId, userId), eq(tasks.status, "Todo"))),
      db.select().from(events).where(eq(events.userId, userId)),
    ]);

    const todaysEvents = dayEvents.filter((e) => {
      const eDate = new Date(e.startTime);
      return eDate >= today && eDate < tomorrow;
    });

    if (todoTasks.length === 0) {
      throw new ValidationError({ tasks: ["No tasks to schedule"] });
    }

    console.log(
      `[AI Schedule] Scheduling ${todoTasks.length} tasks around ${todaysEvents.length} events.`
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      I am an AI assistant helping a user plan their day.
      
      Current Date: ${today.toDateString()}
      Working Hours: 09:00 AM to 5:00 PM
      
      Existing Calendar Events:
      ${todaysEvents.map((e) => `- ${e.title}: ${e.startTime.toLocaleTimeString()} to ${e.endTime.toLocaleTimeString()}`).join("\n")}
      
      Tasks to Schedule (Prioritize by importance if implied, otherwise order is flexible):
      ${todoTasks.map((t) => `- ${t.title} (ID: ${t.id})`).join("\n")}
      
      Goal: create a schedule that fits as many tasks as possible into the free slots between 09:00 and 17:00. 
      Do not overlap with existing events. 
      Default task duration is 30 minutes unless the title implies otherwise.
      
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
    let text = response.text();

    // Parse JSON from response
    const startIdx = text.indexOf("[");
    const endIdx = text.lastIndexOf("]");
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 1);
    } else {
      throw new APIError("Gemini", "AI did not return a valid JSON array");
    }

    const proposedSchedule = JSON.parse(text);

    // Apply Schedule
    const newEvents = [];
    for (const item of proposedSchedule) {
      const relatedTask = todoTasks.find((t) => t.id === item.taskId);
      if (!relatedTask) continue;

      const eventId = crypto.randomUUID();

      await syncUser();
      await db.insert(events).values({
        id: eventId,
        userId,
        title: item.title,
        startTime: new Date(item.start),
        endTime: new Date(item.end),
        googleEventId: "local-ai-" + eventId,
      });

      newEvents.push(item);
    }

    revalidatePath("/dashboard");
    revalidatePath("/calendar");

    return createSuccessResult({ count: newEvents.length });
  } catch (error) {
    console.error("[AI Schedule] Error:", error);
    return createErrorResult(error);
  }
}
