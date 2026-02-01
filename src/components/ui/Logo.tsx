"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  href?: string;
}

export function Logo({
  className,
  size = "md",
  animated = false,
  href = "/"
}: LogoProps) {

  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
  };

  const LogoContent = (
    <div className={cn("flex items-center gap-2 font-bold", className)}>
      <motion.div
        whileHover={animated ? { rotate: 10, scale: 1.1 } : undefined}
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-glow",
          iconSizes[size]
        )}
      >
        <span className={cn("font-bold leading-none", size === "xl" ? "text-2xl" : "text-lg")}>
          M
        </span>
      </motion.div>
      <span className={cn("tracking-tight gradient-text", sizeClasses[size])}>
        Mind-Sync
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
