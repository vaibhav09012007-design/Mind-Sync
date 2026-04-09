/**
 * Recurring Task Utilities
 * Generates task instances from recurrence configuration.
 */

import { addDays, addWeeks, addMonths, startOfDay, isBefore, isAfter, isSameDay } from "date-fns";

export interface RecurrenceConfig {
  type: "daily" | "weekly" | "monthly";
  interval: number;
}

/**
 * Generate a list of due dates from a recurrence config within a date range.
 * @param startDate - The original due date of the recurring task
 * @param recurrence - The recurrence configuration
 * @param rangeStart - Start of the generation window (inclusive)
 * @param rangeEnd - End of the generation window (inclusive)
 * @returns Array of dates when instances should be created
 */
export function generateRecurringDates(
  startDate: Date,
  recurrence: RecurrenceConfig,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(new Date(startDate));
  const end = startOfDay(rangeEnd);
  const start = startOfDay(rangeStart);

  // Advance from the original start to at least rangeStart
  const advanceFn = getAdvanceFn(recurrence.type);

  // Generate all occurrences from original start through rangeEnd
  while (!isAfter(current, end)) {
    if (!isBefore(current, start)) {
      dates.push(new Date(current));
    }
    current = advanceFn(current, recurrence.interval);
  }

  return dates;
}

/**
 * Check whether a new instance should be created for a given date,
 * considering existing instances to avoid duplicates.
 */
export function shouldCreateInstance(
  date: Date,
  existingInstanceDates: Date[]
): boolean {
  return !existingInstanceDates.some((existing) =>
    isSameDay(existing, date)
  );
}

/**
 * Get the next occurrence date from a given date.
 */
export function getNextOccurrence(
  fromDate: Date,
  recurrence: RecurrenceConfig
): Date {
  const advanceFn = getAdvanceFn(recurrence.type);
  return advanceFn(fromDate, recurrence.interval);
}

/**
 * Get a human-readable description of a recurrence.
 */
export function describeRecurrence(recurrence: RecurrenceConfig): string {
  const { type, interval } = recurrence;
  if (interval === 1) {
    return type === "daily" ? "Every day" : type === "weekly" ? "Every week" : "Every month";
  }
  return `Every ${interval} ${type === "daily" ? "days" : type === "weekly" ? "weeks" : "months"}`;
}

// --- Internals ---

function getAdvanceFn(type: RecurrenceConfig["type"]): (date: Date, amount: number) => Date {
  switch (type) {
    case "daily":
      return addDays;
    case "weekly":
      return addWeeks;
    case "monthly":
      return addMonths;
    default:
      return addDays;
  }
}
