import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: "ok" | "error"; latency?: number; error?: string };
    environment: { status: "ok" | "error"; missing?: string[] };
  };
}

/**
 * Health check endpoint for monitoring and deployment verification
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      database: { status: "ok" },
      environment: { status: "ok" },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    health.checks.database.latency = Date.now() - dbStart;
  } catch (error) {
    health.checks.database.status = "error";
    health.checks.database.error = error instanceof Error ? error.message : "Unknown error";
    health.status = "unhealthy";
  }

  // Check required environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingEnvVars.length > 0) {
    health.checks.environment.status = "error";
    health.checks.environment.missing = missingEnvVars;
    health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
  }

  // Optional env vars (warn if missing but don't fail)
  const optionalEnvVars = ["GEMINI_API_KEY"];
  const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);
  if (missingOptional.length > 0 && health.status === "healthy") {
    health.status = "degraded";
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
