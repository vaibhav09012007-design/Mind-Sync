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
    if (trend.value > 0) return "text-green-600";
    if (trend.value < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getIconBgStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "success":
        return "bg-green-600/10 text-green-600";
      case "warning":
        return "bg-yellow-600/10 text-yellow-600";
      case "danger":
        return "bg-red-600/10 text-red-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5",
        className
      )}
    >
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
              "flex h-10 w-10 items-center justify-center rounded-lg",
              getIconBgStyles()
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
