"use client";

/**
 * Productivity Score Component
 * Composite score based on tasks, focus, streak, and goals
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DailyActivity } from "@/lib/stats-calculator";

interface ProductivityScoreProps {
  data: DailyActivity[];
  previousPeriodData?: DailyActivity[];
  streak: number;
  totalTasks: number;
  goalsProgress?: number; // 0-100
}

export function ProductivityScore({
  data,
  previousPeriodData,
  streak,
  totalTasks,
  goalsProgress = 50,
}: ProductivityScoreProps) {
  const score = useMemo(() => {
    // Weights
    const TASK_WEIGHT = 0.4;
    const FOCUS_WEIGHT = 0.3;
    const STREAK_WEIGHT = 0.2;
    const GOALS_WEIGHT = 0.1;

    // Task completion score (target: 5 tasks/day average)
    const avgTasksPerDay = data.length > 0 ? totalTasks / data.length : 0;
    const taskScore = Math.min(100, (avgTasksPerDay / 5) * 100);

    // Focus score (target: 120 min/day average)
    const totalFocus = data.reduce((acc, d) => acc + d.focusMinutes, 0);
    const avgFocusPerDay = data.length > 0 ? totalFocus / data.length : 0;
    const focusScore = Math.min(100, (avgFocusPerDay / 120) * 100);

    // Streak score (target: 7+ days)
    const streakScore = Math.min(100, (streak / 7) * 100);

    // Goals score (already 0-100)
    const goalsScore = goalsProgress;

    // Weighted total
    const total =
      taskScore * TASK_WEIGHT +
      focusScore * FOCUS_WEIGHT +
      streakScore * STREAK_WEIGHT +
      goalsScore * GOALS_WEIGHT;

    return Math.round(total);
  }, [data, streak, totalTasks, goalsProgress]);

  // Calculate previous period score for trend
  const previousScore = useMemo(() => {
    if (!previousPeriodData || previousPeriodData.length === 0) return null;

    const prevTasks = previousPeriodData.reduce((acc, d) => acc + d.tasksCompleted, 0);
    const avgTasksPerDay = prevTasks / previousPeriodData.length;
    const taskScore = Math.min(100, (avgTasksPerDay / 5) * 100);

    const totalFocus = previousPeriodData.reduce((acc, d) => acc + d.focusMinutes, 0);
    const avgFocusPerDay = totalFocus / previousPeriodData.length;
    const focusScore = Math.min(100, (avgFocusPerDay / 120) * 100);

    // Assume similar streak and goals for previous period
    return Math.round(taskScore * 0.4 + focusScore * 0.3 + 50 * 0.3);
  }, [previousPeriodData]);

  const trend = previousScore ? score - previousScore : 0;
  const TrendIcon = trend > 2 ? TrendingUp : trend < -2 ? TrendingDown : Minus;
  const trendColor =
    trend > 2 ? "text-green-500" : trend < -2 ? "text-red-500" : "text-muted-foreground";

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-blue-500";
    if (s >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-blue-500";
    if (s >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Needs Work";
  };

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 h-32 w-32 rounded-full ${getProgressColor(score)} opacity-10 blur-3xl`}
      />
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4" />
          Productivity Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-muted-foreground text-lg">/100</span>
          {trend !== 0 && (
            <span className={`flex items-center gap-0.5 text-sm ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {trend > 0 ? "+" : ""}
              {trend}
            </span>
          )}
        </div>

        <Progress value={score} className="h-2" />

        <p className={`text-sm font-medium ${getScoreColor(score)}`}>{getLabel(score)}</p>

        <div className="text-muted-foreground grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="text-foreground font-medium">40%</div>
            <div>Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-foreground font-medium">30%</div>
            <div>Focus</div>
          </div>
          <div className="text-center">
            <div className="text-foreground font-medium">20%</div>
            <div>Streak</div>
          </div>
          <div className="text-center">
            <div className="text-foreground font-medium">10%</div>
            <div>Goals</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
