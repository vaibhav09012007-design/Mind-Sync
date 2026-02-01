import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      <Loader2 className={cn("h-8 w-8 animate-spin text-primary", className)} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
