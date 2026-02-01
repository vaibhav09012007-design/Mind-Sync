/**
 * Error Reporting Utility
 * Provides a centralized way to report errors to monitoring services
 */

import { isDevelopment } from "./env";

export interface ErrorContext {
  componentStack?: string;
  userId?: string;
  action?: string;
  path?: string;
  extra?: Record<string, unknown>;
  severity?: "info" | "warning" | "error" | "critical";
}

/**
 * Report an error to the monitoring service
 *
 * @param error - The error to report
 * @param context - Additional context about where/how the error occurred
 */
export function reportError(error: Error | unknown, context?: ErrorContext): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const severity = context?.severity || "error";

  // Structured log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: severity,
    message: errorObj.message,
    name: errorObj.name,
    stack: errorObj.stack,
    environment: process.env.NODE_ENV,
    ...context,
  };

  // Always log to console with appropriate level
  if (severity === "critical" || severity === "error") {
    console.error("[Error Report]", JSON.stringify(logEntry, null, 2));
  } else if (severity === "warning") {
    console.warn("[Warning Report]", JSON.stringify(logEntry, null, 2));
  } else {
    console.log("[Info Report]", JSON.stringify(logEntry, null, 2));
  }

  // In production, send to monitoring service
  if (!isDevelopment()) {
    // Sentry integration placeholder
    // Sentry.captureException(errorObj, {
    //   level: severity as any,
    //   extra: context?.extra,
    //   user: context?.userId ? { id: context.userId } : undefined,
    //   tags: {
    //     action: context?.action,
    //     path: context?.path,
    //   },
    // });
  }
}

/**
 * Report a warning (non-critical issue)
 */
export function reportWarning(message: string, context?: Omit<ErrorContext, "severity">): void {
  reportError(new Error(message), { ...context, severity: "warning" });
}

/**
 * Wrap an async function to automatically report errors
 */
export function withErrorReporting<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Omit<ErrorContext, "extra">
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(error, { ...context, extra: { args } });
      throw error;
    }
  }) as T;
}
