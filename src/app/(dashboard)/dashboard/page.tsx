"use client";

import { Header } from "@/components/layout/Header";
import {
  Clock,
  CheckCircle2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Play,
  Sparkles,
  ArrowRight,
  Activity,
  Target,
  Circle,
  Edit3,
} from "lucide-react";
import { motion } from "framer-motion";
import { useStore, Task } from "@/store/useStore";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from "date-fns";

// Helper for animations
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Time-based greeting helper
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Calculate week-over-week change
function calculateTrend(current: number, previous: number): { change: string; isUp: boolean } {
  if (previous === 0) {
    return { change: current > 0 ? "+100%" : "0%", isUp: current > 0 };
  }
  const percentChange = Math.round(((current - previous) / previous) * 100);
  return {
    change: `${percentChange >= 0 ? "+" : ""}${percentChange}%`,
    isUp: percentChange >= 0,
  };
}

// Calculate streak from tasks
function calculateStreak(tasks: Task[]): number {
  const completedDates = tasks
    .filter((t) => t.completed && t.completedAt)
    .map((t) => format(new Date(t.completedAt!), "yyyy-MM-dd"))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .reverse();

  if (completedDates.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();

  for (const dateStr of completedDates) {
    const date = new Date(dateStr);
    if (isSameDay(date, currentDate) || isSameDay(date, subDays(currentDate, 1))) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function DashboardPage() {
  const { tasks, events, toggleTask } = useStore();
  const { user } = useUser();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Calculate streak
  const streak = useMemo(() => calculateStreak(tasks), [tasks]);

  // --- Real Stats Calculation with Week-over-Week Trends ---
  const stats = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);

    // Tasks completed this week vs last week
    const tasksThisWeek = tasks.filter(
      (t) =>
        t.completed &&
        t.completedAt &&
        isWithinInterval(new Date(t.completedAt), { start: thisWeekStart, end: thisWeekEnd })
    ).length;

    const tasksLastWeek = tasks.filter(
      (t) =>
        t.completed &&
        t.completedAt &&
        isWithinInterval(new Date(t.completedAt), { start: lastWeekStart, end: lastWeekEnd })
    ).length;

    const tasksTrend = calculateTrend(tasksThisWeek, tasksLastWeek);

    // Focus minutes this week vs last week
    const focusMinutesThisWeek = tasks
      .filter(
        (t) =>
          t.completed &&
          t.completedAt &&
          isWithinInterval(new Date(t.completedAt), { start: thisWeekStart, end: thisWeekEnd })
      )
      .reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 25), 0);

    const focusMinutesLastWeek = tasks
      .filter(
        (t) =>
          t.completed &&
          t.completedAt &&
          isWithinInterval(new Date(t.completedAt), { start: lastWeekStart, end: lastWeekEnd })
      )
      .reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 25), 0);

    const focusHoursThisWeek = Math.round(focusMinutesThisWeek / 60);
    const focusTrend = calculateTrend(focusMinutesThisWeek, focusMinutesLastWeek);

    // Total pending
    const pendingTasks = tasks.filter((t) => !t.completed).length;

    // Meeting time saved
    const meetingMinutes = events
      .filter((e) => e.type === "meeting")
      .reduce((acc, e) => {
        const start = new Date(e.start);
        const end = new Date(e.end);
        return acc + (end.getTime() - start.getTime()) / 60000;
      }, 0);
    const meetingHoursSaved = Math.round(((meetingMinutes * 0.1) / 60) * 10) / 10;

    return [
      {
        label: "Focus Hours",
        value: focusHoursThisWeek.toString(),
        unit: "h",
        change: focusTrend.change,
        trend: focusTrend.isUp ? "up" : "down",
        subtext: "this week",
        icon: Clock,
        color: "success",
        shape: "octahedron",
      },
      {
        label: "Tasks Completed",
        value: tasksThisWeek.toString(),
        change: tasksTrend.change,
        trend: tasksTrend.isUp ? "up" : "down",
        subtext: `${pendingTasks} pending`,
        icon: CheckCircle2,
        color: "primary",
        shape: "box",
      },
      {
        label: "Current Streak",
        value: streak.toString(),
        unit: " days",
        icon: Target,
        color: "warning",
        badge: streak >= 3 ? "🔥" : undefined,
        shape: "torus",
      },
      {
        label: "Meeting Time Saved",
        value: meetingHoursSaved > 0 ? `${meetingHoursSaved}` : "--",
        unit: meetingHoursSaved > 0 ? "h" : undefined,
        badge: "Async",
        icon: Calendar,
        color: "info",
        shape: "sphere",
      },
    ];
  }, [tasks, events, streak]);

  // Recent activity (last 5 completed tasks)
  const recentActivity = useMemo(() => {
    return tasks
      .filter((t) => t.completed && t.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        text: `Completed "${t.title}"`,
        time: format(new Date(t.completedAt!), "h:mm a"),
        date: format(new Date(t.completedAt!), "MMM d"),
      }));
  }, [tasks]);

  const quickActions = [
    {
      label: "Start Focus Session",
      icon: Play,
      href: "/focus",
      color: "success",
    },
    {
      label: "View Schedule",
      icon: Calendar,
      href: "/calendar",
      color: "primary",
    },
    {
      label: "AI Suggestions",
      icon: Sparkles,
      href: "/analytics",
      color: "warning",
    },
  ];

  const recentTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
    .slice(0, 4);

  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-background">
      <Header title="Dashboard" subtitle={`${greeting}, ${user?.firstName || "Traveler"}`} />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Stats Cards - Now 4 columns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={item} className="relative overflow-hidden p-5 rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="flex items-start justify-between">
                <div className="relative z-10">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                    {stat.unit && (
                      <span className="text-lg text-muted-foreground">{stat.unit}</span>
                    )}
                  </div>
                  {stat.change && (
                    <div className="mt-2 flex items-center gap-1">
                      {stat.trend === "up" ? (
                        <TrendingUp size={14} className="text-green-600" />
                      ) : (
                        <TrendingDown size={14} className="text-red-600" />
                      )}
                      <span
                        className={`text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                      >
                        {stat.change}
                      </span>
                      {stat.subtext && (
                        <span className="text-xs text-muted-foreground">{stat.subtext}</span>
                      )}
                    </div>
                  )}
                  {stat.badge && (
                    <span className="mt-2 inline-block rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs text-green-700 dark:text-green-400">
                      {stat.badge}
                    </span>
                  )}
                </div>

                {/* 3D Icon or Fallback 2D Icon */}
                <div className="h-16 w-16 relative flex items-center justify-center">
                   <div className={`p-4 rounded-full bg-muted`}>
                    <stat.icon size={32} className={`text-foreground`} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <motion.div variants={item} className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                >
                  <div className={`rounded-lg p-2 bg-background shadow-sm`}>
                    <action.icon size={18} className={`text-foreground`} />
                  </div>
                  <span className="flex-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    {action.label}
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div variants={item} className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Pending Tasks</h2>
                <CreateTaskDialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-muted"
                  >
                    <Plus size={14} className="text-foreground" />
                  </Button>
                </CreateTaskDialog>
              </div>
              <Link href="/kanban" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                  >
                    {/* Checkmark button */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0 rounded-full focus:ring-2 focus:ring-primary focus:outline-none"
                      title="Mark as complete"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={20} className="text-green-600" />
                      ) : (
                        <Circle
                          size={20}
                          className="text-muted-foreground hover:text-primary"
                        />
                      )}
                    </button>
                    <div className="badge badge-medium text-xs uppercase text-muted-foreground">
                      {task.priority || "P2"}
                    </div>
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {task.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No due"}
                    </span>
                    {/* Edit button */}
                    <button
                      onClick={() => setEditingTask(task)}
                      className="flex-shrink-0 rounded p-1 hover:bg-muted focus:ring-2 focus:ring-primary focus:outline-none"
                      title="Edit task"
                    >
                      <Edit3 size={14} className="text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <p>No pending tasks. You&apos;re all caught up!</p>
                  <div className="mt-4">
                    <CreateTaskDialog>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus size={14} />
                        Add your first task
                      </Button>
                    </CreateTaskDialog>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Task Dialog */}
            {editingTask && (
              <EditTaskDialog
                task={editingTask}
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
              />
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item} className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
                  >
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date} at {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No recent activity</p>
                  <p className="mt-1 text-xs">Complete tasks to see your progress here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Zen Mode Promo */}
        <motion.div
          variants={item}
          className="relative overflow-hidden p-6 rounded-xl border bg-card text-card-foreground shadow-sm"
        >
          <div className="relative z-10">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-wider text-green-500">
              <Sparkles size={12} /> DEEP WORK ZONE
            </span>
            <h3 className="mt-2 text-2xl font-bold text-foreground">Enter Zen Mode</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              Block distractions and enhance your focus with curated soundscapes designed for deep
              work.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link href="/focus" className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 ml-auto">
                <Play size={18} />
                Start Focus Session
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
