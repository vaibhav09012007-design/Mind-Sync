"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {
  variant?: "default" | "pills" | "underline";
}

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsListProps) {
  const variantStyles = {
    default: "bg-muted rounded-lg p-[3px]",
    pills: "bg-transparent gap-2 p-0",
    underline: "bg-transparent border-b border-border rounded-none p-0 gap-4",
  };

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "text-muted-foreground inline-flex h-10 w-fit items-center justify-center",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

interface TabsTriggerProps extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "pills" | "underline";
}

function TabsTrigger({
  className,
  variant = "default",
  ...props
}: TabsTriggerProps) {
  const variantStyles = {
    default: cn(
      "data-[state=active]:bg-background dark:data-[state=active]:text-foreground",
      "dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30",
      "rounded-md border border-transparent data-[state=active]:shadow-sm",
      "h-[calc(100%-1px)]"
    ),
    pills: cn(
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500",
      "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25",
      "rounded-full px-4 hover:bg-muted"
    ),
    underline: cn(
      "data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-purple-500",
      "rounded-none border-b-2 border-transparent -mb-px pb-3",
      "hover:text-foreground"
    ),
  };

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring",
        "text-foreground dark:text-muted-foreground inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        "data-[state=active]:animate-fade-in-up",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
