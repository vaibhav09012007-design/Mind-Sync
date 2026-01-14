import {
  eachDayOfInterval,
  endOfYear,
  format,
  getDay,
  startOfYear,
  subYears,
  isSameDay,
} from "date-fns";
import { DailyActivity } from "@/lib/stats-calculator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityHeatmapProps {
  data: DailyActivity[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const today = new Date();
  const yearStart = startOfYear(subYears(today, 0)); // Current year (or use subYears(today, 1) for last 365 days)
  const yearEnd = endOfYear(today);

  // Create an array of all days in the year
  const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Helper to get intensity
  const getIntensity = (day: Date) => {
    const activity = data.find((d) => isSameDay(d.date, day));
    if (!activity) return 0;
    // Simple heuristic: 1 task or 30 mins = level 1, increasing from there
    const score = activity.tasksCompleted + activity.focusMinutes / 30;
    if (score === 0) return 0;
    if (score < 2) return 1; // Low
    if (score < 4) return 2; // Medium
    if (score < 6) return 3; // High
    return 4; // Very High
  };

  const getColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-muted/20"; // Empty
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

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max gap-1">
        {/* We need to group by weeks for the typical column layout */}
        {Array.from({ length: 53 }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const dayOfYearIndex = weekIndex * 7 + dayIndex;
              const day = days[dayOfYearIndex];
              if (!day || day > today) return <div key={dayIndex} className="h-3 w-3" />; // Spacer for future/invalid

              const intensity = getIntensity(day);

              return (
                <TooltipProvider key={day.toISOString()}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div
                        className={`h-3 w-3 rounded-sm ${getColor(intensity)} ring-ring hover:ring-1`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-semibold">{format(day, "MMM d, yyyy")}</p>
                        <p>{intensity === 0 ? "No activity" : "Active"}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
