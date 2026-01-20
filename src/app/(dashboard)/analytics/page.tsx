"use client";

import dynamic from "next/dynamic";
import { PageLoadingSkeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/card";

// Dynamic import for heavy Analytics component with loading skeleton
const ProductivityDashboard = dynamic(() => import("@/components/productivity-dashboard"), {
  loading: () => <PageLoadingSkeleton />,
  ssr: false,
});

export default function AnalyticsPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <GlassCard className="min-h-full p-6" hover="none">
        <div className="flex flex-col gap-1 mb-8">
            <h1 className="text-3xl font-bold tracking-tight gradient-text w-fit">
              Analytics
            </h1>
            <p className="text-muted-foreground text-lg">Track your productivity trends and focus metrics.</p>
        </div>
        <ProductivityDashboard />
      </GlassCard>
    </div>
  );
}
