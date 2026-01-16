"use client";

/**
 * Enhanced Activity Heatmap
 * GitHub-style heatmap with improved tooltips showing detailed stats
 */

import { eachDayOfInterval, endOfYear, format, startOfYear, isSameDay, subDays } from "date-fns";
import { DailyActivity } from "@/lib/stats-calculator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnhancedActivityHeatmapProps {
  data: DailyActivity[];
}

export function EnhancedActivityHeatmap({ data }: EnhancedActivityHeatmapProps) {
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);

  const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Calculate average for context
  const avgTasks =
    data.length > 0 ? data.reduce((acc, d) => acc + d.tasksCompleted, 0) / data.length : 0;
  const avgFocus =
    data.length > 0 ? data.reduce((acc, d) => acc + d.focusMinutes, 0) / data.length : 0;

  const getActivity = (day: Date) => {
    return (
      data.find((d) => isSameDay(d.date, day)) || {
        date: day,
        tasksCompleted: 0,
        focusMinutes: 0,
      }
    );
  };

  const getIntensity = (day: Date) => {
    const activity = getActivity(day);
    const score = activity.tasksCompleted + activity.focusMinutes / 30;
    if (score === 0) return 0;
    if (score < 2) return 1;
    if (score < 4) return 2;
    if (score < 6) return 3;
    return 4;
  };

  const getColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-muted/20";
      case 1:
        return "bg-green-200 dark:bg-green-900/40";
      case 2:
        return "bg-green-400 dark:bg-green-700/60";
      case 3:
        return "bg-green-600 dark:bg-green-600/80";
      case 4:
        return "bg-green-800 dark:bg-green-500";
      default:
        return "bg-muted/20";
    }
  };

  const getComparisonText = (value: number, avg: number, unit: string) => {
    if (avg === 0) return "";
    const diff = ((value - avg) / avg) * 100;
    if (Math.abs(diff) < 5) return "Average";
    if (diff > 0) return `+${diff.toFixed(0)}% above avg`;
    return `${diff.toFixed(0)}% below avg`;
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      {/* Legend */}
      <div className="text-muted-foreground mb-4 flex items-center justify-end gap-2 text-xs">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`h-3 w-3 rounded-sm ${getColor(level)}`} />
        ))}
        <span>More</span>
      </div>

      <div className="flex min-w-max gap-1">
        {Array.from({ length: 53 }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const dayOfYearIndex = weekIndex * 7 + dayIndex;
              const day = days[dayOfYearIndex];
              if (!day || day > today) {
                return <div key={dayIndex} className="h-3 w-3" />;
              }

              const intensity = getIntensity(day);
              const activity = getActivity(day);

              return (
                <TooltipProvider key={day.toISOString()} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div
                        className={`h-3 w-3 rounded-sm ${getColor(intensity)} ring-ring cursor-pointer transition-all hover:ring-2`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="p-0">
                      <div className="bg-popover min-w-[180px] rounded-lg border p-3 text-sm shadow-lg">
                        <p className="text-foreground mb-2 font-bold">
                          {format(day, "EEEE, MMM d, yyyy")}
                        </p>

                        {activity.tasksCompleted === 0 && activity.focusMinutes === 0 ? (
                          <p className="text-muted-foreground">No activity</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Tasks:</span>
                              <span className="font-medium">
                                {activity.tasksCompleted}
                                <span className="text-muted-foreground ml-1 text-xs">
                                  {getComparisonText(activity.tasksCompleted, avgTasks, "tasks")}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Focus:</span>
                              <span className="font-medium">
                                {activity.focusMinutes} min
                                <span className="text-muted-foreground ml-1 text-xs">
                                  {getComparisonText(activity.focusMinutes, avgFocus, "min")}
                                </span>
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="border-t pt-2">
                              <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                                <span>Activity Level</span>
                                <span>{["None", "Low", "Medium", "High", "Peak"][intensity]}</span>
                              </div>
                              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                <div
                                  className={`h-full ${getColor(intensity)} transition-all`}
                                  style={{ width: `${(intensity / 4) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}
      </div>

      {/* Month labels */}
      <div className="text-muted-foreground mt-2 flex text-xs">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
          (month) => (
            <div key={month} className="flex-1 text-center">
              {month}
            </div>
          )
        )}
      </div>
    </div>
  );
}
