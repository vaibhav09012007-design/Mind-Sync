"use server";

/**
 * AI-powered task auto-categorization
 * Runs as background processing after task creation
 * Analyzes title/description to assign priority, tags, and estimated duration
 */

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { requireWorkspaceAuth } from "./shared";
import { getEnvOptional } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/data-fetchers";

// --- Types ---

export interface CategorizationResult {
  taskId: string;
  suggestedPriority: "P0" | "P1" | "P2" | "P3";
  suggestedTags: string[];
  suggestedEstimate: number; // minutes
  applied: boolean;
}

// --- Local Heuristic Categorization ---

const PRIORITY_PATTERNS: [RegExp, "P0" | "P1" | "P2" | "P3"][] = [
  [/\b(critical|urgent|asap|emergency|prod\s*bug|hotfix|p0|blocker)\b/i, "P0"],
  [/\b(important|high|priority|deadline|review|ship)\b/i, "P1"],
  [/\b(low|minor|nice.?to.?have|someday|backlog|cleanup)\b/i, "P3"],
];

const TAG_PATTERNS: [RegExp, string][] = [
  [/\b(bug|fix|error|crash|broken|issue)\b/i, "bug"],
  [/\b(feature|add|implement|build|create|new)\b/i, "feature"],
  [/\b(docs?|document|readme|write.?up)\b/i, "docs"],
  [/\b(test|spec|coverage|e2e|unit)\b/i, "testing"],
  [/\b(design|ui|ux|layout|style|css)\b/i, "design"],
  [/\b(deploy|release|ci|cd|pipeline|infra)\b/i, "devops"],
  [/\b(refactor|clean|improve|optimize|perf)\b/i, "refactor"],
  [/\b(meeting|call|sync|standup|review)\b/i, "meeting"],
  [/\b(research|spike|explore|investigate|poc)\b/i, "research"],
];

const ESTIMATE_PATTERNS: [RegExp, number][] = [
  [/\b(quick|small|minor|typo|tweak)\b/i, 15],
  [/\b(bug|fix|update|change)\b/i, 30],
  [/\b(feature|implement|build|add)\b/i, 120],
  [/\b(refactor|redesign|migrate|overhaul)\b/i, 240],
  [/\b(research|spike|explore|poc)\b/i, 60],
];

function categorizeLocally(title: string, description?: string): {
  priority: "P0" | "P1" | "P2" | "P3";
  tags: string[];
  estimate: number;
} {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  // Priority
  let priority: "P0" | "P1" | "P2" | "P3" = "P2";
  for (const [pattern, p] of PRIORITY_PATTERNS) {
    if (pattern.test(text)) {
      priority = p;
      break;
    }
  }

  // Tags
  const tags = new Set<string>();
  for (const [pattern, tag] of TAG_PATTERNS) {
    if (pattern.test(text)) {
      tags.add(tag);
    }
  }

  // Estimate
  let estimate = 30; // default 30 min
  for (const [pattern, mins] of ESTIMATE_PATTERNS) {
    if (pattern.test(text)) {
      estimate = mins;
      break;
    }
  }

  return { priority, tags: Array.from(tags), estimate };
}

// --- Main Action ---

/**
 * Auto-categorize a task using AI (or local heuristics as fallback)
 * Designed to be called fire-and-forget after task creation
 */
export async function autoCategorizeTask(
  taskId: string
): Promise<ActionResult<CategorizationResult>> {
  try {
    const { workspaceId } = await requireWorkspaceAuth();

    // Fetch the task
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
      .limit(1);

    if (!task) {
      return createErrorResult(new Error("Task not found"));
    }

    // Skip if task already has manual priority (not default P2) or has tags
    const hasExplicitPriority = task.priority && task.priority !== "P2";
    const hasTags = task.tags && task.tags.length > 0;
    if (hasExplicitPriority && hasTags) {
      return createSuccessResult({
        taskId,
        suggestedPriority: task.priority as "P0" | "P1" | "P2" | "P3",
        suggestedTags: task.tags ?? [],
        suggestedEstimate: task.estimatedMinutes ?? 30,
        applied: false,
      });
    }

    let result: { priority: "P0" | "P1" | "P2" | "P3"; tags: string[]; estimate: number };

    // Try AI categorization
    const apiKey = getEnvOptional("GEMINI_API_KEY");
    if (apiKey) {
      try {
        result = await categorizeWithAI(task.title, task.description ?? undefined, apiKey);
      } catch (aiError) {
        logger.warn("AI categorization failed, using local heuristics", {
          action: "autoCategorizeTask",
          error: (aiError as Error).message,
        });
        result = categorizeLocally(task.title, task.description ?? undefined);
      }
    } else {
      result = categorizeLocally(task.title, task.description ?? undefined);
    }

    // Apply results — only update fields that weren't manually set
    const updates: Record<string, unknown> = {};
    if (!hasExplicitPriority) updates.priority = result.priority;
    if (!hasTags && result.tags.length > 0) updates.tags = result.tags;
    if (!task.estimatedMinutes) updates.estimatedMinutes = result.estimate;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db
        .update(tasks)
        .set(updates)
        .where(eq(tasks.id, taskId));

      revalidateTag(CACHE_TAGS.tasks(workspaceId), "default");
    }

    logger.info("Task auto-categorized", {
      action: "autoCategorizeTask",
      taskId,
      priority: result.priority,
      tags: result.tags,
    });

    return createSuccessResult({
      taskId,
      suggestedPriority: result.priority,
      suggestedTags: result.tags,
      suggestedEstimate: result.estimate,
      applied: Object.keys(updates).length > 0,
    });
  } catch (error) {
    logger.error("Auto-categorization failed", error as Error, {
      action: "autoCategorizeTask",
    });
    return createErrorResult(error);
  }
}

// --- AI Categorization ---

async function categorizeWithAI(
  title: string,
  description: string | undefined,
  apiKey: string
): Promise<{ priority: "P0" | "P1" | "P2" | "P3"; tags: string[]; estimate: number }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const sanitized = `${title} ${description ?? ""}`
    .replace(/```/g, "'''")
    .replace(/<[^>]*>/g, "")
    .slice(0, 300);

  const prompt = `Categorize this task. Return ONLY JSON, no markdown.

<task>
${sanitized}
</task>

Return:
{
  "priority": "P0" | "P1" | "P2" | "P3",
  "tags": ["tag1", "tag2"],
  "estimatedMinutes": number
}

Priority guide: P0=critical/urgent, P1=high/important, P2=normal, P3=low
Tags: choose from [bug, feature, docs, testing, design, devops, refactor, meeting, research, personal, health, finance]
Estimate: realistic minutes to complete`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("No JSON in AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    priority: ["P0", "P1", "P2", "P3"].includes(parsed.priority) ? parsed.priority : "P2",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    estimate: typeof parsed.estimatedMinutes === "number" ? parsed.estimatedMinutes : 30,
  };
}
