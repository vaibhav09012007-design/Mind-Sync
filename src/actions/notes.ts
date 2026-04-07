"use server";

/**
 * Note-related server actions
 */

import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  ValidationError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
  APIError,
} from "@/lib/errors";
import { createNoteSchema } from "@/lib/validation";
import { requireAuth, ensureUserExists } from "./shared";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getCachedNotes, CACHE_TAGS } from "@/lib/data-fetchers";
import { logger } from "@/lib/logger";

// --- Notes ---

export async function getNotes(): Promise<ActionResult<(typeof notes.$inferSelect)[]>> {
  try {
    const { userId } = await requireAuth();
    // Use cached fetcher
    const result = await getCachedNotes(userId);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function createNote(data: {
  id: string;
  title: string;
  content: string;
  preview: string;
  date: string;
  tags?: string[];
  type?: "meeting" | "personal" | "journal";
  sentiment?: "positive" | "neutral" | "negative";
  metadata?: unknown;
  eventId?: string;
}): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 60 requests per minute
    const rateLimit = await checkRateLimit(userId, "create-note", 60, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before creating more notes.");
    }

    // Validate input
    const validated = createNoteSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      throw new ValidationError(errors as Record<string, string[]>);
    }

    await ensureUserExists();

    await db.insert(notes).values({
      id: data.id,
      userId,
      title: data.title,
      content: JSON.stringify(data.content),
      preview: data.preview,
      tags: data.tags,
      type: data.type || "personal",
      sentiment: data.sentiment,
      metadata: data.metadata,
      eventId: data.eventId || null,
      createdAt: new Date(data.date),
    });

    revalidatePath("/notes");
    revalidateTag(CACHE_TAGS.notes(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function updateNote(
  id: string,
  data: {
    title?: string;
    content?: string;
    preview?: string;
    tags?: string[];
    type?: "meeting" | "personal" | "journal";
    sentiment?: "positive" | "neutral" | "negative";
    metadata?: unknown;
    date?: string;
    eventId?: string;
  }
): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "update-note", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before updating notes.");
    }

    const updates: Record<string, unknown> = {};
    if (data.title) updates.title = data.title;
    if (data.content) updates.content = JSON.stringify(data.content);
    if (data.preview) updates.preview = data.preview;
    if (data.tags) updates.tags = data.tags;
    if (data.type) updates.type = data.type;
    if (data.sentiment) updates.sentiment = data.sentiment;
    if (data.metadata) updates.metadata = data.metadata;
    if (data.date) updates.updatedAt = new Date(data.date);
    if (data.eventId !== undefined) updates.eventId = data.eventId || null;

    if (Object.keys(updates).length === 0) {
      return createSuccessResult(undefined);
    }

    await db
      .update(notes)
      .set(updates)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));

    revalidatePath("/notes");
    revalidateTag(CACHE_TAGS.notes(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}

export async function deleteNote(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await requireAuth();

    // Rate Limit: 100 requests per minute
    const rateLimit = await checkRateLimit(userId, "delete-note", 100, 60);
    if (!rateLimit.allowed) {
      throw new APIError("Too Many Requests", "Please wait before deleting notes.");
    }

    if (!id || typeof id !== "string") {
      throw new ValidationError({ id: ["Invalid note ID"] });
    }

    try {
      await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
    } catch (dbError: unknown) {
      // If code is "22P02" (invalid_text_representation for uuid), it means the ID
      // provided was not a valid UUID (e.g. "9efxvmn1m").
      // Since it's invalid, it can't exist in the DB, so we treat it as successfully deleted.
      if (typeof dbError === 'object' && dbError !== null && 'code' in dbError && (dbError as { code: string }).code === "22P02") {
        logger.warn(`Ignored invalid UUID format: ${id}`, { action: "deleteNote" });
        // Fallthrough to return success
      } else {
        throw dbError;
      }
    }

    revalidatePath("/notes");
    revalidateTag(CACHE_TAGS.notes(userId), "default");

    return createSuccessResult(undefined);
  } catch (error) {
    return createErrorResult(error);
  }
}
