/**
 * In-memory rate limiter for AI endpoints
 * Uses sliding window algorithm
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on server restart - use Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

/**
 * Check if a user has exceeded their rate limit for a specific action
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
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // Create new entry or reset if window has passed
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > maxRequests) {
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
}

/**
 * Clear rate limit for a user (useful for testing)
 */
export function clearRateLimit(userId: string, action: string): void {
  const key = `${userId}:${action}`;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  userId: string,
  action: string,
  maxRequests: number = 10
): RateLimitResult {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      remaining: maxRequests,
      retryAfter: 0,
    };
  }

  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: entry.count < maxRequests,
    remaining,
    retryAfter: entry.count >= maxRequests ? retryAfter : 0,
  };
}
