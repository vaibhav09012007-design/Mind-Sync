"use server";

/**
 * AI-Powered Daily Briefing
 * Generates a personalized daily overview using Gemini
 */

import { db } from "@/db";
import { tasks, events } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ActionResult,
  createSuccessResult,
  createErrorResult,
  APIError,
} from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { requireAuth, ensureUserExists } from "./shared";
import { getEnvOptional } from "@/lib/env";
import { logger } from "@/lib/logger";
import { startOfDay, endOfDay, format, isPast } from "date-fns";

export interface DailyBriefing {
  greeting: string;
  priorities: string[];
  scheduleOverview: string;
  suggestions: string[];
  motivationalNote: string;
  stats: {
    totalTasks: number;
    overdueTasks: number;
    todayEvents: number;
  };
}

export async function generateDailyBriefing(): Promise<ActionResult<DailyBriefing>> {
  try {
    const { userId } = await requireAuth();
    await ensureUserExists();

    // Rate limit: 3 briefings per hour
    const rateLimitResult = await checkRateLimit(userId, "daily-briefing", 3, 3600);
    if (!rateLimitResult.allowed) {
      return createErrorResult(new APIError("Rate Limit", "Please wait before generating another briefing."));
    }

    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    // Fetch today's context
    const [userTasks, todayEvents] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.userId, userId), eq(tasks.status, "Todo"))),
      db
        .select()
        .from(events)
        .where(
          and(
            eq(events.userId, userId),
            gte(events.startTime, dayStart),
            lte(events.startTime, dayEnd)
          )
        ),
    ]);

    const overdueTasks = userTasks.filter(
      (t) => t.dueDate && isPast(new Date(t.dueDate))
    );
    const todayTasks = userTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) >= dayStart &&
        new Date(t.dueDate) <= dayEnd
    );

    const stats = {
      totalTasks: userTasks.length,
      overdueTasks: overdueTasks.length,
      todayEvents: todayEvents.length,
    };

    // Check for Gemini API key
    const apiKey = getEnvOptional("GEMINI_API_KEY");
    if (!apiKey) {
      // Return a non-AI briefing with real data
      const briefing: DailyBriefing = {
        greeting: `Good ${getTimeOfDay()}! Here's your day at a glance.`,
        priorities: todayTasks.length > 0
          ? todayTasks.slice(0, 3).map((t) => t.title)
          : overdueTasks.length > 0
            ? [`⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""} need attention`]
            : ["No urgent tasks — great time for deep work!"],
        scheduleOverview: todayEvents.length > 0
          ? `You have ${todayEvents.length} event${todayEvents.length > 1 ? "s" : ""} today, starting with "${todayEvents[0].title}" at ${format(todayEvents[0].startTime, "h:mm a")}.`
          : "Your calendar is clear today — perfect for focused work.",
        suggestions: [
          userTasks.length > 10 ? "Consider breaking down large tasks into smaller subtasks." : "Keep up the momentum!",
          overdueTasks.length > 0 ? "Tackle overdue tasks first to clear your backlog." : "You're on track — no overdue items.",
        ],
        motivationalNote: "Focus on progress, not perfection. Every task completed is a step forward.",
        stats,
      };
      return createSuccessResult(briefing);
    }

    // Use Gemini for AI-powered briefing
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const taskList = userTasks
      .slice(0, 20)
      .map((t) => `- ${t.title} (Priority: ${t.priority || "P2"}, Due: ${t.dueDate ? format(new Date(t.dueDate), "MMM d") : "No date"})`)
      .join("\n");

    const eventList = todayEvents
      .map((e) => `- ${e.title} at ${format(e.startTime, "h:mm a")} - ${format(e.endTime, "h:mm a")}`)
      .join("\n");

    const prompt = `You are a productivity coach. Generate a daily briefing for ${format(today, "EEEE, MMMM d")}.

<data>
Open Tasks (${userTasks.length} total, ${overdueTasks.length} overdue):
${taskList || "No tasks"}

Today's Events:
${eventList || "No events"}
</data>

Return ONLY a JSON object:
{
  "greeting": "short personalized greeting with emoji",
  "priorities": ["array of 3 most important things to focus on"],
  "scheduleOverview": "one sentence about today's schedule",
  "suggestions": ["2-3 actionable productivity tips based on the data"],
  "motivationalNote": "a brief motivational closing"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (aiData) {
      const briefing: DailyBriefing = {
        ...aiData,
        stats,
      };
      return createSuccessResult(briefing);
    }

    // Fallback if AI response parsing fails
    return createSuccessResult({
      greeting: `Good ${getTimeOfDay()}!`,
      priorities: todayTasks.slice(0, 3).map((t) => t.title),
      scheduleOverview: `${todayEvents.length} events today.`,
      suggestions: ["Review your task priorities for the day."],
      motivationalNote: "Make today count!",
      stats,
    });
  } catch (error) {
    logger.error("Daily briefing generation failed", error as Error, { action: "daily_briefing" });
    return createErrorResult(error);
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
