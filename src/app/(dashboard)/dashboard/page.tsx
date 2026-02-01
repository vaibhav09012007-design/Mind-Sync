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
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
            <motion.div key={stat.label} variants={item}>
              <GlassCard hover="lift" className="relative overflow-hidden p-5">
                <div className="flex items-start justify-between">
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</span>
                      {stat.unit && (
                        <span className="text-lg text-muted-foreground font-medium">{stat.unit}</span>
                      )}
                    </div>
                    {stat.change && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {stat.trend === "up" ? (
                          <TrendingUp size={14} className="text-success" />
                        ) : (
                          <TrendingDown size={14} className="text-error" />
                        )}
                        <span
                          className={`text-sm font-medium ${stat.trend === "up" ? "text-success" : "text-error"}`}
                        >
                          {stat.change}
                        </span>
                        {stat.subtext && (
                          <span className="text-xs text-muted-foreground">{stat.subtext}</span>
                        )}
                      </div>
                    )}
                    {stat.badge && (
                      <Badge variant={stat.color === "success" ? "success" : stat.color === "warning" ? "warning" : "default"} className="mt-3">
                        {stat.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Icon with gradient background */}
                  <div className={`p-3 rounded-xl bg-${stat.color === 'primary' ? 'brand' : stat.color}-500/10`}>
                    <stat.icon size={24} className={`text-${stat.color === 'primary' ? 'brand' : stat.color}-500`} />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <motion.div variants={item}>
            <GlassCard className="p-5 h-full">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10 hover:scale-[1.02] border border-transparent hover:border-white/10"
                  >
                    <div className={`rounded-lg p-2 bg-${action.color === 'primary' ? 'brand' : action.color}-500/10`}>
                      <action.icon size={18} className={`text-${action.color === 'primary' ? 'brand' : action.color}-500`} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      {action.label}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground transition-colors group-hover:text-primary group-hover:translate-x-1"
                    />
                  </Link>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div variants={item}>
            <GlassCard className="p-5 h-full">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Pending Tasks</h2>
                  <CreateTaskDialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary"
                      aria-label="Create new task"
                    >
                      <Plus size={14} />
                    </Button>
                  </CreateTaskDialog>
                </div>
                <Link href="/kanban" className="text-xs font-medium text-primary hover:text-brand-400 transition-colors">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10 border border-transparent hover:border-white/10"
                    >
                      {/* Checkmark button */}
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="flex-shrink-0 rounded-full focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                        title="Mark as complete"
                      >
                        {task.completed ? (
                          <CheckCircle2 size={20} className="text-success" />
                        ) : (
                          <Circle
                            size={20}
                            className="text-muted-foreground group-hover:text-primary transition-colors"
                          />
                        )}
                      </button>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground bg-transparent border-white/10">
                        {task.priority || "P2"}
                      </Badge>
                      <span className="flex-1 truncate text-sm font-medium text-foreground group-hover:text-brand-100 transition-colors">
                        {task.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.dueDate ? format(new Date(task.dueDate), "MMM d") : ""}
                      </span>
                      {/* Edit button */}
                      <button
                        onClick={() => setEditingTask(task)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-white/10 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                        title="Edit task"
                      >
                        <Edit3 size={14} className="text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground py-8 text-center flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-success flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <p className="font-medium">All caught up!</p>
                    <p className="text-xs mt-1 opacity-70">Enjoy your free time</p>
                    <div className="mt-4">
                      <CreateTaskDialog>
                        <Button variant="outline" size="sm" className="gap-2 border-dashed border-white/20 hover:border-brand-500 hover:text-primary hover:bg-brand-500/5">
                          <Plus size={14} />
                          Add task
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
            </GlassCard>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item}>
            <GlassCard className="p-5 h-full">
              <div className="mb-4 flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent Activity</h2>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, i) => (
                    <div
                      key={activity.id}
                      className="relative flex gap-4"
                    >
                      {/* Timeline line */}
                      {i !== recentActivity.length - 1 && (
                        <div className="absolute left-[5px] top-6 bottom-[-20px] w-[2px] bg-white/5" />
                      )}
                      
                      <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-success-solid ring-4 ring-background" />
                      <div className="min-w-0 flex-1 pb-1">
                        <p className="truncate text-sm font-medium text-foreground">{activity.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.date} • {activity.time}
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
            </GlassCard>
          </motion.div>
        </div>

        {/* Zen Mode Promo */}
        <motion.div variants={item}>
          <GlassCard hover="scale" className="relative overflow-hidden p-8 border border-primary/20">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-semibold tracking-wider text-success border border-success">
                  <Sparkles size={12} /> DEEP WORK ZONE
                </span>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Enter Zen Mode</h3>
                <p className="mt-2 max-w-md text-muted-foreground text-lg">
                  Block distractions and enhance your focus with curated soundscapes designed for deep work.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link href="/focus">
                  <Button size="lg" className="gap-2 bg-success-solid hover:opacity-90 text-white shadow-lg shadow-gold-glow-sm rounded-xl px-8 h-12">
                    <Play size={18} fill="currentColor" />
                    Start Focus Session
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
