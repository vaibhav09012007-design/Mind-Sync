"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error">
            <svg
              className="h-8 w-8 text-error"
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
          <h2 className="text-2xl font-bold text-error">Something went wrong!</h2>
          <p className="text-center text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            className="mt-2 rounded-md bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 hover:shadow-gold-glow-sm active:scale-[0.98]"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
