import { NextResponse } from "next/server";
import { cleanupExpiredRateLimits } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

/**
 * Cron-callable endpoint to clean up expired rate limit entries.
 * Protected by a secret key header to prevent unauthorized access.
 *
 * Usage: GET /api/cleanup-rate-limits
 * Header: x-cron-secret: <CRON_SECRET>
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("x-cron-secret");

  if (!cronSecret || authHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cleaned = await cleanupExpiredRateLimits();
    logger.info("Rate limit cleanup completed", {
      action: "cleanup-rate-limits",
      cleaned,
    });
    return NextResponse.json({ success: true, cleaned });
  } catch (error) {
    logger.error("Rate limit cleanup failed", error as Error, {
      action: "cleanup-rate-limits",
    });
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
