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
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
        <p className="mt-2 text-zinc-400">{error.message || "An unexpected error occurred"}</p>
        <button
          className="mt-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
