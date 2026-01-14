/**
 * Smart Reschedule Utility
 * Intelligently reschedules events when delays occur
 */

import { addMinutes, parseISO, format } from "date-fns";

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  type?: string;
  isFixed?: boolean; // Fixed events (like meetings) won't be rescheduled
}

export interface RescheduleOptions {
  bufferMinutes?: number; // Buffer time between events (default: 5)
  respectFixedEvents?: boolean; // Don't move fixed events (default: true)
  startFromEvent?: string; // Event ID to start rescheduling from
  workDayEnd?: number; // Hour when work day ends (default: 18)
}

export interface RescheduleResult {
  events: ScheduleEvent[];
  changes: { eventId: string; oldStart: string; newStart: string }[];
  warnings: string[];
}

/**
 * Reschedule events forward from a given point
 * This is useful when a task runs late and you need to push everything forward
 */
export function smartReschedule(
  events: ScheduleEvent[],
  delayMinutes: number,
  options: RescheduleOptions = {}
): RescheduleResult {
  const { bufferMinutes = 5, respectFixedEvents = true, startFromEvent, workDayEnd = 18 } = options;

  // Sort events by start time
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const changes: { eventId: string; oldStart: string; newStart: string }[] = [];
  const warnings: string[] = [];
  const result: ScheduleEvent[] = [];

  // Find the starting point
  let startIndex = 0;
  if (startFromEvent) {
    startIndex = sorted.findIndex((e) => e.id === startFromEvent);
    if (startIndex === -1) startIndex = 0;
  }

  // Copy events before the starting point unchanged
  for (let i = 0; i < startIndex; i++) {
    result.push({ ...sorted[i] });
  }

  // Track the last event's end time for buffer calculation
  let lastEndTime =
    startIndex > 0 ? parseISO(sorted[startIndex - 1].end) : parseISO(sorted[startIndex].start);

  // Process events from the starting point
  for (let i = startIndex; i < sorted.length; i++) {
    const event = sorted[i];
    const originalStart = parseISO(event.start);
    const originalEnd = parseISO(event.end);
    const duration = (originalEnd.getTime() - originalStart.getTime()) / 60000;

    // Fixed events don't move
    if (respectFixedEvents && event.isFixed) {
      result.push({ ...event });
      lastEndTime = originalEnd;
      continue;
    }

    // Calculate new start time
    let newStart: Date;

    if (i === startIndex) {
      // First event to reschedule - add the delay
      newStart = addMinutes(originalStart, delayMinutes);
    } else {
      // Subsequent events - ensure they start after the last event + buffer
      const earliestStart = addMinutes(lastEndTime, bufferMinutes);
      newStart = earliestStart > originalStart ? earliestStart : originalStart;
    }

    const newEnd = addMinutes(newStart, duration);

    // Check if we're going past work day end
    const endHour = newEnd.getHours();
    if (endHour >= workDayEnd) {
      warnings.push(
        `"${event.title}" would end after ${workDayEnd}:00. Consider moving to tomorrow.`
      );
    }

    // Record the change if the start time actually changed
    if (newStart.getTime() !== originalStart.getTime()) {
      changes.push({
        eventId: event.id,
        oldStart: event.start,
        newStart: newStart.toISOString(),
      });
    }

    result.push({
      ...event,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    });

    lastEndTime = newEnd;
  }

  return { events: result, changes, warnings };
}

/**
 * Add buffer time between all events
 */
export function addBuffersBetweenEvents(
  events: ScheduleEvent[],
  bufferMinutes: number = 5
): ScheduleEvent[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const result: ScheduleEvent[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i];
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    const duration = (eventEnd.getTime() - eventStart.getTime()) / 60000;

    if (i > 0) {
      const prevEnd = parseISO(result[result.length - 1].end);
      const gap = (eventStart.getTime() - prevEnd.getTime()) / 60000;

      // If gap is less than buffer, push this event forward
      if (gap < bufferMinutes) {
        const newStart = addMinutes(prevEnd, bufferMinutes);
        const newEnd = addMinutes(newStart, duration);
        result.push({
          ...event,
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
        });
        continue;
      }
    }

    result.push({ ...event });
  }

  return result;
}

/**
 * Find gaps in the schedule
 */
export function findScheduleGaps(
  events: ScheduleEvent[],
  dayStartHour: number = 9,
  dayEndHour: number = 18
): { start: Date; end: Date; durationMinutes: number }[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  if (sorted.length === 0) return [];

  const gaps: { start: Date; end: Date; durationMinutes: number }[] = [];
  const firstEvent = parseISO(sorted[0].start);

  // Create a reference date for day boundaries
  const dayStart = new Date(firstEvent);
  dayStart.setHours(dayStartHour, 0, 0, 0);

  const dayEnd = new Date(firstEvent);
  dayEnd.setHours(dayEndHour, 0, 0, 0);

  // Check for gap before first event
  const firstEventStart = parseISO(sorted[0].start);
  if (firstEventStart > dayStart) {
    const gapDuration = (firstEventStart.getTime() - dayStart.getTime()) / 60000;
    if (gapDuration >= 15) {
      gaps.push({
        start: dayStart,
        end: firstEventStart,
        durationMinutes: gapDuration,
      });
    }
  }

  // Check for gaps between events
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = parseISO(sorted[i].end);
    const nextStart = parseISO(sorted[i + 1].start);

    const gapDuration = (nextStart.getTime() - currentEnd.getTime()) / 60000;

    if (gapDuration >= 15) {
      gaps.push({
        start: currentEnd,
        end: nextStart,
        durationMinutes: gapDuration,
      });
    }
  }

  // Check for gap after last event
  const lastEventEnd = parseISO(sorted[sorted.length - 1].end);
  if (lastEventEnd < dayEnd) {
    const gapDuration = (dayEnd.getTime() - lastEventEnd.getTime()) / 60000;
    if (gapDuration >= 15) {
      gaps.push({
        start: lastEventEnd,
        end: dayEnd,
        durationMinutes: gapDuration,
      });
    }
  }

  return gaps;
}

export default smartReschedule;
