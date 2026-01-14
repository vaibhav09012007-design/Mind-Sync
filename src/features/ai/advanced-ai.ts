/**
 * Advanced AI features for MindSync
 * Includes sentiment analysis, productivity insights, and smart reminders
 */

"use server";

import { db } from "@/db";
import { tasks, events, notes } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  RateLimitError,
  APIError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types
export interface SentimentResult {
  overall: "positive" | "neutral" | "negative";
  score: number; // -1 to 1
  highlights: { text: string; sentiment: string }[];
  summary: string;
}

export interface ProductivityInsight {
  category: string;
  metric: string;
  value: number;
  trend: "up" | "down" | "stable";
  suggestion: string;
}

export interface SmartReminder {
  taskId: string;
  taskTitle: string;
  reminderType: "deadline" | "followup" | "preparation" | "recurring";
  message: string;
  urgency: "low" | "medium" | "high";
  suggestedTime: string;
}

export interface TaskInsight {
  taskId: string;
  suggestions: string[];
  similarTasks: { title: string; wasCompleted: boolean }[];
  estimatedDuration: number;
  optimalTime: string;
}

/**
 * Analyze sentiment of meeting transcript or notes
 */
export async function analyzeSentiment(
  text: string,
  noteId?: string
): Promise<ActionResult<SentimentResult>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Rate limit: 10 requests per minute
    const rateLimitResult = await checkRateLimit(userId, "ai-sentiment", 10, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    if (!text || text.trim().length < 50) {
      return createSuccessResult({
        overall: "neutral",
        score: 0,
        highlights: [],
        summary: "Text too short for meaningful analysis",
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze the sentiment of this meeting transcript or note.
      
      Text:
      "${text.substring(0, 3000)}"

      Provide a sentiment analysis with:
      1. Overall sentiment (positive/neutral/negative)
      2. Score from -1 (very negative) to 1 (very positive)
      3. Key highlights with their sentiment
      4. Brief summary of the conversation tone

      Return ONLY valid JSON:
      {
        "overall": "positive|neutral|negative",
        "score": 0.5,
        "highlights": [
          {"text": "excerpt from text", "sentiment": "positive|neutral|negative"}
        ],
        "summary": "The conversation was generally constructive..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Parse JSON
    const startIdx = responseText.indexOf("{");
    const endIdx = responseText.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) {
      throw new APIError("Gemini", "Invalid response format");
    }
    responseText = responseText.substring(startIdx, endIdx + 1);

    const sentimentResult: SentimentResult = JSON.parse(responseText);

    // Update note with sentiment if noteId provided
    if (noteId) {
      await db
        .update(notes)
        .set({ sentiment: sentimentResult.overall })
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
    }

    return createSuccessResult(sentimentResult);
  } catch (error) {
    console.error("[AI Sentiment] Error:", error);
    return createErrorResult(error);
  }
}

/**
 * Generate productivity insights based on task completion patterns
 */
export async function getProductivityInsights(): Promise<
  ActionResult<ProductivityInsight[]>
> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rateLimitResult = await checkRateLimit(userId, "ai-insights", 5, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    // Calculate metrics
    const completedTasks = userTasks.filter((t) => t.status === "Done");
    const pendingTasks = userTasks.filter((t) => t.status === "Todo");
    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date()
    );

    const completionRate =
      userTasks.length > 0
        ? Math.round((completedTasks.length / userTasks.length) * 100)
        : 0;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze this user's productivity data and provide insights.

      Task Statistics:
      - Total tasks: ${userTasks.length}
      - Completed: ${completedTasks.length}
      - Pending: ${pendingTasks.length}
      - Overdue: ${overdueTasks.length}
      - Completion rate: ${completionRate}%

      Recent task titles: ${userTasks
        .slice(-10)
        .map((t) => t.title)
        .join(", ")}
      
      Upcoming events: ${userEvents.slice(0, 5).map((e) => e.title).join(", ")}

      Generate 3-5 actionable productivity insights. Each should have:
      - Category (time_management, focus, planning, collaboration)
      - Specific metric mentioned
      - Trend (up/down/stable based on patterns)
      - Actionable suggestion

      Return ONLY valid JSON array:
      [
        {
          "category": "time_management",
          "metric": "Task completion rate",
          "value": 75,
          "trend": "up",
          "suggestion": "Specific actionable advice..."
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    const startIdx = responseText.indexOf("[");
    const endIdx = responseText.lastIndexOf("]");
    if (startIdx === -1 || endIdx === -1) {
      throw new APIError("Gemini", "Invalid response format");
    }
    responseText = responseText.substring(startIdx, endIdx + 1);

    const insights: ProductivityInsight[] = JSON.parse(responseText);
    return createSuccessResult(insights);
  } catch (error) {
    console.error("[AI Insights] Error:", error);
    return createErrorResult(error);
  }
}

/**
 * Generate smart reminders based on task patterns and deadlines
 */
export async function generateSmartReminders(): Promise<
  ActionResult<SmartReminder[]>
> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rateLimitResult = await checkRateLimit(userId, "ai-reminders", 5, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    // Get pending tasks
    const userTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "Todo")));

    // Get upcoming events
    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    const upcomingEvents = userEvents.filter((e) => {
      const eventDate = new Date(e.startTime);
      return eventDate >= now && eventDate <= threeDaysLater;
    });

    if (userTasks.length === 0 && upcomingEvents.length === 0) {
      return createSuccessResult([]);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Generate smart reminders for this user based on their tasks and events.
      Current time: ${now.toISOString()}

      Pending Tasks:
      ${userTasks.map((t) => `- ID: ${t.id}, Title: "${t.title}", Due: ${t.dueDate?.toISOString() || "no date"}, Priority: ${t.priority || "P2"}`).join("\n")}

      Upcoming Events (next 3 days):
      ${upcomingEvents.map((e) => `- "${e.title}" at ${new Date(e.startTime).toLocaleString()}`).join("\n")}

      Generate helpful reminders considering:
      1. Deadline warnings (tasks due within 24-48 hours)
      2. Meeting preparation (1-2 hours before meetings)
      3. Follow-ups needed
      4. Recurring task patterns

      Return ONLY valid JSON array:
      [
        {
          "taskId": "uuid or empty string",
          "taskTitle": "Task name",
          "reminderType": "deadline|followup|preparation|recurring",
          "message": "Helpful reminder message",
          "urgency": "low|medium|high",
          "suggestedTime": "ISO 8601 datetime for reminder"
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    const startIdx = responseText.indexOf("[");
    const endIdx = responseText.lastIndexOf("]");
    if (startIdx === -1 || endIdx === -1) {
      return createSuccessResult([]);
    }
    responseText = responseText.substring(startIdx, endIdx + 1);

    const reminders: SmartReminder[] = JSON.parse(responseText);
    return createSuccessResult(reminders);
  } catch (error) {
    console.error("[AI Reminders] Error:", error);
    return createErrorResult(error);
  }
}

/**
 * Get AI-powered insights for a specific task
 */
export async function getTaskInsights(
  taskId: string
): Promise<ActionResult<TaskInsight>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rateLimitResult = await checkRateLimit(userId, "ai-task-insight", 10, 60);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    // Get the target task
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    if (!task) {
      throw new Error("Task not found");
    }

    // Get similar historical tasks for context
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze this task and provide helpful insights.

      Target Task: "${task.title}"
      Due: ${task.dueDate?.toISOString() || "no due date"}
      Priority: ${task.priority || "P2"}
      Status: ${task.status}

      User's historical tasks (for pattern matching):
      ${allTasks
        .slice(-20)
        .map((t) => `- "${t.title}" (${t.status})`)
        .join("\n")}

      Provide:
      1. Suggestions to complete this task effectively (2-3 tips)
      2. Similar past tasks (by title/type) and their completion status
      3. Estimated duration in minutes based on task type
      4. Best time of day to work on this type of task

      Return ONLY valid JSON:
      {
        "taskId": "${taskId}",
        "suggestions": ["tip 1", "tip 2"],
        "similarTasks": [{"title": "...", "wasCompleted": true}],
        "estimatedDuration": 30,
        "optimalTime": "morning|afternoon|evening"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    const startIdx = responseText.indexOf("{");
    const endIdx = responseText.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) {
      throw new APIError("Gemini", "Invalid response format");
    }
    responseText = responseText.substring(startIdx, endIdx + 1);

    const insight: TaskInsight = JSON.parse(responseText);
    return createSuccessResult(insight);
  } catch (error) {
    console.error("[AI Task Insight] Error:", error);
    return createErrorResult(error);
  }
}

