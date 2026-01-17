"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-success";
    if (trend.value < 0) return "text-danger";
    return "text-muted-foreground";
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "border-primary/20 hover:border-primary/40";
      case "success":
        return "border-success/20 hover:border-success/40";
      case "warning":
        return "border-warning/20 hover:border-warning/40";
      case "danger":
        return "border-danger/20 hover:border-danger/40";
      default:
        return "";
    }
  };

  const getIconBgStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "success":
        return "bg-success/10 text-success";
      case "warning":
        return "bg-warning/10 text-warning";
      case "danger":
        return "bg-danger/10 text-danger";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card
      className={cn(
        "card-hover card-interactive relative overflow-hidden p-5",
        getVariantStyles(),
        className
      )}
    >
      {/* Background gradient accent */}
      {variant !== "default" && (
        <div
          className={cn(
            "absolute inset-0 opacity-5",
            variant === "primary" && "from-primary bg-gradient-to-br to-transparent",
            variant === "success" && "from-success bg-gradient-to-br to-transparent",
            variant === "warning" && "from-warning bg-gradient-to-br to-transparent",
            variant === "danger" && "from-danger bg-gradient-to-br to-transparent"
          )}
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Title */}
          <p className="text-muted-foreground text-sm font-medium">{title}</p>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold tracking-tight">{value}</span>

            {/* Trend indicator */}
            {trend && TrendIcon && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(trend.value)}%</span>
                {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
              </div>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              "icon-bounce flex h-10 w-10 items-center justify-center rounded-lg",
              getIconBgStyles()
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Mini sparkline placeholder area */}
      <div className="absolute right-0 bottom-0 left-0 h-8 opacity-20">
        <svg className="h-full w-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path
            d="M0,25 Q10,20 20,22 T40,15 T60,18 T80,10 T100,15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn(
              variant === "primary" && "stroke-primary",
              variant === "success" && "stroke-success",
              variant === "warning" && "stroke-warning",
              variant === "danger" && "stroke-danger",
              variant === "default" && "stroke-muted-foreground"
            )}
          />
        </svg>
      </div>
    </Card>
  );
}

export default StatCard;
