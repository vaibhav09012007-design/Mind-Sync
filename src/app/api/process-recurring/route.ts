import { NextResponse } from "next/server";
import { processRecurringTasks } from "@/actions/tasks";
import { logger } from "@/lib/logger";

/**
 * Cron-callable endpoint to process recurring tasks.
 * Generates task instances for the next 7 days.
 * Protected by CRON_SECRET header.
 *
 * Usage: GET /api/process-recurring
 * Header: x-cron-secret: <CRON_SECRET>
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("x-cron-secret");

  if (!cronSecret || authHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processRecurringTasks();
    logger.info("Recurring task processing completed", {
      action: "process-recurring-cron",
      result,
    });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Recurring task processing failed", error as Error, {
      action: "process-recurring-cron",
    });
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
