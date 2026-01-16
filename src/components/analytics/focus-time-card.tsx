"use client";

/**
 * Focus Time Stats Card
 * Shows focus time metrics with trends
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DailyActivity } from "@/lib/stats-calculator";
import { format } from "date-fns";

interface FocusTimeCardProps {
  data: DailyActivity[];
  previousPeriodData?: DailyActivity[];
}

export function FocusTimeCard({ data, previousPeriodData }: FocusTimeCardProps) {
  const stats = useMemo(() => {
    const totalMinutes = data.reduce((acc, d) => acc + d.focusMinutes, 0);
    const totalHours = totalMinutes / 60;
    const avgDailyMinutes = data.length > 0 ? totalMinutes / data.length : 0;

    // Calculate best hour (for now, group by hour of activity if we had that data)
    // Since we don't track hour-level data, we'll show peak day instead
    const peakDay = data.reduce(
      (max, d) => (d.focusMinutes > max.minutes ? { day: d.date, minutes: d.focusMinutes } : max),
      { day: new Date(), minutes: 0 }
    );

    // Calculate trend vs previous period
    let trend = 0;
    if (previousPeriodData && previousPeriodData.length > 0) {
      const prevTotal = previousPeriodData.reduce((acc, d) => acc + d.focusMinutes, 0);
      if (prevTotal > 0) {
        trend = ((totalMinutes - prevTotal) / prevTotal) * 100;
      }
    }

    return {
      totalHours,
      avgDailyMinutes,
      peakDay,
      trend,
    };
  }, [data, previousPeriodData]);

  const formatTrend = (trend: number) => {
    if (Math.abs(trend) < 1) return null;
    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend.toFixed(0)}%`;
  };

  const TrendIcon = stats.trend > 1 ? TrendingUp : stats.trend < -1 ? TrendingDown : Minus;
  const trendColor =
    stats.trend > 1
      ? "text-green-500"
      : stats.trend < -1
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          Focus Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.totalHours.toFixed(1)}</span>
          <span className="text-muted-foreground">hours</span>
          {formatTrend(stats.trend) && (
            <span className={`flex items-center gap-0.5 text-sm ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {formatTrend(stats.trend)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Avg Daily</p>
            <p className="font-medium">{stats.avgDailyMinutes.toFixed(0)} min</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peak Day</p>
            <p className="font-medium">
              {stats.peakDay.minutes > 0
                ? `${format(stats.peakDay.day, "MMM d")} (${stats.peakDay.minutes}m)`
                : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
