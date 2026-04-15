"use server";

/**
 * Collaborative notes server actions
 * Handles periodic Yjs state snapshots to the database
 */

import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { requireWorkspaceAuth } from "./shared";
import { logger } from "@/lib/logger";

/**
 * Save a Yjs document snapshot to the database
 * Called periodically during collaborative editing as a persistence backup
 */
export async function saveNoteSnapshot(
  noteId: string,
  content: Record<string, unknown>,
  preview?: string
): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const { workspaceId } = await requireWorkspaceAuth();

    await db
      .update(notes)
      .set({
        content,
        preview: preview ?? "",
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, noteId), eq(notes.workspaceId, workspaceId)));

    logger.info("Note snapshot saved", {
      action: "saveNoteSnapshot",
      noteId,
    });

    return createSuccessResult({ saved: true });
  } catch (error) {
    logger.error("Failed to save note snapshot", error as Error, {
      action: "saveNoteSnapshot",
      noteId,
    });
    return createErrorResult(error);
  }
}
