import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@deepgram/sdk";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 requests per minute (generating tokens is sensitive)
    const rateLimit = await checkRateLimit(userId, "deepgram-token", 5, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": rateLimit.retryAfter.toString() }
        }
      );
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      logger.warn("DEEPGRAM_API_KEY missing, returning mock key", { action: "getDeepgramToken" });
      return NextResponse.json({ key: "mock-deepgram-key" });
    }

    const deepgram = createClient(apiKey);

    // 1. Get the project ID (needed to create scoped keys)
    const { result: projects, error: projectError } = await deepgram.manage.getProjects();
    
    if (projectError || !projects || projects.projects.length === 0) {
      logger.error("Failed to fetch Deepgram projects", projectError as any, { action: "getDeepgramToken" });
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const projectId = projects.projects[0].project_id;

    // 2. Generate a short-lived (60s) scoped key
    const { result: newKey, error: keyError } = await deepgram.manage.createProjectKey(projectId, {
      comment: `Temporary key for user ${userId}`,
      scopes: ["usage:write"],
      time_to_live_in_seconds: 60,
    });

    if (keyError || !newKey) {
      logger.error("Failed to create Deepgram temporary key", keyError as any, { action: "getDeepgramToken" });
      return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
    }

    logger.info("Generated temporary Deepgram key", { userId, action: "getDeepgramToken" });

    return NextResponse.json({ key: newKey.key });
  } catch (error) {
    logger.error("Deepgram Token Generation Error", error as Error, { action: "getDeepgramToken" });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
