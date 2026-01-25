"use server";

/**
 * Shared utilities for server actions
 * Includes auth helpers and user sync
 */

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  AuthError,
  ValidationError,
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { reportError } from "@/lib/error-reporting";

// --- Helper: Auth Check ---
export async function requireAuth() {
  const { userId, getToken } = await auth();
  if (!userId) throw new AuthError();
  return { userId, getToken };
}

// --- User Sync ---
/**
 * Sync user to database, creating if not exists.
 * Returns the user ID on success, null if not authenticated.
 * Throws on database errors to prevent silent failures.
 */
export async function syncUser(): Promise<ActionResult<string | null>> {
  try {
    const user = await currentUser();
    if (!user) return createSuccessResult(null);

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      const error = new ValidationError({ email: ["User has no email address"] });
      reportError(error, { 
        action: "sync_user", 
        extra: { userId: user.id, emailAddresses: user.emailAddresses.length } 
      });
      return createErrorResult(error);
    }

    // Use upsert pattern to handle race conditions
    const existingUser = await db.select().from(users).where(eq(users.id, user.id));

    if (existingUser.length === 0) {
      try {
        await db.insert(users).values({
          id: user.id,
          email: email,
          preferences: { theme: "system" },
        });
        console.log("[syncUser] Created new user:", user.id);
      } catch (insertError: unknown) {
        // Handle race condition: another request may have created the user
        if (typeof insertError === 'object' && insertError !== null && 'code' in insertError) {
          const pgError = insertError as { code: string };
          if (pgError.code === "23505") {
            // Unique violation - user was created by another request
            console.log("[syncUser] User already exists (race condition handled):", user.id);
          } else {
            reportError(insertError as unknown as Error, { 
              action: "sync_user_insert", 
              extra: { userId: user.id, pgErrorCode: pgError.code } 
            });
            throw insertError;
          }
        } else {
          reportError(insertError as unknown as Error, { 
            action: "sync_user_insert", 
            extra: { userId: user.id } 
          });
          throw insertError;
        }
      }
    }

    return createSuccessResult(user.id);
  } catch (error) {
    console.error("[syncUser] Critical error:", error);
    reportError(error as Error, { action: "sync_user" });
    return createErrorResult(error);
  }
}

/**
 * Ensure user exists in database before performing operations.
 * Throws AuthError if user creation fails.
 */
export async function ensureUserExists(userId: string): Promise<void> {
  const result = await syncUser();
  if (!result.success) {
    throw new AuthError("Failed to sync user to database");
  }
}
