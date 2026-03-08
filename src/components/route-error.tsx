"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/error-reporting";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RouteError({
  error,
  reset,
  context,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}) {
  useEffect(() => {
    reportError(error, {
      componentStack: context || "RouteError",
      extra: { digest: error.digest },
    });
  }, [error, context]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || "An unexpected error occurred."}
        </p>
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