/**
 * Generate a weekly productivity report
 */
export async function generateWeeklyReport(): Promise<
  ActionResult<{
    summary: string;
    completedCount: number;
    meetingsAttended: number;
    topAchievements: string[];
    areasForImprovement: string[];
    nextWeekSuggestions: string[];
  }>
> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rateLimitResult = await checkRateLimit(userId, "ai-report", 2, 3600);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.retryAfter);
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const recentTasks = userTasks.filter(
      (t) => t.createdAt && new Date(t.createdAt) >= oneWeekAgo
    );

    const completedThisWeek = recentTasks.filter(
      (t) => t.status === "Done"
    );

    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    const eventsThisWeek = userEvents.filter(
      (e) => new Date(e.startTime) >= oneWeekAgo
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Generate a weekly productivity report for this user.

      This Week's Statistics:
      - Tasks created: ${recentTasks.length}
      - Tasks completed: ${completedThisWeek.length}
      - Meetings attended: ${eventsThisWeek.length}

      Completed tasks: ${completedThisWeek.map((t) => t.title).join(", ")}
      Meetings: ${eventsThisWeek.map((e) => e.title).join(", ")}

      Generate an encouraging but honest productivity report with:
      1. Brief summary (2-3 sentences)
      2. Top 3 achievements
      3. 2-3 areas for improvement
      4. 3 suggestions for next week

      Return ONLY valid JSON:
      {
        "summary": "This week you...",
        "completedCount": ${completedThisWeek.length},
        "meetingsAttended": ${eventsThisWeek.length},
        "topAchievements": ["achievement 1", "achievement 2"],
        "areasForImprovement": ["area 1", "area 2"],
        "nextWeekSuggestions": ["suggestion 1", "suggestion 2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    const startIdx = responseText.indexOf("{");
    const endIdx = responseText.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) {
      throw new APIError("Gemini", "Invalid response format");
    }
    responseText = responseText.substring(startIdx, endIdx + 1);

    const report = JSON.parse(responseText);
    return createSuccessResult(report);
  } catch (error) {
    console.error("[AI Weekly Report] Error:", error);
    return createErrorResult(error);
  }
}
