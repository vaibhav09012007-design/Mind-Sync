"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/error-reporting";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to error service
    reportError(error, {
      componentStack: "GlobalError",
      extra: { digest: error.digest }
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground antialiased font-sans">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 animate-pulse-glow">
            <svg
              className="h-10 w-10 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">System Malfunction</h1>
            <p className="text-muted-foreground">
              We've encountered a critical error. Our team has been notified.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border w-full text-left overflow-hidden">
            <code className="text-xs font-mono text-destructive block break-words">
              {error.message || "Unknown error occurred"}
            </code>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex gap-4 mt-2">
            <Button
              variant="default"
              size="lg"
              onClick={() => reset()}
              className="hover-lift"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = "/"}
            >
              Return Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
