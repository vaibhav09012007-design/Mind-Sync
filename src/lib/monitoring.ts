/**
 * Monitoring utilities for MindSync
 * Health checks, metrics, and observability
 */

import { db } from "@/db";
import { sql } from "drizzle-orm";

export interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
  timestamp: string;
}

export interface HealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheck[];
  timestamp: string;
  version: string;
  uptime: number;
}

// Track application start time
const startTime = Date.now();

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const name = "database";
  const timestamp = new Date().toISOString();
  const start = Date.now();

  try {
    await db.execute(sql`SELECT 1`);
    return {
      name,
      status: "healthy",
      latency: Date.now() - start,
      timestamp,
    };
  } catch (error) {
    return {
      name,
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp,
    };
  }
}

/**
 * Check external API connectivity (Gemini)
 */
async function checkGeminiAPI(): Promise<HealthCheck> {
  const name = "gemini_api";
  const timestamp = new Date().toISOString();
  const start = Date.now();

  try {
    const hasKey = !!process.env.GEMINI_API_KEY;
    if (!hasKey) {
      return {
        name,
        status: "degraded",
        message: "API key not configured",
        timestamp,
      };
    }

    // Don't actually call the API in health checks to save quota
    return {
      name,
      status: "healthy",
      latency: Date.now() - start,
      message: "API key configured",
      timestamp,
    };
  } catch (error) {
    return {
      name,
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp,
    };
  }
}

/**
 * Check Clerk authentication service
 */
async function checkAuth(): Promise<HealthCheck> {
  const name = "auth";
  const timestamp = new Date().toISOString();

  try {
    const hasKey = !!process.env.CLERK_SECRET_KEY;
    return {
      name,
      status: hasKey ? "healthy" : "degraded",
      message: hasKey ? "Clerk configured" : "Clerk not configured",
      timestamp,
    };
  } catch (error) {
    return {
      name,
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const name = "memory";
  const timestamp = new Date().toISOString();

  if (typeof process !== "undefined" && process.memoryUsage) {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      name,
      status: usagePercent > 90 ? "degraded" : "healthy",
      message: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
      timestamp,
    };
  }

  return {
    name,
    status: "healthy",
    message: "Memory check not available",
    timestamp,
  };
}

/**
 * Run all health checks and generate report
 */
export async function runHealthChecks(): Promise<HealthReport> {
  const checks = await Promise.all([
    checkDatabase(),
    checkGeminiAPI(),
    checkAuth(),
    Promise.resolve(checkMemory()),
  ]);

  // Determine overall status
  const hasUnhealthy = checks.some((c) => c.status === "unhealthy");
  const hasDegraded = checks.some((c) => c.status === "degraded");

  const status: HealthReport["status"] = hasUnhealthy
    ? "unhealthy"
    : hasDegraded
      ? "degraded"
      : "healthy";

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
}

/**
 * Simple metrics collector
 */
class MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  recordHistogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
    this.histograms.set(name, values);
  }

  getCounters(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }

  getGauges(): Record<string, number> {
    return Object.fromEntries(this.gauges);
  }

  getHistogramStats(name: string): { min: number; max: number; avg: number; p95: number } | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p95: sorted[p95Index],
    };
  }

  getAllMetrics(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, { min: number; max: number; avg: number; p95: number } | null>;
  } {
    const histograms: Record<string, { min: number; max: number; avg: number; p95: number } | null> = {};
    for (const name of this.histograms.keys()) {
      histograms[name] = this.getHistogramStats(name);
    }

    return {
      counters: this.getCounters(),
      gauges: this.getGauges(),
      histograms,
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// Export singleton metrics collector
export const metrics = new MetricsCollector();
