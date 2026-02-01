"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: "default" | "minimal" | "illustrated" | "glass";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = "default",
}: EmptyStateProps) {
  const Content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant !== "glass" && "p-8",
        variant === "illustrated" && "py-16",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon Container */}
      <div className={cn("relative mb-6", variant === "illustrated" && "mb-8")}>
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl",
            "bg-muted",
            variant === "glass" && "bg-primary/10 dark:bg-primary/20",
            variant === "default" && "h-16 w-16",
            variant === "minimal" && "h-12 w-12",
            variant === "illustrated" && "h-24 w-24",
            variant === "glass" && "h-20 w-20"
          )}
        >
          <Icon
            className={cn(
              "text-primary",
              variant === "glass" && "text-primary",
              variant === "default" && "h-8 w-8",
              variant === "minimal" && "h-6 w-6",
              variant === "illustrated" && "h-12 w-12",
              variant === "glass" && "h-10 w-10"
            )}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-sm space-y-2">
        <h3
          className={cn(
            "text-foreground font-semibold",
            (variant === "illustrated" || variant === "glass") ? "text-xl" : "text-lg"
          )}
        >
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6"
          variant={variant === "glass" ? "gradient" : "default"}
          size={variant === "illustrated" ? "lg" : "default"}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "glass") {
    return (
      <GlassCard className={cn("flex items-center justify-center p-12", className)} hover="none">
        {Content}
      </GlassCard>
    );
  }

  return Content;
}

export default EmptyState;
