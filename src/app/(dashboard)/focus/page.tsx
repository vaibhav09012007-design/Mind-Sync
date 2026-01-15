"use client";

import { FocusTimer } from "@/components/focus-timer";
import { FocusSidebar } from "@/components/focus/focus-sidebar";

export default function FocusPage() {
  return (
    <div className="flex h-full gap-6 p-4 md:p-8">
      {/* Main Timer Area */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl">
          <FocusTimer />
        </div>
      </div>

      {/* Sidebar - Hidden on mobile */}
      <div className="hidden w-80 flex-shrink-0 lg:block">
        <FocusSidebar />
      </div>
    </div>
  );
}
