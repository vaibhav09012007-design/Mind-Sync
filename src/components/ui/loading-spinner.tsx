import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={cn("h-8 w-8 animate-spin text-purple-600 dark:text-purple-400", className)} />
    </div>
  );
}
