"use client";

/**
 * Responsive Kanban Board Component
 * Mobile-optimized with horizontal scroll and touch gestures
 */

import { useState, useRef, useEffect } from "react";
import { useStore, Task, Column } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/features/tasks/components/PriorityBadge";
import { SwipeableTask } from "@/components/mobile/SwipeableTask";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Calendar,
  Clock,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ResponsiveKanbanProps {
  className?: string;
}

export function ResponsiveKanban({ className }: ResponsiveKanbanProps) {
  const { tasks, columns, toggleTask, viewSettings } = useStore();
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Group tasks by column
  const getTasksByColumn = (columnId: string) => {
    return tasks.filter((task) => {
      if (task.columnId === columnId) return true;
      if (!task.columnId) {
        if (columnId === "Done") return task.completed;
        if (columnId === "Todo") return !task.completed;
      }
      return false;
    });
  };

  // Navigate columns on mobile
  const navigateColumn = (direction: "prev" | "next") => {
    const newIndex =
      direction === "next"
        ? Math.min(activeColumnIndex + 1, columns.length - 1)
        : Math.max(activeColumnIndex - 1, 0);
    setActiveColumnIndex(newIndex);

    // Scroll to column
    if (scrollRef.current) {
      const columnWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: newIndex * columnWidth,
        behavior: "smooth",
      });
    }
  };

  // Handle scroll snap on mobile
  const handleScroll = () => {
    if (!scrollRef.current || !isMobile) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const columnWidth = scrollRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / columnWidth);
    if (newIndex !== activeColumnIndex) {
      setActiveColumnIndex(newIndex);
    }
  };

  return (
    <div className={cn("relative h-full", className)}>
      {/* Mobile Column Indicators */}
      {isMobile && (
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-background/95 backdrop-blur-sm py-2 px-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateColumn("prev")}
            disabled={activeColumnIndex === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {columns.map((col, i) => (
              <button
                key={col.id}
                onClick={() => {
                  setActiveColumnIndex(i);
                  scrollRef.current?.scrollTo({
                    left: i * (scrollRef.current?.offsetWidth || 0),
                    behavior: "smooth",
                  });
                }}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  i === activeColumnIndex
                    ? "w-6 bg-primary"
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateColumn("next")}
            disabled={activeColumnIndex === columns.length - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Column title (mobile) */}
      {isMobile && (
        <div className="mb-3 px-2">
          <h2 className={cn("text-lg font-semibold", columns[activeColumnIndex]?.color)}>
            {columns[activeColumnIndex]?.title}
          </h2>
          <Badge variant="secondary" className="text-xs mt-1">
            {getTasksByColumn(columns[activeColumnIndex]?.id || "").length} tasks
          </Badge>
        </div>
      )}

      {/* Scrollable Columns Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory",
          isMobile && "scroll-smooth",
          "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        )}
        style={{
          scrollSnapType: isMobile ? "x mandatory" : "none",
        }}
      >
        {columns.map((column) => (
          <KanbanColumnCard
            key={column.id}
            column={column}
            tasks={getTasksByColumn(column.id)}
            onToggleTask={toggleTask}
            isMobile={isMobile}
            isCompact={viewSettings.density === "compact"}
          />
        ))}
      </div>
    </div>
  );
}

// Column Card Component
function KanbanColumnCard({
  column,
  tasks,
  onToggleTask,
  isMobile,
  isCompact,
}: {
  column: Column;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  isMobile: boolean;
  isCompact: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-shrink-0 snap-center",
        isMobile ? "w-full" : "w-[300px] min-w-[280px]"
      )}
    >
      <Card
        className={cn(
          "h-full p-4",
          column.bgColor,
          "border-border/50"
        )}
      >
        {/* Column Header (desktop only) */}
        {!isMobile && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn("font-semibold", column.color)}>
              {column.title}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
              {column.wipLimit && `/${column.wipLimit}`}
            </Badge>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {isMobile ? (
                  <SwipeableTask
                    onComplete={() => onToggleTask(task.id)}
                    onDelete={() => {/* handle delete */}}
                  >
                    <MobileTaskCard
                      task={task}
                      onToggle={onToggleTask}
                      isCompact={isCompact}
                    />
                  </SwipeableTask>
                ) : (
                  <DesktopTaskCard
                    task={task}
                    onToggle={onToggleTask}
                    isCompact={isCompact}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              No tasks
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Mobile Task Card
function MobileTaskCard({
  task,
  onToggle,
  isCompact,
}: {
  task: Task;
  onToggle: (id: string) => void;
  isCompact: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg",
        isCompact ? "p-2" : "p-3"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          {!isCompact && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}
              {task.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.estimatedMinutes}m
                </span>
              )}
            </div>
          )}
        </div>
        {task.priority && <PriorityBadge priority={task.priority} size="sm" />}
      </div>
    </div>
  );
}

// Desktop Task Card
function DesktopTaskCard({
  task,
  onToggle,
  isCompact,
}: {
  task: Task;
  onToggle: (id: string) => void;
  isCompact: boolean;
}) {
  const getDueDateStyle = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    if (isPast(date) && !task.completed) return "text-red-500";
    if (isToday(date)) return "text-amber-500";
    if (isTomorrow(date)) return "text-blue-500";
    return "text-muted-foreground";
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg cursor-grab hover:shadow-md transition-shadow",
        isCompact ? "p-2" : "p-3"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-1 opacity-0 group-hover:opacity-100" />
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-0.5"
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
          {!isCompact && (
            <div className="flex items-center gap-3 mt-2">
              {task.dueDate && (
                <span className={cn("flex items-center gap-1 text-xs", getDueDateStyle())}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                </span>
              )}
            </div>
          )}
        </div>
        {task.priority && <PriorityBadge priority={task.priority} size="sm" />}
      </div>
    </div>
  );
}

export default ResponsiveKanban;
