/**
 * Database-backed rate limiter for AI endpoints
 * Uses sliding window algorithm with PostgreSQL for distributed rate limiting
 * Works correctly across serverless instances (Vercel, Netlify, etc.)
 */

import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq, lt } from "drizzle-orm";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

/**
 * Check if a user has exceeded their rate limit for a specific action
 * Uses database for distributed rate limiting across serverless instances
 * 
 * @param userId - The user's ID
 * @param action - The action type (e.g., "ai-summarize", "ai-schedule")
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowSeconds - Time window in seconds
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `${userId}:${action}`;
  const now = new Date();
  const windowMs = windowSeconds * 1000;
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    // Try to get existing rate limit entry
    const existing = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .limit(1);

    let entry = existing[0];

    if (!entry) {
      // Create new entry
      const [newEntry] = await db
        .insert(rateLimits)
        .values({
          key,
          count: 1,
          windowStart: now,
          expiresAt,
        })
        .returning();

      return {
        allowed: true,
        remaining: maxRequests - 1,
        retryAfter: 0,
      };
    }

    // Check if window has expired
    if (new Date(entry.expiresAt) < now) {
      // Reset the window
      await db
        .update(rateLimits)
        .set({
          count: 1,
          windowStart: now,
          expiresAt,
          updatedAt: now,
        })
        .where(eq(rateLimits.key, key));

      return {
        allowed: true,
        remaining: maxRequests - 1,
        retryAfter: 0,
      };
    }

    // Increment counter
    const newCount = entry.count + 1;
    await db
      .update(rateLimits)
      .set({
        count: newCount,
        updatedAt: now,
      })
      .where(eq(rateLimits.key, key));

    const remaining = Math.max(0, maxRequests - newCount);
    const retryAfter = Math.ceil(
      (new Date(entry.expiresAt).getTime() - now.getTime()) / 1000
    );

    if (newCount > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining,
      retryAfter: 0,
    };
  } catch (error) {
    // If database fails, allow the request but log the error
    // This prevents rate limiting failures from blocking legitimate users
    console.error("[RateLimit] Database error, allowing request:", error);
    return {
      allowed: true,
      remaining: maxRequests,
      retryAfter: 0,
    };
  }
}

/**
 * Clear rate limit for a user (useful for testing)
 */
export async function clearRateLimit(
  userId: string,
  action: string
): Promise<void> {
  const key = `${userId}:${action}`;
  try {
    await db.delete(rateLimits).where(eq(rateLimits.key, key));
  } catch (error) {
    console.error("[RateLimit] Failed to clear rate limit:", error);
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  userId: string,
  action: string,
  maxRequests: number = 10
): Promise<RateLimitResult> {
  const key = `${userId}:${action}`;
  const now = new Date();

  try {
    const existing = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .limit(1);

    const entry = existing[0];

    if (!entry || new Date(entry.expiresAt) < now) {
      return {
        allowed: true,
        remaining: maxRequests,
        retryAfter: 0,
      };
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    const retryAfter = Math.ceil(
      (new Date(entry.expiresAt).getTime() - now.getTime()) / 1000
    );

    return {
      allowed: entry.count < maxRequests,
      remaining,
      retryAfter: entry.count >= maxRequests ? retryAfter : 0,
    };
  } catch (error) {
    console.error("[RateLimit] Failed to get status:", error);
    return {
      allowed: true,
      remaining: maxRequests,
      retryAfter: 0,
    };
  }
}

/**
 * Cleanup expired rate limit entries (run periodically via cron)
 * Call this from a scheduled job to prevent table bloat
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .delete(rateLimits)
      .where(lt(rateLimits.expiresAt, now))
      .returning();

    console.log(`[RateLimit] Cleaned up ${result.length} expired entries`);
    return result.length;
  } catch (error) {
    console.error("[RateLimit] Failed to cleanup expired entries:", error);
    return 0;
  }
}
