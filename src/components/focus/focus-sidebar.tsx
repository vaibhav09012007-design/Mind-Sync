"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { Target, Flame, Clock, TrendingUp, CheckCircle2, LucideIcon } from "lucide-react";

interface FocusGoal {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: LucideIcon;
}

export function FocusSidebar() {
  const { tasks, completedSessions, timerSettings } = useStore();

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const completedToday = tasks.filter(
      (t) => t.completed && t.completedAt && format(new Date(t.completedAt), "yyyy-MM-dd") === today
    );

    const focusMinutesToday = completedToday.reduce(
      (acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 25),
      0
    );

    return {
      tasksCompleted: completedToday.length,
      focusMinutes: focusMinutesToday,
      sessions: completedSessions,
    };
  }, [tasks, completedSessions]);

  // Weekly progress
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const completedThisWeek = tasks.filter(
      (t) =>
        t.completed &&
        t.completedAt &&
        isWithinInterval(new Date(t.completedAt), { start: weekStart, end: weekEnd })
    );

    const focusMinutesWeek = completedThisWeek.reduce(
      (acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 25),
      0
    );

    return {
      tasksCompleted: completedThisWeek.length,
      focusHours: Math.round(focusMinutesWeek / 60),
    };
  }, [tasks]);

  // Focus goals
  const goals: FocusGoal[] = useMemo(
    () => [
      {
        id: "daily-sessions",
        label: "Daily Sessions",
        current: completedSessions,
        target: 4,
        unit: "sessions",
        icon: Target,
      },
      {
        id: "focus-hours",
        label: "Focus Hours Today",
        current: Math.round(todayStats.focusMinutes / 60),
        target: 4,
        unit: "hours",
        icon: Clock,
      },
      {
        id: "weekly-tasks",
        label: "Weekly Tasks",
        current: weeklyStats.tasksCompleted,
        target: 20,
        unit: "tasks",
        icon: CheckCircle2,
      },
    ],
    [completedSessions, todayStats.focusMinutes, weeklyStats.tasksCompleted]
  );

  // Session history (simulated based on completed tasks)
  const sessionHistory = useMemo(() => {
    const today = new Date();
    const history = [];

    // Get completed tasks from today as "sessions"
    const todayTasks = tasks
      .filter(
        (t) =>
          t.completed &&
          t.completedAt &&
          format(new Date(t.completedAt), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
      )
      .slice(0, 5);

    for (const task of todayTasks) {
      history.push({
        id: task.id,
        title: task.title,
        duration: task.actualMinutes || task.estimatedMinutes || 25,
        completedAt: task.completedAt!,
      });
    }

    return history;
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Focus Goals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-orange-500" />
            Focus Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const isComplete = goal.current >= goal.target;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <goal.icon className={`h-3.5 w-3.5 ${isComplete ? "text-green-500" : ""}`} />
                    {goal.label}
                  </span>
                  <span className={`font-medium ${isComplete ? "text-green-500" : ""}`}>
                    {goal.current}/{goal.target} {goal.unit}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={`h-2 ${isComplete ? "[&>div]:bg-green-500" : ""}`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{todayStats.sessions}</div>
              <div className="text-muted-foreground text-xs">Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.round(todayStats.focusMinutes / 60)}h
              </div>
              <div className="text-muted-foreground text-xs">Focus Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{todayStats.tasksCompleted}</div>
              <div className="text-muted-foreground text-xs">Tasks Done</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-purple-500" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionHistory.length > 0 ? (
            <div className="space-y-3">
              {sessionHistory.map((session) => (
                <div
                  key={session.id}
                  className="bg-muted/50 flex items-center gap-3 rounded-lg p-2"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{session.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {session.duration} min • {format(new Date(session.completedAt), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-4 text-center text-sm">
              <p>No sessions completed today</p>
              <p className="mt-1 text-xs">Start a focus session to track your progress</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
