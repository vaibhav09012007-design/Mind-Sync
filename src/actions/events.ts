"use server";

/**
 * Event-related server actions
 */

import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  ValidationError,
  APIError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { createEventSchema, updateEventSchema } from "@/lib/validation";
import { GoogleCalendarService } from "@/lib/google-calendar";
import { requireAuth, ensureUserExists } from "./shared";
import { reportError } from "@/lib/error-reporting";

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

    await ensureUserExists(userId);

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

    await ensureUserExists(userId);

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
  } catch (error: unknown) {
    console.error("[Sync] CRITICAL FAILURE:", error);
    
    // Report sync failures with context
    reportError(error as Error, {
      action: "google_calendar_sync",
      extra: {
        errorMessage: (error as Error)?.message || "Unknown error",
      }
    });
    
    return createErrorResult(error);
  }
}
