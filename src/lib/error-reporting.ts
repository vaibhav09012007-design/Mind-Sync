/**
 * Error Reporting Utility
 * Provides a centralized way to report errors to monitoring services
 * 
 * Currently logs to console. To integrate with Sentry or another service:
 * 1. Install the SDK: npm install @sentry/nextjs
 * 2. Initialize in instrumentation.ts
 * 3. Replace the reportError implementation below
 */

import { isDevelopment } from "./env";

export interface ErrorContext {
  componentStack?: string;
  userId?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

/**
 * Report an error to the monitoring service
 * 
 * @param error - The error to report
 * @param context - Additional context about where/how the error occurred
 */
export function reportError(error: Error, context?: ErrorContext): void {
  // Always log to console in development
  console.error("[Error Report]", {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // In production, send to monitoring service
  if (!isDevelopment()) {
    // Sentry integration example (uncomment after installing @sentry/nextjs):
    // Sentry.captureException(error, {
    //   extra: context?.extra,
    //   user: context?.userId ? { id: context.userId } : undefined,
    //   tags: {
    //     action: context?.action,
    //   },
    // });

    // For now, we'll use a simple fetch to a logging endpoint
    // Replace this with your preferred monitoring service
    sendToLoggingEndpoint(error, context);
  }
}

/**
 * Report a warning (non-critical issue)
 */
export function reportWarning(message: string, context?: ErrorContext): void {
  console.warn("[Warning]", message, context);

  if (!isDevelopment()) {
    // Sentry.captureMessage(message, { level: 'warning', extra: context });
  }
}

/**
 * Simple logging endpoint (placeholder)
 * Replace with your actual monitoring service integration
 */
async function sendToLoggingEndpoint(
  error: Error,
  context?: ErrorContext
): Promise<void> {
  try {
    // Example: Send to a logging API endpoint
    // This is a placeholder - implement based on your monitoring setup
    const logData = {
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 10).join("\n"), // Limit stack trace
      url: typeof window !== "undefined" ? window.location.href : "server",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
      ...context,
    };

    // Uncomment and configure when you have a logging endpoint:
    // await fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logData),
    // });

    // For now, just log that we would have reported
    console.log("[Error Reporting] Would send to monitoring service:", logData);
  } catch (reportingError) {
    // Never throw from error reporting
    console.error("[Error Reporting] Failed to report error:", reportingError);
  }
}

/**
 * Wrap an async function to automatically report errors
 */
export function withErrorReporting<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Omit<ErrorContext, "extra">
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        reportError(error, { ...context, extra: { args } });
      }
      throw error;
    }
  }) as T;
}
