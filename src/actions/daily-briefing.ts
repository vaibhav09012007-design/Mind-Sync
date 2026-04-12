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
import { requireWorkspaceAuth, ensureUserExists } from "./shared";
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
    const { userId, workspaceId } = await requireWorkspaceAuth();
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
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.status, "Todo"))),
      db
        .select()
        .from(events)
        .where(
          and(
            eq(events.workspaceId, workspaceId),
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

    // --- Helper function for fallback generation ---
    const getFallbackBriefing = (): DailyBriefing => {
      return {
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
    };

    // Check for Gemini API key
    const apiKey = getEnvOptional("GEMINI_API_KEY");
    if (!apiKey) {
      return createSuccessResult(getFallbackBriefing());
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

    try {
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
    } catch (apiError) {
      // If Gemini fails (e.g. 429 Quota Exceeded), log it but don't crash
      logger.warn("Gemini API failed during briefing generation, using fallback", { 
        error: apiError instanceof Error ? apiError.message : "Unknown error",
        action: "daily_briefing_api_error" 
      });
    }

    // Fallback if AI response parsing fails or API throws 429 quota error
    return createSuccessResult(getFallbackBriefing());
    
  } catch (error) {
    // Only return an actual error result if the database fetching or core auth logic fails
    logger.error("Core daily briefing fetch failed", error as Error, { action: "daily_briefing" });
    return createErrorResult(error);
  }
}
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
