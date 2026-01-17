"use client";

import { useState, useCallback } from "react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { cn } from "@/lib/utils";
import { Check, Trash2 } from "lucide-react";

interface SwipeableTaskProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function SwipeableTask({
  children,
  onComplete,
  onDelete,
  className,
}: SwipeableTaskProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSwipeLeft = useCallback(() => {
    if (onDelete) {
      setIsAnimating(true);
      setSwipeOffset(-100);
      setTimeout(() => {
        onDelete();
        setSwipeOffset(0);
        setIsAnimating(false);
      }, 200);
    }
  }, [onDelete]);

  const handleSwipeRight = useCallback(() => {
    if (onComplete) {
      setIsAnimating(true);
      setSwipeOffset(100);
      setTimeout(() => {
        onComplete();
        setSwipeOffset(0);
        setIsAnimating(false);
      }, 200);
    }
  }, [onComplete]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 60,
  });

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Background indicators */}
      <div className="absolute inset-0 flex">
        {/* Left side - Complete action */}
        <div className="flex flex-1 items-center justify-start bg-green-500/20 px-4">
          <Check className="h-5 w-5 text-green-500" />
          <span className="ml-2 text-sm font-medium text-green-500">Complete</span>
        </div>
        {/* Right side - Delete action */}
        <div className="flex flex-1 items-center justify-end bg-red-500/20 px-4">
          <span className="mr-2 text-sm font-medium text-red-500">Delete</span>
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
      </div>

      {/* Swipeable content */}
      <div
        {...swipeHandlers}
        className={cn(
          "relative z-10 bg-[var(--surface)] transition-transform",
          isAnimating && "duration-200 ease-out"
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
