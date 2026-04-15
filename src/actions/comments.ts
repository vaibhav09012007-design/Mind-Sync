"use server";

/**
 * Comment server actions
 * Handles CRUD for inline comment threads on tasks and notes
 */

import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  ValidationError,
  AuthError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { requireWorkspaceAuth } from "./shared";
import { logger } from "@/lib/logger";
import { z } from "zod";

// --- Validation ---

const createCommentSchema = z.object({
  entityType: z.enum(["task", "note"]),
  entityId: z.string().uuid("Invalid entity ID"),
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment too long"),
});

// --- Types ---

export interface CommentWithUser {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  entityType: string;
  entityId: string;
  createdAt: Date | null;
}

// --- Actions ---

/**
 * Create a comment on a task or note
 */
export async function createComment(
  entityType: "task" | "note",
  entityId: string,
  content: string
): Promise<ActionResult<CommentWithUser>> {
  try {
    const { userId, workspaceId } = await requireWorkspaceAuth();

    const validated = createCommentSchema.safeParse({ entityType, entityId, content });
    if (!validated.success) {
      throw new ValidationError(
        validated.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const [inserted] = await db
      .insert(comments)
      .values({
        entityType: validated.data.entityType,
        entityId: validated.data.entityId,
        content: validated.data.content,
        userId,
        workspaceId,
      })
      .returning();

    // Fetch user info for the response
    const [userRecord] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const commentWithUser: CommentWithUser = {
      id: inserted.id,
      content: inserted.content,
      userId: inserted.userId,
      userName: userRecord?.email?.split("@")[0] ?? "User",
      userEmail: userRecord?.email ?? "",
      entityType: inserted.entityType,
      entityId: inserted.entityId,
      createdAt: inserted.createdAt,
    };

    logger.info("Comment created", {
      action: "createComment",
      commentId: inserted.id,
      entityType,
      entityId,
    });

    revalidatePath("/dashboard");
    return createSuccessResult(commentWithUser);
  } catch (error) {
    logger.error("Failed to create comment", error as Error, { action: "createComment" });
    return createErrorResult(error);
  }
}

/**
 * Get all comments for a specific entity (task or note)
 */
export async function getComments(
  entityType: "task" | "note",
  entityId: string
): Promise<ActionResult<CommentWithUser[]>> {
  try {
    const { workspaceId } = await requireWorkspaceAuth();

    const records = await db
      .select({
        id: comments.id,
        content: comments.content,
        userId: comments.userId,
        entityType: comments.entityType,
        entityId: comments.entityId,
        createdAt: comments.createdAt,
        userEmail: users.email,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(
        and(
          eq(comments.entityType, entityType),
          eq(comments.entityId, entityId),
          eq(comments.workspaceId, workspaceId)
        )
      )
      .orderBy(desc(comments.createdAt));

    const result: CommentWithUser[] = records.map((r) => ({
      id: r.id,
      content: r.content,
      userId: r.userId,
      userName: r.userEmail?.split("@")[0] ?? "User",
      userEmail: r.userEmail ?? "",
      entityType: r.entityType,
      entityId: r.entityId,
      createdAt: r.createdAt,
    }));

    return createSuccessResult(result);
  } catch (error) {
    logger.error("Failed to get comments", error as Error, { action: "getComments" });
    return createErrorResult(error);
  }
}

/**
 * Delete a comment (own comments only)
 */
export async function deleteComment(
  commentId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const { userId } = await requireWorkspaceAuth();

    // Verify ownership
    const [existing] = await db
      .select({ userId: comments.userId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!existing) {
      throw new ValidationError({ comment: ["Comment not found"] });
    }

    if (existing.userId !== userId) {
      throw new AuthError("You can only delete your own comments");
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    logger.info("Comment deleted", { action: "deleteComment", commentId });

    revalidatePath("/dashboard");
    return createSuccessResult({ deleted: true });
  } catch (error) {
    logger.error("Failed to delete comment", error as Error, { action: "deleteComment" });
    return createErrorResult(error);
  }
}
