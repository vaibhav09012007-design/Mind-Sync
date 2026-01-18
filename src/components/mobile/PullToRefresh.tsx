"use client";

/**
 * Pull to Refresh Component
 * Visual indicator for pull-to-refresh gesture
 */

import { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const { containerRef, isPulling, pullProgress, isRefreshing, pullDistance } =
    usePullToRefresh({
      onRefresh,
      disabled,
    });

  return (
    <div className={cn("relative h-full overflow-hidden", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center",
          "transition-all duration-200 ease-out"
        )}
        style={{
          top: pullDistance - 40,
          opacity: Math.min(pullProgress, 1),
        }}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-primary/10 backdrop-blur-sm border border-primary/20",
            isRefreshing && "animate-pulse"
          )}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <ArrowDown
              className={cn(
                "h-5 w-5 text-primary transition-transform duration-200",
                pullProgress >= 1 && "rotate-180"
              )}
            />
          )}
        </div>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className={cn(
          "h-full overflow-y-auto transition-transform duration-200",
          !isPulling && !isRefreshing && "duration-300"
        )}
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
