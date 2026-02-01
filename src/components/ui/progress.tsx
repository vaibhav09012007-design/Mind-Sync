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
    gradient: "bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500",
    success: "bg-success-solid",
    warning: "bg-warning-solid",
  };

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
            "h-full rounded-full",
            indicatorVariants[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${value || 0}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
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
