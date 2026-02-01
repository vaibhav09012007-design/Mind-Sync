"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

// --- Hover Effects ---

export function HoverScale({ children, className, scale = 1.05 }: { children: ReactNode; className?: string; scale?: number }) {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({ children, className, y = -5 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div
      whileHover={{ y, boxShadow: "0 10px 30px -10px rgba(var(--primary), 0.3)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("transition-shadow duration-300", className)}
    >
      {children}
    </motion.div>
  );
}

export function Pulse({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Scroll Effects ---

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 30
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  const initial = { opacity: 0, ...directions[direction] };
  const animateState = isInView ? { opacity: 1, x: 0, y: 0 } : initial;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animateState}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Data Visualization ---

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ value, duration = 2, className, prefix = "", suffix = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      animate(motionValue, value, { duration, ease: "easeOut" });
    }
  }, [value, duration, isInView, motionValue]);

  // We need to render the motion value into the span
  useEffect(() => {
    return rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest}${suffix}`;
      }
    });
  }, [rounded, prefix, suffix]);

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}

// --- Page Transitions ---

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GradientBorderAnimated({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative group rounded-xl p-[1px] overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite] group-hover:via-primary" />
      <div className="relative bg-card rounded-xl h-full">
        {children}
      </div>
    </div>
  );
}
