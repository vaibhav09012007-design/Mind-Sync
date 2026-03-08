"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: "default" | "gradient" | "success" | "warning";
  animated?: boolean;
}

function Progress({
  className,
  value,
  variant = "default",
  animated = true,
  ...props
}: ProgressProps) {
  const indicatorVariants = {
    default: "bg-primary",
    gradient: "bg-gradient-to-r from-primary via-purple-400 to-cyan-400",
    success: "bg-success-solid",
    warning: "bg-warning-solid",
  };

  const showShimmer = (value || 0) >= 90;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {animated ? (
        <motion.div
          data-slot="progress-indicator"
          className={cn(
            "h-full rounded-full relative overflow-hidden",
            indicatorVariants[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${value || 0}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {showShimmer && (
            <div className="absolute inset-0 animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          )}
        </motion.div>
      ) : (
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out",
            indicatorVariants[variant]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      )}
    </ProgressPrimitive.Root>
  )
}

export { Progress }
