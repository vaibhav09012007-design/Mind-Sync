"use client";

/**
 * Stat Card with Trend Component
 * Reusable stat card with trend indicator
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardWithTrendProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number; // Percentage change
  icon?: LucideIcon;
  className?: string;
  description?: string;
}

export function StatCardWithTrend({
  title,
  value,
  unit,
  trend,
  icon: Icon,
  className,
  description,
}: StatCardWithTrendProps) {
  const hasTrend = trend !== undefined && Math.abs(trend) >= 1;
  const TrendIcon = trend && trend > 1 ? TrendingUp : trend && trend < -1 ? TrendingDown : Minus;
  const trendColor =
    trend && trend > 1
      ? "text-green-500"
      : trend && trend < -1
        ? "text-red-500"
        : "text-muted-foreground";

  const formatTrend = (t: number) => {
    const sign = t > 0 ? "+" : "";
    return `${sign}${t.toFixed(0)}%`;
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
          {hasTrend && (
            <span className={cn("flex items-center gap-0.5 text-sm", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {formatTrend(trend!)}
            </span>
          )}
        </div>
        {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
      </CardContent>
    </Card>
  );
}
