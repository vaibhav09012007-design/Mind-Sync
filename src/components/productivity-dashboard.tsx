"use client";

/**
 * Productivity Analytics Dashboard Component
 * Visualizes task completion, time management, and productivity trends
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { format, startOfYear, eachDayOfInterval, isSameDay } from "date-fns";
import { StatsCalculator, DailyActivity } from "@/lib/stats-calculator";

// New Components
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";
import { CoachWidget } from "@/components/analytics/coach-widget";
import { GoalsWidget } from "@/components/analytics/goals-widget";
import { WeeklyChart } from "@/components/analytics/weekly-chart";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { ExportStats } from "@/components/analytics/export-stats";
import { getGoals } from "@/actions/goals"; // Server Action

interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  metric: "hours" | "tasks" | "streak";
  period: "weekly" | "monthly";
}

export function ProductivityDashboard() {
  const { tasks } = useStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Assuming current user ID is available in store or we pass it.
  // For now, hardcode or fetch from auth hook if available.
  const userId = "user_2rOp5...";

  useEffect(() => {
    // Fetch goals
    async function loadGoals() {
      if (!userId) return;
      try {
        const data = await getGoals(userId);
        // data matches basic structure, casting to interface
        setGoals(data as unknown as Goal[]);
      } catch (e) {
        console.error("Failed to load goals", e);
      }
    }
    loadGoals();
  }, [userId]);

  // Transform Tasks into DailyActivity[]
  const activityData: DailyActivity[] = useMemo(() => {
    if (!tasks) return [];

    // Generate dates for the current year (or relevant range) to ensure continuity
    const today = new Date();
    const start = startOfYear(today);
    const range = eachDayOfInterval({ start, end: today });

    return range.map((date) => {
      const dayStr = format(date, "yyyy-MM-dd");

      const completedOnDay = tasks.filter(
        (t) =>
          t.completed && t.completedAt && format(new Date(t.completedAt), "yyyy-MM-dd") === dayStr
      );

      // Naive focus minutes calculation: 25 mins per task
      const focusMinutes = completedOnDay.reduce((acc, t) => acc + (t.actualMinutes || 25), 0);

      return {
        date,
        tasksCompleted: completedOnDay.length,
        focusMinutes,
      };
    });
  }, [tasks]);

  const streak = StatsCalculator.calculateStreak(activityData);
  const roiHours = StatsCalculator.calculateROI(tasks.filter((t) => t.completed).length);

  // Data for Weekly Chart (Last 7 days)
  const weeklyData = activityData.slice(-7);

  // Data for Breakdown
  const breakdownData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks
      .filter((t) => t.completed)
      .forEach((t) => {
        const cat = t.tags?.[0] || "Uncategorized";
        counts[cat] = (counts[cat] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Analytics & Insights
          </h1>
          <p className="text-muted-foreground">Visualize your productivity journey.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportStats data={activityData} />
          <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Top Level Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              {streak} <span className="text-muted-foreground text-sm font-normal">days</span>
              {streak > 3 && <span className="text-xl">🔥</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              ROI (Time Saved)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiHours.toFixed(1)}{" "}
              <span className="text-muted-foreground text-sm font-normal">hours</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter((t) => t.completed).length}</div>
          </CardContent>
        </Card>
        <CoachWidget data={activityData} />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Chart Area */}
        <div className="space-y-6 md:col-span-4">
          <WeeklyChart data={weeklyData} />
          <Card>
            <CardHeader>
              <CardTitle>Activity Heatmap (Year)</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap data={activityData} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6 md:col-span-3">
          <GoalsWidget initialGoals={goals} userId={userId} />
          <CategoryBreakdown data={breakdownData} />
        </div>
      </div>
    </div>
  );
}

export default ProductivityDashboard;
