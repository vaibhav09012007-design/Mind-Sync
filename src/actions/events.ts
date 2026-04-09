"use server";

/**
 * Event-related server actions
 */

import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
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
import { checkRateLimit } from "@/lib/rate-limiter";
import { getCachedEvents, CACHE_TAGS } from "@/lib/data-fetchers";
import { logger } from "@/lib/logger";

// --- Events ---

export async function getEvents(): Promise<ActionResult<(typeof events.$inferSelect)[]>> {
  try {
    const { userId } = await requireAuth();
    // Use cached fetcher
    const result = await getCachedEvents(userId);
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

    // Rate Limit: 50 requests per minute
    const rateLimit = await checkRateLimit(userId, "create-event", 50, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before creating more events.");
    }

    const validated = createEventSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    await ensureUserExists();

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
      logger.error("Failed to sync event to Google Calendar", e as Error, { action: "createEvent" });
      // Continue to save locally even if sync fails
    }

    await db.insert(events).values({
      id: data.id,
      userId,
      title: data.title,
      startTime: new Date(data.start),
      endTime: new Date(data.end),
      googleEventId: googleEventId,
      type: (data.type as "work" | "personal" | "meeting") || "work",
    });

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidateTag(CACHE_TAGS.events(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteEvent(id: string): Promise<ActionResult<void>> {
  try {
    const { userId, getToken } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "delete-event", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting events.");
    }

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
        logger.error("Failed to delete event from Google Calendar", e as Error, { action: "deleteEvent" });
      }
    }

    await db.delete(events).where(and(eq(events.id, id), eq(events.userId, userId)));

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidateTag(CACHE_TAGS.events(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function updateEvent(
  id: string,
  data: { title?: string; start?: string; end?: string; type?: string }
): Promise<ActionResult<void>> {
  try {
    const { userId, getToken } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "update-event", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before updating events.");
    }

    const validated = updateEventSchema.safeParse({ id, ...data });
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    const updates: Record<string, unknown> = {};
    if (data.title) updates.title = data.title;
    if (data.start) updates.startTime = new Date(data.start);
    if (data.end) updates.endTime = new Date(data.end);
    if (data.type) updates.type = data.type;

    if (Object.keys(updates).length === 0) {
      return createSuccessResult(undefined);
    }

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
        logger.error("Failed to update event in Google Calendar", e as Error, { action: "updateEvent" });
      }
    }

    await db
      .update(events)
      .set(updates)
      .where(and(eq(events.id, id), eq(events.userId, userId)));

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidateTag(CACHE_TAGS.events(userId), "default");
    revalidateTag(CACHE_TAGS.dashboard(userId), "default");

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

    // Rate Limit: 10 requests per minute (stricter for external API)
    const rateLimit = await checkRateLimit(userId, "sync-calendar", 10, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before syncing again.");
    }

    logger.info("Starting Google Calendar sync", { action: "syncGoogleCalendar" });

    const token = await getToken({ template: "oauth_google" });

    if (!token) {
      logger.error("No Google OAuth token found", undefined, { action: "syncGoogleCalendar" });
      throw new APIError("Google Calendar", "Please connect your Google Calendar in Settings.");
    }

    logger.info("Fetching events from Google", { action: "syncGoogleCalendar" });
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      logger.error(`Google API error (${response.status})`, undefined, { action: "syncGoogleCalendar", status: response.status });

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
    logger.info("Google Calendar events fetched", { action: "syncGoogleCalendar", count: googleEvents.length });

    await ensureUserExists();

    // Fetch all existing events for this user in one query
    const existingEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    const existingByGoogleId = new Map(
      existingEvents
        .filter((e) => e.googleEventId)
        .map((e) => [e.googleEventId, e])
    );

    // Collect batch operations
    const newEventValues: Array<typeof events.$inferInsert> = [];
    const updatePromises: Promise<unknown>[] = [];

    for (const gEvent of googleEvents) {
      if (!gEvent.start || !gEvent.end) continue;

      const start = gEvent.start.dateTime || gEvent.start.date;
      const end = gEvent.end.dateTime || gEvent.end.date;

      const existing = existingByGoogleId.get(gEvent.id);

      if (!existing) {
        newEventValues.push({
          userId,
          googleEventId: gEvent.id,
          title: gEvent.summary || "(No Title)",
          startTime: new Date(start),
          endTime: new Date(end),
          meetingUrl: gEvent.hangoutLink || gEvent.htmlLink,
          type: gEvent.hangoutLink ? "meeting" : "work",
        });
      } else {
        updatePromises.push(
          db
            .update(events)
            .set({
              title: gEvent.summary || "(No Title)",
              startTime: new Date(start),
              endTime: new Date(end),
              meetingUrl: gEvent.hangoutLink || gEvent.htmlLink,
              type: gEvent.hangoutLink ? "meeting" : "work",
            })
            .where(eq(events.id, existing.id))
        );
      }
    }

    // Execute batch insert for new events (1 DB call)
    if (newEventValues.length > 0) {
      await db.insert(events).values(newEventValues);
    }

    // Execute all updates in parallel
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    const syncedCount = newEventValues.length;

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return createSuccessResult({ count: syncedCount, total: googleEvents.length });
  } catch (error: unknown) {
    logger.error("[Sync] CRITICAL FAILURE", error as Error, { action: "syncGoogleCalendar" });

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
