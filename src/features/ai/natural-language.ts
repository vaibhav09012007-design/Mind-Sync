/**
 * Natural language task parsing for MindSync
 * Parses commands like "Remind me to call John tomorrow at 3pm"
 */

import * as chrono from "chrono-node";
import { Priority } from "@/store/useStore";

interface ParsedTask {
  title: string;
  dueDate: Date | null;
  priority: Priority;
  hasTime: boolean;
}

// Priority keywords
const priorityKeywords: Record<string, Priority> = {
  urgent: "P0",
  critical: "P0",
  asap: "P0",
  important: "P1",
  high: "P1",
  normal: "P2",
  low: "P3",
  "low priority": "P3",
  someday: "P3",
};

/**
 * Parse a natural language task input
 * Extracts: task title, due date/time, priority
 */
export function parseNaturalLanguageTask(input: string): ParsedTask {
  let title = input.trim();
  let priority: Priority = "P2";
  let dueDate: Date | null = null;
  let hasTime = false;

  // Check for priority keywords
  const lowerInput = input.toLowerCase();
  for (const [keyword, p] of Object.entries(priorityKeywords)) {
    if (lowerInput.includes(keyword)) {
      priority = p;
      // Remove the keyword from title
      title = title.replace(new RegExp(keyword, "gi"), "").trim();
      break;
    }
  }

  // Parse date/time using chrono
  const parsedResults = chrono.parse(input, new Date(), { forwardDate: true });

  if (parsedResults.length > 0) {
    const result = parsedResults[0];
    dueDate = result.start.date();

    // Check if time was explicitly mentioned
    hasTime = result.start.isCertain("hour") || result.start.isCertain("minute");

    // Remove the date text from the title
    title = input.replace(result.text, "").trim();
  }

  // Clean up the title
  title = cleanupTitle(title);

  // Default to today if no date
  if (!dueDate) {
    dueDate = new Date();
  }

  return {
    title,
    dueDate,
    priority,
    hasTime,
  };
}

/**
 * Clean up the task title
 */
function cleanupTitle(title: string): string {
  return title
    // Remove common prefixes
    .replace(/^(remind me to|reminder to|remind|remember to|todo|task|add|create)\s*/i, "")
    // Remove trailing punctuation
    .replace(/[.,!?]+$/, "")
    // Remove extra spaces
    .replace(/\s+/g, " ")
    // Capitalize first letter
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/**
 * Examples of natural language parsing:
 * 
 * "Call mom tomorrow at 3pm" -> { title: "Call mom", dueDate: tomorrow 3pm, priority: P2 }
 * "Urgent: finish report by Friday" -> { title: "Finish report", dueDate: Friday, priority: P0 }
 * "Buy groceries next week" -> { title: "Buy groceries", dueDate: next week, priority: P2 }
 * "Low priority: clean garage someday" -> { title: "Clean garage", dueDate: today, priority: P3 }
 */

/**
 * Get suggestions for natural language input
 */
export function getInputSuggestions(input: string): string[] {
  const suggestions: string[] = [];
  const lowerInput = input.toLowerCase();

  // Time suggestions
  if (lowerInput.includes("tomorrow") || lowerInput.includes("today")) {
    if (!lowerInput.includes("at ")) {
      suggestions.push(`${input} at 9am`);
      suggestions.push(`${input} at 2pm`);
    }
  }

  // Priority suggestions
  if (!Object.keys(priorityKeywords).some((k) => lowerInput.includes(k))) {
    if (lowerInput.includes("meeting") || lowerInput.includes("deadline")) {
      suggestions.push(`${input} (important)`);
    }
  }

  // Day suggestions
  if (!chrono.parse(input).length) {
    suggestions.push(`${input} today`);
    suggestions.push(`${input} tomorrow`);
    suggestions.push(`${input} next week`);
  }

  return suggestions.slice(0, 3);
}
