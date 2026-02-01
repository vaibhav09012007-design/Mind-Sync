"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Flag } from "lucide-react";

export type Priority = "P0" | "P1" | "P2" | "P3";

interface PriorityConfig {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

export const priorityConfig: Record<Priority, PriorityConfig> = {
  P0: {
    label: "P0",
    color: "text-error",
    bgColor: "bg-error border-error",
    description: "Critical",
  },
  P1: {
    label: "P1",
    color: "text-warning",
    bgColor: "bg-warning border-warning",
    description: "High",
  },
  P2: {
    label: "P2",
    color: "text-info",
    bgColor: "bg-info border-info",
    description: "Medium",
  },
  P3: {
    label: "P3",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30 border-muted-foreground/20",
    description: "Low",
  },
};

interface PriorityBadgeProps {
  priority: Priority;
  size?: "sm" | "md";
  showLabel?: boolean;
}

/**
 * Visual priority indicator badge
 */
export function PriorityBadge({
  priority,
  size = "sm",
  showLabel = true,
}: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        config.bgColor,
        config.color,
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
      )}
    >
      {showLabel ? config.label : <Flag className="h-3 w-3" />}
    </Badge>
  );
}

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  size?: "sm" | "md";
}

/**
 * Dropdown for selecting task priority
 */
export function PrioritySelector({
  value,
  onChange,
  size = "sm",
}: PrioritySelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
          <PriorityBadge priority={value} size={size} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        {(Object.keys(priorityConfig) as Priority[]).map((p) => (
          <DropdownMenuItem
            key={p}
            onClick={() => onChange(p)}
            className="flex items-center justify-between"
          >
            <span className={priorityConfig[p].color}>
              {priorityConfig[p].label}
            </span>
            <span className="text-xs text-muted-foreground">
              {priorityConfig[p].description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
