import * as React from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "glass" | "gradient-border" | "elevated";
  hover?: "none" | "lift" | "glow" | "scale" | "shimmer";
}

function Card({ className, variant = "default", hover = "lift", ...props }: CardProps) {
  const variantStyles = {
    default: "bg-card border-border/50 border",
    glass: "glass-card",
    "gradient-border": "gradient-border border-0",
    elevated: "bg-card shadow-elevated border-border/50 border",
  };

  const hoverStyles = {
    none: "",
    lift: "hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 transition-all duration-300 ease-out",
    glow: "hover-glow",
    scale: "hover:scale-[1.02] transition-transform duration-300",
    shimmer: "relative overflow-hidden group",
  };

  return (
    <div
      data-slot="card"
      className={cn(
        "text-card-foreground flex flex-col gap-6 rounded-xl py-6 shadow-sm",
        "transition-all duration-300",
        variantStyles[variant],
        hoverStyles[hover],
        className
      )}
      {...props}
    >
      {props.children}
      {hover === "shimmer" && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

/**
 * A specialized card component that applies glassmorphism effects automatically
 */
function GlassCard({ className, hover = "lift", ...props }: Omit<CardProps, "variant">) {
  return (
    <Card
      variant="glass"
      hover={hover}
      className={className}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export { Card, GlassCard, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
