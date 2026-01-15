"use client";

import { Header } from "@/components/layout/Header";
import {
  Clock,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Play,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore"; // Real Data Store
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

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

export default function DashboardPage() {
  const { tasks, events } = useStore();
  const { user } = useUser();

  // --- Real Stats Calculation ---
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  // Naive focus hours calc (sum of estimated minutes of completed tasks / 60)
  // Or actualMinutes if available
  const focusMinutes = tasks.reduce(
    (acc, t) => acc + (t.actualMinutes || (t.completed ? t.estimatedMinutes || 25 : 0)),
    0
  );
  const focusHours = Math.round(focusMinutes / 60);

  // Meeting time saved (mock logic: assume 10% of meeting time saved via async)
  // Real logic would check "meeting" type events
  const meetingMinutes = events
    .filter((e) => e.type === "meeting")
    .reduce((acc, e) => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      return acc + (end.getTime() - start.getTime()) / 60000;
    }, 0);
  const meetingHoursSaved = Math.round(((meetingMinutes * 0.1) / 60) * 10) / 10; // Mock 10% efficiency

  const stats = [
    {
      label: "Focus Hours",
      value: focusHours.toString(),
      unit: "h",
      change: "+12%", // Mock trend
      trend: "up",
      icon: Clock,
      color: "success",
    },
    {
      label: "Tasks Completed",
      value: completedTasks.toString(),
      change:
        totalTasks > 0 ? `+${tasks.filter((t) => !t.completed).length} pending` : "No pending",
      trend: "up",
      icon: CheckCircle2,
      color: "primary",
    },
    {
      label: "Meeting Time Saved",
      value: meetingHoursSaved > 0 ? `${meetingHoursSaved}h` : "--",
      badge: "Async",
      icon: Calendar,
      color: "info",
    },
  ];

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
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()) // Sort by due date
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-transparent">
      {" "}
      {/* bg controlled by layout/globals */}
      <Header title="Dashboard" subtitle={`Welcome back, ${user?.firstName || "Traveler"}`} />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                      <TrendingUp size={14} className="text-[var(--success)]" />
                      <span className="text-sm text-[var(--success)]">{stat.change}</span>
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
          <motion.div variants={item} className="card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Pending Tasks</h2>
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
                    <div className={`badge badge-medium text-xs uppercase`}>
                      {task.priority || "Normal"}
                    </div>
                    <span className="flex-1 text-sm font-medium text-white">{task.title}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <p>No pending tasks. You're all caught up!</p>
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
