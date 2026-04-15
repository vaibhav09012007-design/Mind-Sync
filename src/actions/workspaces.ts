"use server";

/**
 * Workspace management server actions
 * Handles CRUD, membership, and switching for multi-tenant workspaces
 */

import { db } from "@/db";
import { workspaces, workspaceMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  AuthError,
  ValidationError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { requireAuth, ensureUserExists } from "./shared";
import { logger } from "@/lib/logger";
import { z } from "zod";

// --- Validation Schemas ---

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(50, "Workspace name must be 50 characters or less")
    .trim(),
});

const inviteMemberSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

// --- Types ---

export interface WorkspaceWithRole {
  id: string;
  name: string;
  ownerId: string;
  role: "admin" | "editor" | "viewer";
  createdAt: Date | null;
  memberCount?: number;
}

// --- Actions ---

/**
 * List all workspaces the current user belongs to
 */
export async function listUserWorkspaces(): Promise<ActionResult<WorkspaceWithRole[]>> {
  try {
    const { userId } = await requireAuth();
    await ensureUserExists();

    const records = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        ownerId: workspaces.ownerId,
        role: workspaceMembers.role,
        createdAt: workspaces.createdAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));

    return createSuccessResult(
      records.map((r) => ({
        ...r,
        role: r.role as "admin" | "editor" | "viewer",
      }))
    );
  } catch (error) {
    logger.error("Failed to list workspaces", error as Error, { action: "listUserWorkspaces" });
    return createErrorResult(error);
  }
}

/**
 * Create a new workspace and add the creator as admin
 */
export async function createWorkspace(
  name: string
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const { userId } = await requireAuth();
    await ensureUserExists();

    const validated = createWorkspaceSchema.safeParse({ name });
    if (!validated.success) {
      throw new ValidationError(
        validated.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: validated.data.name,
        ownerId: userId,
      })
      .returning({ id: workspaces.id, name: workspaces.name });

    await db.insert(workspaceMembers).values({
      workspaceId: newWorkspace.id,
      userId,
      role: "admin",
    });

    logger.info("Workspace created", {
      action: "createWorkspace",
      workspaceId: newWorkspace.id,
      userId,
    });

    revalidatePath("/dashboard");
    return createSuccessResult(newWorkspace);
  } catch (error) {
    logger.error("Failed to create workspace", error as Error, { action: "createWorkspace" });
    return createErrorResult(error);
  }
}

/**
 * Invite a member to a workspace by email
 * Requires admin role in the target workspace
 */
export async function inviteMember(
  workspaceId: string,
  email: string,
  role: "admin" | "editor" | "viewer" = "editor"
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { userId } = await requireAuth();

    const validated = inviteMemberSchema.safeParse({ workspaceId, email, role });
    if (!validated.success) {
      throw new ValidationError(
        validated.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Verify caller is admin of this workspace
    const callerMembership = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1);

    if (callerMembership.length === 0 || callerMembership[0].role !== "admin") {
      throw new AuthError("Only workspace admins can invite members");
    }

    // Find target user by email
    const targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (targetUsers.length === 0) {
      throw new ValidationError({
        email: [`No user found with email ${email}. They must sign up first.`],
      });
    }

    const targetUserId = targetUsers[0].id;

    // Check if already a member
    const existing = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ValidationError({ email: ["User is already a member of this workspace"] });
    }

    await db.insert(workspaceMembers).values({
      workspaceId,
      userId: targetUserId,
      role,
    });

    logger.info("Member invited", {
      action: "inviteMember",
      workspaceId,
      targetEmail: email,
      role,
    });

    revalidatePath("/dashboard");
    return createSuccessResult({ success: true });
  } catch (error) {
    logger.error("Failed to invite member", error as Error, { action: "inviteMember" });
    return createErrorResult(error);
  }
}

/**
 * Remove a member from a workspace
 * Cannot remove the workspace owner
 */
export async function removeMember(
  workspaceId: string,
  targetUserId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { userId } = await requireAuth();

    // Verify caller is admin
    const callerMembership = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1);

    if (callerMembership.length === 0 || callerMembership[0].role !== "admin") {
      throw new AuthError("Only workspace admins can remove members");
    }

    // Prevent removing the workspace owner
    const workspace = await db
      .select({ ownerId: workspaces.ownerId })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (workspace.length > 0 && workspace[0].ownerId === targetUserId) {
      throw new ValidationError({ member: ["Cannot remove the workspace owner"] });
    }

    await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId)
        )
      );

    revalidatePath("/dashboard");
    return createSuccessResult({ success: true });
  } catch (error) {
    logger.error("Failed to remove member", error as Error, { action: "removeMember" });
    return createErrorResult(error);
  }
}
