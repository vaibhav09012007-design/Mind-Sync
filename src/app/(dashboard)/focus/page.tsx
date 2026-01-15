"use client";

import dynamic from "next/dynamic";
import { FocusSidebar } from "@/components/focus/focus-sidebar";
import { FocusTimerSkeleton } from "@/components/ui/skeleton";

// Dynamic import for Focus Timer with loading skeleton
const FocusTimer = dynamic(
  () => import("@/components/focus-timer").then((mod) => ({ default: mod.FocusTimer })),
  {
    loading: () => <FocusTimerSkeleton />,
    ssr: false,
  }
);

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
