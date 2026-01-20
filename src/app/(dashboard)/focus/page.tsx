"use client";

import dynamic from "next/dynamic";
import { FocusSidebar } from "@/components/focus/focus-sidebar";
import { FocusTimerSkeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/card";

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
    <div className="flex h-full gap-6 p-4 md:p-6 overflow-hidden">
      {/* Main Timer Area */}
      <GlassCard className="relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl border-white/10 shadow-2xl bg-black/5 dark:bg-white/5" hover="none">
        <div className="relative z-10 w-full max-w-2xl p-6">
          <FocusTimer />
        </div>
      </GlassCard>

      {/* Sidebar - Hidden on mobile */}
      <div className="hidden w-80 flex-shrink-0 lg:block h-full">
        <GlassCard className="h-full p-0 overflow-hidden bg-background/40 backdrop-blur-md" hover="none">
           <FocusSidebar />
        </GlassCard>
      </div>
    </div>
  );
}
