/**
 * AI-powered smart suggestions for MindSync
 * Analyzes calendar events and suggests tasks
 */

"use server";

import { db } from "@/db";
import { tasks, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit } from "@/lib/rate-limiter";
import { RateLimitError, APIError, ActionResult, createSuccessResult, createErrorResult } from "@/lib/errors";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface TaskSuggestion {
  title: string;
  dueDate: string;
  priority: "P0" | "P1" | "P2" | "P3";
  reason: string;
}

/**
 * Analyze calendar events and suggest tasks for preparation
 */
export async function suggestTasksFromCalendar(): Promise<ActionResult<TaskSuggestion[]>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Rate limit: 5 requests per minute
    const rateLimitResult = await checkRateLimit(userId, "ai-suggest", 5, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    // Get upcoming events for the next 3 days
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const upcomingEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    const filteredEvents = upcomingEvents.filter((e) => {
      const eventDate = new Date(e.startTime);
      return eventDate >= now && eventDate <= threeDaysLater;
    });

    if (filteredEvents.length === 0) {
      return createSuccessResult([]);
    }

    // Get existing tasks to avoid duplicates
    const existingTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an AI assistant helping a user prepare for their upcoming meetings and events.

      Upcoming Events (next 3 days):
      ${filteredEvents.map((e) => `- "${e.title}" on ${new Date(e.startTime).toLocaleString()}`).join("\n")}

      Existing Tasks (to avoid duplicates):
      ${existingTasks.map((t) => `- ${t.title}`).join("\n")}

      Suggest 2-5 preparation tasks for these events. Consider:
      - Meeting prep (review notes, prepare agenda)
      - Research needed
      - Documents to prepare
      - People to contact beforehand

      Return ONLY a JSON array. No markdown.
      Format:
      [
        {
          "title": "Clear, actionable task title",
          "dueDate": "ISO 8601 date string (before the event)",
          "priority": "P0|P1|P2|P3",
          "reason": "Brief explanation of why this is needed"
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Parse JSON
    const startIdx = text.indexOf("[");
    const endIdx = text.lastIndexOf("]");
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 1);
    } else {
      throw new APIError("Gemini", "Invalid response format");
    }

    const suggestions: TaskSuggestion[] = JSON.parse(text);
    return createSuccessResult(suggestions);
  } catch (error) {
    console.error("[AI Suggest] Error:", error);
    return createErrorResult(error);
  }
}

/**
 * Auto-prioritize tasks based on due dates and context
 */
export async function autoPrioritizeTasks(): Promise<ActionResult<{ updated: number }>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rateLimitResult = await checkRateLimit(userId, "ai-prioritize", 3, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "Todo")));

    if (userTasks.length === 0) {
      return createSuccessResult({ updated: 0 });
    }

    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an AI assistant helping prioritize tasks.

      Tasks to prioritize:
      ${userTasks.map((t) => `- ID: ${t.id}, Title: "${t.title}", Due: ${t.dueDate?.toISOString() || "no due date"}`).join("\n")}

      Upcoming Events (for context):
      ${userEvents.slice(0, 10).map((e) => `- "${e.title}" on ${new Date(e.startTime).toLocaleString()}`).join("\n")}

      Assign priorities based on:
      - Urgency (due date proximity)
      - Importance (related to meetings, deadlines)
      - Dependencies

      Return ONLY a JSON object mapping task IDs to priorities.
      Example: {"uuid-1": "P0", "uuid-2": "P2"}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Parse JSON
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 1);
    } else {
      throw new APIError("Gemini", "Invalid response format");
    }

    const priorities: Record<string, string> = JSON.parse(text);

    // Update tasks in DB
    let updated = 0;
    for (const [taskId, priority] of Object.entries(priorities)) {
      if (["P0", "P1", "P2", "P3"].includes(priority)) {
        await db
          .update(tasks)
          .set({ priority: priority as "P0" | "P1" | "P2" | "P3" })
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
        updated++;
      }
    }

    revalidatePath("/dashboard");
    return createSuccessResult({ updated });
  } catch (error) {
    console.error("[AI Prioritize] Error:", error);
    return createErrorResult(error);
  }
}

/**
 * Generate a meeting prep summary from past notes
 */
export async function generateMeetingPrep(
  eventId: string
): Promise<ActionResult<{ summary: string; keyPoints: string[] }>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rateLimitResult = await checkRateLimit(userId, "ai-prep", 5, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    // Get the event
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.userId, userId)));

    if (!event) {
      throw new Error("Event not found");
    }

    // Get related notes (by title similarity or linked)
    const { notes } = await import("@/db/schema");
    const allNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId));

    // Simple title matching for related notes
    const keywords = event.title.toLowerCase().split(" ");
    const relatedNotes = allNotes.filter((n) =>
      keywords.some(
        (k) =>
          k.length > 3 &&
          (n.title?.toLowerCase().includes(k) || n.aiSummary?.toLowerCase().includes(k))
      )
    );

    if (relatedNotes.length === 0) {
      return createSuccessResult({
        summary: "No previous notes found for this meeting topic.",
        keyPoints: [],
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are preparing someone for a meeting: "${event.title}"

      Previous related notes and summaries:
      ${relatedNotes.map((n) => `## ${n.title}\n${n.aiSummary || "No summary available"}`).join("\n\n")}

      Create a brief prep summary:
      1. What was discussed before
      2. Key decisions made
      3. Open action items
      4. Suggested topics to follow up on

      Return JSON:
      {
        "summary": "2-3 sentence overview",
        "keyPoints": ["point 1", "point 2", ...]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 1);
    }

    const prep = JSON.parse(text);
    return createSuccessResult(prep);
  } catch (error) {
    console.error("[AI Prep] Error:", error);
    return createErrorResult(error);
  }
}
