"use client";

/**
 * Kanban Board Component
 * Drag-and-drop task management with status columns
 */

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/features/tasks/components/PriorityBadge";
import {
  GripVertical,
  Calendar,
  Clock,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Column types for Kanban
type ColumnType = "Todo" | "InProgress" | "Done";

interface Column {
  id: ColumnType;
  title: string;
  color: string;
  bgColor: string;
}

const columns: Column[] = [
  {
    id: "Todo",
    title: "To Do",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/50",
  },
  {
    id: "InProgress",
    title: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "Done",
    title: "Done",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
];

// Sortable Task Card Component
function SortableTaskCard({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);

    if (isPast(date) && !task.completed) {
      return (
        <span className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Overdue
        </span>
      );
    }
    if (isToday(date)) {
      return (
        <span className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Today
        </span>
      );
    }
    if (isTomorrow(date)) {
      return (
        <span className="text-blue-500 dark:text-blue-400 text-xs flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Tomorrow
        </span>
      );
    }
    return (
      <span className="text-muted-foreground text-xs flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {format(date, "MMM d")}
      </span>
    );
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-white dark:bg-slate-800 rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing",
        "hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task.id)}
                className="mt-0.5"
              />
              <span
                className={cn(
                  "font-medium text-sm",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </span>
            </div>
            {task.priority && <PriorityBadge priority={task.priority} size="sm" />}
          </div>

          <div className="flex items-center gap-3 mt-2 ml-6">
            {getDueDateDisplay()}
            {task.estimatedMinutes && (
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimatedMinutes}m
              </span>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] px-1 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2 ml-6 text-xs text-muted-foreground">
              {task.subtasks.filter((s) => s.completed).length}/
              {task.subtasks.length} subtasks
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Task Card for Drag Overlay
function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-xl p-3 cursor-grabbing ring-2 ring-primary opacity-90">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <span className="font-medium text-sm">{task.title}</span>
        {task.priority && <PriorityBadge priority={task.priority} size="sm" />}
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  column,
  tasks,
  onToggleTask,
  onAddTask,
}: {
  column: Column;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (status: ColumnType) => void;
}) {
  return (
    <div
      className={cn(
        "flex-1 min-w-[280px] max-w-[360px] rounded-xl p-4",
        column.bgColor
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className={cn("font-semibold", column.color)}>{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[100px]">
          <AnimatePresence>
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onToggle={onToggleTask}
              />
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed rounded-lg">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// Main Kanban Board Component
export function KanbanBoard() {
  const { tasks, toggleTask } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const getTasksByStatus = (status: ColumnType) => {
    return tasks.filter((task) => {
      if (status === "Done") return task.completed;
      if (status === "InProgress") return !task.completed && task.tags?.includes("in-progress");
      return !task.completed && !task.tags?.includes("in-progress");
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle status change based on drop zone
    // This would need to be extended to update task status
  };

  const handleAddTask = (status: ColumnType) => {
    // Open task creation modal with pre-selected status
    console.log("Add task to:", status);
  };

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            onToggleTask={toggleTask}
            onAddTask={handleAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCardOverlay task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanBoard;
