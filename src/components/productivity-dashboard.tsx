"use client";

/**
 * Productivity Analytics Dashboard Component
 * Visualizes task completion, time management, and productivity trends
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing, ProgressBar } from "@/components/progress-visualization";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Target,
  Calendar,
  Zap,
  Award,
  RefreshCw,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, subWeeks } from "date-fns";
import { motion } from "framer-motion";

interface DailyStats {
  date: string;
  completed: number;
  created: number;
  focusMinutes: number;
}

interface WeeklyTrend {
  week: string;
  completionRate: number;
  tasksCompleted: number;
  meetingsAttended: number;
}

interface Streak {
  current: number;
  longest: number;
  lastActiveDate: string;
}

export function ProductivityDashboard() {
  const { tasks, events } = useStore();
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate stats
  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const overdueTasks = pendingTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  );

  const completionRate = tasks.length > 0
    ? (completedTasks.length / tasks.length) * 100
    : 0;

  // Get daily stats for the week
  const getDailyStats = (): DailyStats[] => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const completed = completedTasks.filter(
        (t) => t.completedAt && format(new Date(t.completedAt), "yyyy-MM-dd") === dayStr
      ).length;
      const created = tasks.filter(
        (t) => format(new Date(t.dueDate), "yyyy-MM-dd") === dayStr
      ).length;

      return {
        date: dayStr,
        completed,
        created,
        focusMinutes: completed * 25, // Estimate based on pomodoros
      };
    });
  };

  const dailyStats = getDailyStats();

  // Calculate streak
  const calculateStreak = (): Streak => {
    // Simplified streak calculation
    let current = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dayStr = format(checkDate, "yyyy-MM-dd");
      
      const hasCompletedTask = completedTasks.some(
        (t) => t.completedAt && format(new Date(t.completedAt), "yyyy-MM-dd") === dayStr
      );
      
      if (hasCompletedTask) {
        current++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      current,
      longest: Math.max(current, 7), // Placeholder
      lastActiveDate: format(today, "yyyy-MM-dd"),
    };
  };

  const streak = calculateStreak();

  // Priority distribution
  const priorityDistribution = {
    P0: tasks.filter((t) => t.priority === "P0").length,
    P1: tasks.filter((t) => t.priority === "P1").length,
    P2: tasks.filter((t) => t.priority === "P2").length,
    P3: tasks.filter((t) => t.priority === "P3").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productivity Dashboard</h1>
          <p className="text-muted-foreground">
            Track your progress and stay motivated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "week" | "month")}>
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={() => setIsLoading(true)}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ProgressRing
                  progress={completionRate}
                  size="md"
                  color={completionRate >= 70 ? "success" : completionRate >= 40 ? "warning" : "danger"}
                />
                <div>
                  <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {completedTasks.length} of {tasks.length} tasks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Zap className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streak.current} days</div>
              <p className="text-xs text-muted-foreground">
                Longest: {streak.longest} days
              </p>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      i < streak.current ? "bg-amber-500" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dailyStats.find((d) => d.date === format(new Date(), "yyyy-MM-dd"))?.completed || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate))).length} remaining today
              </p>
              <ProgressBar
                progress={
                  dailyStats.find((d) => d.date === format(new Date(), "yyyy-MM-dd"))?.completed 
                    ? (dailyStats.find((d) => d.date === format(new Date(), "yyyy-MM-dd"))!.completed / 5) * 100
                    : 0
                }
                size="sm"
                color="success"
                className="mt-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={overdueTasks.length > 0 ? "border-red-200 dark:border-red-900" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                overdueTasks.length > 0 && "text-red-500"
              )}>
                {overdueTasks.length}
              </div>
              <p className="text-xs text-muted-foreground">
                tasks need attention
              </p>
              {overdueTasks.length > 0 && (
                <Button variant="link" size="sm" className="p-0 h-auto text-xs text-red-500">
                  View all →
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-40">
            {dailyStats.map((day, i) => {
              const isCurrentDay = day.date === format(new Date(), "yyyy-MM-dd");
              const maxCompleted = Math.max(...dailyStats.map((d) => d.completed), 1);
              const height = (day.completed / maxCompleted) * 100;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={cn(
                      "w-full rounded-t-md min-h-[4px]",
                      isCurrentDay
                        ? "bg-primary"
                        : day.completed > 0
                          ? "bg-primary/60"
                          : "bg-muted"
                    )}
                  />
                  <div className="text-center">
                    <div className="text-xs font-medium">{format(new Date(day.date), "EEE")}</div>
                    <div className="text-xs text-muted-foreground">{day.completed}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution & Achievements */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(priorityDistribution).map(([priority, count]) => {
              const total = tasks.length || 1;
              const percentage = (count / total) * 100;
              const colors = {
                P0: "bg-red-500",
                P1: "bg-orange-500",
                P2: "bg-blue-500",
                P3: "bg-slate-400",
              };

              return (
                <div key={priority} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{priority}</span>
                    <span className="text-muted-foreground">{count} tasks</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className={cn("h-full rounded-full", colors[priority as keyof typeof colors])}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { 
                  name: "First Steps", 
                  description: "Complete your first task",
                  unlocked: completedTasks.length > 0,
                },
                {
                  name: "Getting Started",
                  description: "Complete 10 tasks",
                  unlocked: completedTasks.length >= 10,
                },
                {
                  name: "Productive Week",
                  description: "Complete 25 tasks in a week",
                  unlocked: completedTasks.length >= 25,
                },
                {
                  name: "Streak Master",
                  description: "Maintain a 7-day streak",
                  unlocked: streak.current >= 7 || streak.longest >= 7,
                },
              ].map((achievement) => (
                <div
                  key={achievement.name}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    achievement.unlocked
                      ? "bg-amber-50 dark:bg-amber-950/20"
                      : "bg-muted/50 opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      achievement.unlocked
                        ? "bg-amber-500 text-white"
                        : "bg-muted"
                    )}
                  >
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{achievement.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {achievement.description}
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <Badge variant="outline" className="ml-auto">
                      Unlocked
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProductivityDashboard;
