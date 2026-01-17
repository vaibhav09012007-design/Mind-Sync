"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: "default" | "minimal" | "illustrated";
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
  return (
    <div
      className={cn(
        "animate-fadeIn flex flex-col items-center justify-center p-8 text-center",
        variant === "illustrated" && "py-16",
        className
      )}
    >
      {/* Animated Icon Container */}
      <div className={cn("relative mb-6", variant === "illustrated" && "mb-8")}>
        {/* Glow background */}
        <div className="bg-primary/10 animate-pulse-glow absolute inset-0 rounded-full blur-2xl" />

        {/* Icon wrapper */}
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl",
            "from-surface-elevated to-surface bg-gradient-to-br",
            "border-border/50 border",
            variant === "default" && "h-16 w-16",
            variant === "minimal" && "h-12 w-12",
            variant === "illustrated" && "h-24 w-24",
            "animate-float"
          )}
        >
          <Icon
            className={cn(
              "text-primary",
              variant === "default" && "h-8 w-8",
              variant === "minimal" && "h-6 w-6",
              variant === "illustrated" && "h-12 w-12"
            )}
          />
        </div>

        {/* Decorative dots */}
        {variant === "illustrated" && (
          <>
            <div className="bg-primary/30 absolute -top-2 -right-2 h-3 w-3 animate-pulse rounded-full" />
            <div
              className="bg-primary/20 absolute -bottom-1 -left-3 h-2 w-2 animate-pulse rounded-full"
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className="bg-primary/40 absolute top-1/2 -right-4 h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ animationDelay: "1s" }}
            />
          </>
        )}
      </div>

      {/* Content */}
      <div className="max-w-sm space-y-2">
        <h3
          className={cn(
            "text-foreground font-semibold",
            variant === "illustrated" ? "text-xl" : "text-lg"
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
          className="btn-press mt-6"
          size={variant === "illustrated" ? "lg" : "default"}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
