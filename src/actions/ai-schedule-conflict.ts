"use server";

/**
 * Smart calendar conflict detection and resolution
 * Detects overlapping events and suggests alternative time slots
 */

import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import {
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { requireWorkspaceAuth } from "./shared";
import { getEnvOptional } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

// --- Types ---

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingEvents: {
    id: string;
    title: string;
    start: string;
    end: string;
  }[];
}

export interface AlternativeSlot {
  start: string; // ISO
  end: string; // ISO
  label: string; // "9:00 AM – 10:00 AM"
  reason?: string; // "Free slot before standup"
}

// --- Conflict Detection ---

/**
 * Check if a proposed time range conflicts with existing events
 */
export async function detectConflicts(
  proposedStart: string,
  proposedEnd: string
): Promise<ActionResult<ConflictInfo>> {
  try {
    const { workspaceId } = await requireWorkspaceAuth();

    const startTime = new Date(proposedStart);
    const endTime = new Date(proposedEnd);

    // Find overlapping events:
    // An event overlaps if it starts before our end AND ends after our start
    const overlapping = await db
      .select({
        id: events.id,
        title: events.title,
        startTime: events.startTime,
        endTime: events.endTime,
      })
      .from(events)
      .where(
        and(
          eq(events.workspaceId, workspaceId),
          lte(events.startTime, endTime),
          gte(events.endTime, startTime)
        )
      );

    return createSuccessResult({
      hasConflict: overlapping.length > 0,
      conflictingEvents: overlapping.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.startTime.toISOString(),
        end: e.endTime.toISOString(),
      })),
    });
  } catch (error) {
    logger.error("Conflict detection failed", error as Error, {
      action: "detectConflicts",
    });
    return createErrorResult(error);
  }
}

/**
 * Suggest alternative time slots for a given date and duration
 */
export async function suggestAlternativeSlots(
  targetDate: string,
  durationMinutes: number = 60
): Promise<ActionResult<AlternativeSlot[]>> {
  try {
    const { workspaceId } = await requireWorkspaceAuth();

    const date = new Date(targetDate);
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // Working hours: 9 AM
    const dayEnd = new Date(date);
    dayEnd.setHours(17, 0, 0, 0); // Working hours: 5 PM

    // Fetch all events for this day
    const dayEvents = await db
      .select({
        title: events.title,
        startTime: events.startTime,
        endTime: events.endTime,
      })
      .from(events)
      .where(
        and(
          eq(events.workspaceId, workspaceId),
          gte(events.startTime, dayStart),
          lte(events.startTime, dayEnd)
        )
      );

    // Sort by start time
    const sorted = dayEvents.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    // Find free gaps
    const slots: AlternativeSlot[] = [];
    let cursor = dayStart.getTime();
    const durationMs = durationMinutes * 60 * 1000;

    for (const event of sorted) {
      const eventStart = event.startTime.getTime();
      const eventEnd = event.endTime.getTime();

      // Gap before this event
      if (eventStart - cursor >= durationMs) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor + durationMs);
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label: formatTimeRange(slotStart, slotEnd),
          reason: `Free slot before "${event.title}"`,
        });
      }

      // Move cursor past this event
      cursor = Math.max(cursor, eventEnd);
    }

    // Gap after last event
    if (dayEnd.getTime() - cursor >= durationMs) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor + durationMs);
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        label: formatTimeRange(slotStart, slotEnd),
        reason: "Free slot at end of day",
      });
    }

    // If we have an API key, ask AI to rank/recommend
    const apiKey = getEnvOptional("GEMINI_API_KEY");
    if (apiKey && slots.length > 2) {
      try {
        const ranked = await rankSlotsWithAI(slots, apiKey);
        return createSuccessResult(ranked);
      } catch {
        // Fallback to unranked
      }
    }

    return createSuccessResult(slots.slice(0, 5));
  } catch (error) {
    logger.error("Slot suggestion failed", error as Error, {
      action: "suggestAlternativeSlots",
    });
    return createErrorResult(error);
  }
}

// --- Helpers ---

function formatTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

async function rankSlotsWithAI(
  slots: AlternativeSlot[],
  apiKey: string
): Promise<AlternativeSlot[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const slotDescriptions = slots
    .map((s, i) => `${i}: ${s.label} (${s.reason})`)
    .join("\n");

  const prompt = `Rank these time slots by productivity (morning focus, post-lunch engagement, etc.).
Return ONLY a JSON array of indices in best-to-worst order.

Slots:
${slotDescriptions}

Example output: [2, 0, 1, 3]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\[[\d,\s]+\]/);

  if (match) {
    const indices: number[] = JSON.parse(match[0]);
    return indices
      .filter((i) => i >= 0 && i < slots.length)
      .map((i) => slots[i]);
  }

  return slots;
}
