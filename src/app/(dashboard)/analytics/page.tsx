"use client";

import dynamic from "next/dynamic";
import { PageLoadingSkeleton } from "@/components/ui/skeleton";

// Dynamic import for heavy Analytics component with loading skeleton
const ProductivityDashboard = dynamic(() => import("@/components/productivity-dashboard"), {
  loading: () => <PageLoadingSkeleton />,
  ssr: false,
});

export default function AnalyticsPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <ProductivityDashboard />
    </div>
  );
}
