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
      },
      {
        label: "Tasks Completed",
        value: tasksThisWeek.toString(),
        change: tasksTrend.change,
        trend: tasksTrend.isUp ? "up" : "down",
        subtext: `${pendingTasks} pending`,
        icon: CheckCircle2,
        color: "primary",
      },
      {
        label: "Current Streak",
        value: streak.toString(),
        unit: " days",
        icon: Target,
        color: "warning",
        badge: streak >= 3 ? "🔥" : undefined,
      },
      {
        label: "Meeting Time Saved",
        value: meetingHoursSaved > 0 ? `${meetingHoursSaved}` : "--",
        unit: meetingHoursSaved > 0 ? "h" : undefined,
        badge: "Async",
        icon: Calendar,
        color: "info",
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
    <div className="min-h-screen bg-transparent">
      <Header title="Dashboard" subtitle={`${greeting}, ${user?.firstName || "Traveler"}`} />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Stats Cards - Now 4 columns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={item} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{stat.value}</span>
                    {stat.unit && (
                      <span className="text-lg text-[var(--text-secondary)]">{stat.unit}</span>
                    )}
                  </div>
                  {stat.change && (
                    <div className="mt-2 flex items-center gap-1">
                      {stat.trend === "up" ? (
                        <TrendingUp size={14} className="text-[var(--success)]" />
                      ) : (
                        <TrendingDown size={14} className="text-[var(--danger)]" />
                      )}
                      <span
                        className={`text-sm ${stat.trend === "up" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                      >
                        {stat.change}
                      </span>
                      {stat.subtext && (
                        <span className="text-xs text-[var(--text-muted)]">{stat.subtext}</span>
                      )}
                    </div>
                  )}
                  {stat.badge && (
                    <span className="mt-2 inline-block rounded-full bg-[var(--success-muted)] px-2 py-1 text-xs text-[var(--success)]">
                      {stat.badge}
                    </span>
                  )}
                </div>
                <div className={`rounded-lg p-3 bg-[var(--${stat.color}-muted)]`}>
                  <stat.icon size={24} className={`text-[var(--${stat.color})]`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <motion.div variants={item} className="card p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-lg bg-[var(--surface-elevated)] p-3 transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <div className={`rounded-lg p-2 bg-[var(--${action.color}-muted)]`}>
                    <action.icon size={18} className={`text-[var(--${action.color})]`} />
                  </div>
                  <span className="flex-1 text-sm text-[var(--text-secondary)] transition-colors group-hover:text-white">
                    {action.label}
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-[var(--text-muted)] transition-colors group-hover:text-white"
                  />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div variants={item} className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Pending Tasks</h2>
                <CreateTaskDialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-white/10"
                  >
                    <Plus size={14} className="text-white" />
                  </Button>
                </CreateTaskDialog>
              </div>
              <Link href="/kanban" className="text-sm text-[var(--primary)] hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg bg-[var(--surface-elevated)] p-3 transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    {/* Checkmark button */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0 rounded-full focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                      title="Mark as complete"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={20} className="text-[var(--success)]" />
                      ) : (
                        <Circle
                          size={20}
                          className="text-[var(--text-muted)] hover:text-[var(--primary)]"
                        />
                      )}
                    </button>
                    <div className="badge badge-medium text-xs uppercase">
                      {task.priority || "P2"}
                    </div>
                    <span className="flex-1 truncate text-sm font-medium text-white">
                      {task.title}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No due"}
                    </span>
                    {/* Edit button */}
                    <button
                      onClick={() => setEditingTask(task)}
                      className="flex-shrink-0 rounded p-1 hover:bg-white/10 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                      title="Edit task"
                    >
                      <Edit3 size={14} className="text-[var(--text-muted)] hover:text-white" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <p>No pending tasks. You're all caught up!</p>
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
          <motion.div variants={item} className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={18} className="text-[var(--primary)]" />
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg bg-[var(--surface-elevated)] p-3"
                  >
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--success)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{activity.text}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {activity.date} at {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[var(--text-muted)]">
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
          className="card group relative overflow-hidden p-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(20, 40, 30, 0.9) 0%, rgba(10, 30, 20, 0.95) 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-40"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2322c55e" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          <div className="relative z-10">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--success)]">
              <Sparkles size={12} /> DEEP WORK ZONE
            </span>
            <h3 className="mt-2 text-2xl font-bold text-white">Enter Zen Mode</h3>
            <p className="mt-2 max-w-md text-[var(--text-secondary)]">
              Block distractions and enhance your focus with curated soundscapes designed for deep
              work.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link href="/focus" className="btn btn-success ml-auto flex items-center gap-2">
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
