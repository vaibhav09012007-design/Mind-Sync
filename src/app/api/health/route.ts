import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: "ok" | "error"; latency?: number; error?: string };
    environment: { status: "ok" | "error"; missing?: string[] };
    memory: { heapUsedMB: number; heapTotalMB: number; rssMA: number };
  };
}

const startupTime = Date.now();

/**
 * Enhanced health check endpoint for monitoring and deployment verification.
 * Reports DB latency, memory usage, uptime, and env var status.
 * GET /api/health
 */
export async function GET() {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.round((Date.now() - startupTime) / 1000),
    checks: {
      database: { status: "ok" },
      environment: { status: "ok" },
      memory: { heapUsedMB: 0, heapTotalMB: 0, rssMA: 0 },
    },
  };

  // Check database connection with latency measurement
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - dbStart;
    health.checks.database.latency = latency;

    // Warn if latency is high
    if (latency > 1000) {
      health.status = "degraded";
    }
  } catch (error) {
    health.checks.database.status = "error";
    health.checks.database.error = error instanceof Error ? error.message : "Unknown error";
    health.status = "unhealthy";
  }

  // Memory usage (Node.js only, will be 0 on edge)
  if (typeof process !== "undefined" && process.memoryUsage) {
    try {
      const mem = process.memoryUsage();
      health.checks.memory = {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMA: Math.round(mem.rss / 1024 / 1024),
      };
    } catch {
      // Edge runtime doesn't support memoryUsage
    }
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
  const optionalEnvVars = ["GEMINI_API_KEY", "CRON_SECRET"];
  const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);
  if (missingOptional.length > 0 && health.status === "healthy") {
    health.status = "degraded";
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
