"use client";

import dynamic from "next/dynamic";
import { FocusSidebar } from "@/components/focus/focus-sidebar";
import { FocusTimerSkeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListChecks } from "lucide-react";

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
    <div className="flex h-full flex-col gap-4 overflow-hidden lg:flex-row lg:gap-6">
      {/* Main Timer Area */}
      <GlassCard className="relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl border-white/10 shadow-2xl bg-black/5 dark:bg-white/5" hover="none">
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center p-4 md:p-6">
          <FocusTimer />
          
          {/* Mobile Sidebar Trigger (Drawer) */}
          <div className="mt-8 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full bg-white/5 backdrop-blur-md border-white/10 px-6">
                  <ListChecks className="mr-2 h-4 w-4" />
                  Goals & Stats
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] p-0 border-white/10 bg-background/80 backdrop-blur-xl">
                <div className="h-full overflow-hidden">
                  <FocusSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </GlassCard>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden w-80 flex-shrink-0 lg:block h-full">
        <GlassCard className="h-full p-0 overflow-hidden bg-background/40 backdrop-blur-md" hover="none">
           <FocusSidebar />
        </GlassCard>
      </div>
    </div>
  );
}
