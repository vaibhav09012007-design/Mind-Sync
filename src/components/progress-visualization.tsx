"use client";

/**
 * Progress Ring Component
 * Circular progress visualization for task completion
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  label?: string;
  color?: "default" | "success" | "warning" | "danger";
  animate?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 48, strokeWidth: 4, fontSize: "text-xs", radius: 18 },
  md: { width: 80, strokeWidth: 6, fontSize: "text-sm", radius: 32 },
  lg: { width: 120, strokeWidth: 8, fontSize: "text-lg", radius: 50 },
};

const colorConfig = {
  default: "stroke-primary",
  success: "stroke-green-500",
  warning: "stroke-amber-500",
  danger: "stroke-red-500",
};

export function ProgressRing({
  progress,
  size = "md",
  showPercentage = true,
  label,
  color = "default",
  animate = true,
  className,
}: ProgressRingProps) {
  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: config.width, height: config.width }}
    >
      <svg
        className="transform -rotate-90"
        width={config.width}
        height={config.width}
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={config.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={config.radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          className={colorConfig[color]}
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className={cn("font-semibold", config.fontSize)}>
            {Math.round(progress)}%
          </span>
        )}
        {label && (
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Progress Bar Component
 * Horizontal progress bar with optional animation
 */
interface ProgressBarProps {
  progress: number;
  color?: "default" | "success" | "warning" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

const barSizeConfig = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const barColorConfig = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  gradient: "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500",
};

export function ProgressBar({
  progress,
  color = "default",
  size = "md",
  showLabel = false,
  animate = true,
  className,
}: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          barSizeConfig[size]
        )}
      >
        <motion.div
          className={cn("h-full rounded-full", barColorConfig[color])}
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/**
 * Task Stats Dashboard Component
 */
interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export function TaskStatsDashboard({ stats }: { stats: TaskStats }) {
  const completionRate = stats.total > 0 
    ? (stats.completed / stats.total) * 100 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card rounded-xl p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="text-2xl font-bold">{stats.completed}/{stats.total}</p>
          </div>
          <ProgressRing
            progress={completionRate}
            size="sm"
            color="success"
            showPercentage={false}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border">
        <p className="text-sm text-muted-foreground">In Progress</p>
        <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
        <ProgressBar
          progress={(stats.inProgress / Math.max(stats.total, 1)) * 100}
          color="default"
          size="sm"
          className="mt-2"
        />
      </div>

      <div className="bg-card rounded-xl p-4 border">
        <p className="text-sm text-muted-foreground">Overdue</p>
        <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
        <ProgressBar
          progress={(stats.overdue / Math.max(stats.total, 1)) * 100}
          color="danger"
          size="sm"
          className="mt-2"
        />
      </div>

      <div className="bg-card rounded-xl p-4 border">
        <p className="text-sm text-muted-foreground">Weekly Goal</p>
        <p className="text-2xl font-bold text-green-500">{Math.round(completionRate)}%</p>
        <ProgressBar
          progress={completionRate}
          color="gradient"
          size="sm"
          className="mt-2"
        />
      </div>
    </div>
  );
}

export default ProgressRing;
