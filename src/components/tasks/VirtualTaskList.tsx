"use client";

/**
 * Virtual Task List Component
 * Efficiently renders long lists of tasks using virtualization
 */

import { useMemo, memo } from "react";
import { useVirtualList } from "@/hooks/useVirtualList";
import { Task } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";

interface VirtualTaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onSelect?: (task: Task) => void;
  className?: string;
  itemHeight?: number;
}

// Memoized task row component
const TaskRow = memo(function TaskRow({
  task,
  onToggle,
  onSelect,
  style,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onSelect?: (task: Task) => void;
  style: React.CSSProperties;
}) {
  const getDueDateBadge = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);

    if (isPast(date) && !task.completed) {
      return (
        <Badge variant="destructive" className="text-xs px-1.5 py-0">
          Overdue
        </Badge>
      );
    }
    if (isToday(date)) {
      return (
        <Badge variant="outline" className="text-xs px-1.5 py-0 border-amber-500 text-amber-600">
          Today
        </Badge>
      );
    }
    if (isTomorrow(date)) {
      return (
        <Badge variant="outline" className="text-xs px-1.5 py-0 border-blue-500 text-blue-600">
          Tomorrow
        </Badge>
      );
    }
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {format(date, "MMM d")}
      </span>
    );
  };

  return (
    <div
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 py-2 border-b border-border/50",
        "hover:bg-accent/50 cursor-pointer transition-colors",
        task.completed && "opacity-60"
      )}
      onClick={() => onSelect?.(task)}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-0.5">
          {getDueDateBadge()}

          {task.estimatedMinutes && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes}m
            </span>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
            </span>
          )}
        </div>
      </div>

      {task.priority && (
        <div
          className={cn(
            "h-2 w-2 rounded-full flex-shrink-0",
            task.priority === "P0" && "bg-red-500",
            task.priority === "P1" && "bg-orange-500",
            task.priority === "P2" && "bg-blue-500",
            task.priority === "P3" && "bg-slate-400"
          )}
        />
      )}
    </div>
  );
});

export function VirtualTaskList({
  tasks,
  onToggle,
  onSelect,
  className,
  itemHeight = 56,
}: VirtualTaskListProps) {
  const { virtualItems, totalHeight, containerRef } = useVirtualList({
    items: tasks,
    itemHeight,
    overscan: 5,
  });

  if (tasks.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8 text-muted-foreground", className)}>
        No tasks found
      </div>
    );
  }

  // For small lists, don't virtualize
  if (tasks.length < 20) {
    return (
      <div className={cn("overflow-y-auto", className)}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={onToggle}
            onSelect={onSelect}
            style={{}}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-y-auto relative", className)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {virtualItems.map(({ item, index, style }) => (
          <TaskRow
            key={item.id}
            task={item}
            onToggle={onToggle}
            onSelect={onSelect}
            style={style}
          />
        ))}
      </div>
    </div>
  );
}
