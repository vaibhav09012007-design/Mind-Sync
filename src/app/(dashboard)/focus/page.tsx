"use client";

import { FocusTimer } from "@/components/focus-timer";

export default function FocusPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <FocusTimer />
      </div>
    </div>
  );
}
