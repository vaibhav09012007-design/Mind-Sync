"use client";

/**
 * Productivity Analytics Dashboard Component
 * Visualizes task completion, time management, and productivity trends
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { RefreshCw, Target, Timer, CheckCircle2, Flame } from "lucide-react";
import { format, startOfYear, eachDayOfInterval, subDays, isWithinInterval } from "date-fns";
import { StatsCalculator, DailyActivity } from "@/lib/stats-calculator";

// Analytics Components
import {
  DateRangeFilter,
  DateRangeOption,
  DateRange,
  getDateRangeFromOption,
} from "@/components/analytics/date-range-filter";
import { EnhancedWeeklyChart } from "@/components/analytics/enhanced-weekly-chart";
import { EnhancedActivityHeatmap } from "@/components/analytics/enhanced-activity-heatmap";
import { FocusTimeCard } from "@/components/analytics/focus-time-card";
import { ProductivityScore } from "@/components/analytics/productivity-score";
import { StatCardWithTrend } from "@/components/analytics/stat-card-with-trend";
import { CoachWidget } from "@/components/analytics/coach-widget";
import { GoalsWidget } from "@/components/analytics/goals-widget";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { ExportStats } from "@/components/analytics/export-stats";
import { getGoals } from "@/actions/goals";

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
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("30d");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromOption("30d"));

  const userId = "user_2rOp5...";

  useEffect(() => {
    async function loadGoals() {
      if (!userId) return;
      try {
        const data = await getGoals(userId);
        setGoals(data as unknown as Goal[]);
      } catch (e) {
        console.error("Failed to load goals", e);
      }
    }
    loadGoals();
  }, [userId]);

  // Handle date range change
  const handleDateRangeChange = (option: DateRangeOption, range: DateRange) => {
    setDateRangeOption(option);
    setDateRange(range);
  };

  // Transform Tasks into DailyActivity[] for full year
  const fullYearActivityData: DailyActivity[] = useMemo(() => {
    if (!tasks) return [];

    const today = new Date();
    const start = startOfYear(today);
    const range = eachDayOfInterval({ start, end: today });

    return range.map((date) => {
      const dayStr = format(date, "yyyy-MM-dd");

      const completedOnDay = tasks.filter(
        (t) =>
          t.completed && t.completedAt && format(new Date(t.completedAt), "yyyy-MM-dd") === dayStr
      );

      const focusMinutes = completedOnDay.reduce((acc, t) => acc + (t.actualMinutes || 25), 0);

      return {
        date,
        tasksCompleted: completedOnDay.length,
        focusMinutes,
      };
    });
  }, [tasks]);

  // Filter activity data by selected date range
  const filteredActivityData = useMemo(() => {
    return fullYearActivityData.filter((d) =>
      isWithinInterval(d.date, { start: dateRange.from, end: dateRange.to })
    );
  }, [fullYearActivityData, dateRange]);

  // Previous period data for comparison
  const previousPeriodData = useMemo(() => {
    const periodLength = filteredActivityData.length;
    const prevStart = subDays(dateRange.from, periodLength);
    const prevEnd = subDays(dateRange.from, 1);

    return fullYearActivityData.filter((d) =>
      isWithinInterval(d.date, { start: prevStart, end: prevEnd })
    );
  }, [fullYearActivityData, dateRange, filteredActivityData.length]);

  // Stats calculations
  const streak = useMemo(
    () => StatsCalculator.calculateStreak(fullYearActivityData),
    [fullYearActivityData]
  );

  const totalCompletedTasks = useMemo(
    () => filteredActivityData.reduce((acc, d) => acc + d.tasksCompleted, 0),
    [filteredActivityData]
  );

  const previousTotalTasks = useMemo(
    () => previousPeriodData.reduce((acc, d) => acc + d.tasksCompleted, 0),
    [previousPeriodData]
  );

  const tasksTrend =
    previousTotalTasks > 0
      ? ((totalCompletedTasks - previousTotalTasks) / previousTotalTasks) * 100
      : 0;

  const roiHours = useMemo(
    () => StatsCalculator.calculateROI(totalCompletedTasks),
    [totalCompletedTasks]
  );

  // Weekly data for chart (last 7 days of selected period)
  const weeklyData = useMemo(() => filteredActivityData.slice(-7), [filteredActivityData]);
  const previousWeekData = useMemo(() => previousPeriodData.slice(-7), [previousPeriodData]);

  // Category breakdown
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

  // Goals progress for productivity score
  const goalsProgress = useMemo(() => {
    if (goals.length === 0) return 50;
    const avgProgress =
      goals.reduce((acc, g) => {
        const progress = Math.min(100, (g.currentValue / g.targetValue) * 100);
        return acc + progress;
      }, 0) / goals.length;
    return avgProgress;
  }, [goals]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* Header Controls Only */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <div className="flex items-center gap-2">
          <DateRangeFilter value={dateRangeOption} onChange={handleDateRangeChange} />
          <ExportStats data={filteredActivityData} />
          <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCardWithTrend
          title="Current Streak"
          value={streak}
          unit="days"
          icon={Flame}
          description={streak > 3 ? "🔥 On fire!" : undefined}
        />
        <StatCardWithTrend
          title="Tasks Completed"
          value={totalCompletedTasks}
          unit="tasks"
          trend={tasksTrend}
          icon={CheckCircle2}
        />
        <FocusTimeCard data={filteredActivityData} previousPeriodData={previousPeriodData} />
        <StatCardWithTrend
          title="ROI (Time Saved)"
          value={roiHours.toFixed(1)}
          unit="hours"
          icon={Timer}
        />
        <CoachWidget data={filteredActivityData} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left: Charts */}
        <div className="space-y-6 lg:col-span-4">
          <EnhancedWeeklyChart data={weeklyData} previousPeriodData={previousWeekData} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Activity Heatmap</span>
                <span className="text-muted-foreground text-sm font-normal">This Year</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedActivityHeatmap data={fullYearActivityData} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar Widgets */}
        <div className="space-y-6 lg:col-span-3">
          <ProductivityScore
            data={filteredActivityData}
            previousPeriodData={previousPeriodData}
            streak={streak}
            totalTasks={totalCompletedTasks}
            goalsProgress={goalsProgress}
          />
          <GoalsWidget initialGoals={goals} userId={userId} />
          <CategoryBreakdown data={breakdownData} />
        </div>
      </div>
    </div>
  );
}

export default ProductivityDashboard;
