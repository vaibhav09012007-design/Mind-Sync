import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 10 requests per minute per user (generous for session initiation)
    const rateLimit = await checkRateLimit(userId, "deepgram-token", 10, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": rateLimit.retryAfter.toString() }
        }
      );
    }

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    if (!deepgramApiKey) {
      // Return a mock key for testing UI components without crashing
      logger.warn("DEEPGRAM_API_KEY missing, returning mock key", { action: "getDeepgramToken" });
      return NextResponse.json({ key: "mock-deepgram-key" });
    }

    // In a real production environment, you should generate a temporary scoped key
    // or proxy the websocket connection. For this implementation, we ensure
    // the user is authenticated and rate-limited before providing the key.

    return NextResponse.json({ key: deepgramApiKey });
  } catch (error) {
    logger.error("Deepgram API Error", error as Error, { action: "getDeepgramToken" });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
