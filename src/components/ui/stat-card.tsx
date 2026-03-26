"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const renderTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-green-600 dark:text-green-400";
    if (trend.value < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const getIconBgStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-br from-primary/15 to-primary/5 text-primary";
      case "success":
        return "bg-gradient-to-br from-green-600/15 to-green-600/5 text-green-600 dark:text-green-400";
      case "warning":
        return "bg-gradient-to-br from-yellow-600/15 to-yellow-600/5 text-yellow-600 dark:text-yellow-400";
      case "danger":
        return "bg-gradient-to-br from-red-600/15 to-red-600/5 text-red-600 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card
        className={cn(
          "relative overflow-hidden p-5",
          className
        )}
      >
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Title */}
            <p className="text-muted-foreground text-sm font-medium">{title}</p>

            {/* Value */}
            <div className="flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-bold tracking-tight">{value}</span>

              {/* Trend indicator */}
              {trend && (
                <div className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
                  {renderTrendIcon()}
                  <span>{Math.abs(trend.value)}%</span>
                  {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
                </div>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>

          {/* Icon */}
          {Icon && (
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                getIconBgStyles()
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default StatCard;
