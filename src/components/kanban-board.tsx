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
  useDroppable,
} from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, useStore, Column } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/features/tasks/components/PriorityBadge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GripVertical,
  Calendar,
  Clock,
  MoreHorizontal,
  Plus,
  Image as ImageIcon,
  User,
  Eye,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { BulkActionBar } from "@/components/kanban/bulk-action-bar";
import { TaskPreviewDialog } from "@/components/kanban/task-preview-dialog";

// Sortable Task Card Component
function SortableTaskCard({
  task,
  onToggle,
  isSelected,
  onSelect,
  selectionMode,
}: {
  task: Task;
  onToggle: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  selectionMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const { viewSettings, tasks } = useStore();
  const isCompact = viewSettings.density === "compact";

  // Check if task is blocked by another task
  const blockingTask = task.dependsOn ? tasks.find((t) => t.id === task.dependsOn) : null;
  const isBlocked = blockingTask && !blockingTask.completed;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);

    if (isPast(date) && !task.completed) {
      return (
        <span className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
          <Calendar className="h-3 w-3" />
          {!isCompact && "Overdue"}
        </span>
      );
    }
    if (isToday(date)) {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <Calendar className="h-3 w-3" />
          {!isCompact && "Today"}
        </span>
      );
    }
    if (isTomorrow(date)) {
      return (
        <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
          <Calendar className="h-3 w-3" />
          {!isCompact && "Tomorrow"}
        </span>
      );
    }
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <Calendar className="h-3 w-3" />
        {format(date, "MMM d")}
      </span>
    );
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "border-border bg-card cursor-grab rounded-lg border shadow-sm active:cursor-grabbing",
        "group hover:border-primary/30 card-hover relative transition-all duration-200 hover:shadow-lg",
        isDragging && "ring-primary opacity-50 shadow-xl ring-2",
        isSelected && "border-primary bg-primary/10 ring-primary ring-2",
        isBlocked && "opacity-60 border-orange-300 dark:border-orange-700",
        isCompact ? "p-2" : "p-3"
      )}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || selectionMode) {
          e.preventDefault();
          e.stopPropagation();
          onSelect(task.id);
        }
      }}
    >
      {/* Blocked Indicator */}
      {isBlocked && (
        <div className="absolute -top-2 -right-2 z-10 rounded-full bg-orange-500 p-1" title={`Blocked by: ${blockingTask?.title}`}>
          <Lock className="h-3 w-3 text-white" />
        </div>
      )}
      {/* Cover Image */}
      {viewSettings.showCoverImages && task.coverImage && !isCompact && (
        <div className="relative mb-3 h-32 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-900">
          <img src={task.coverImage} alt={task.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {!isCompact && (
          <GripVertical className="text-muted-foreground/50 mt-1 h-4 w-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectionMode ? isSelected : task.completed}
                onCheckedChange={() => {
                  if (selectionMode) onSelect(task.id);
                  else onToggle(task.id);
                }}
                className={cn(
                  "mt-0.5",
                  selectionMode ? "border-blue-500 data-[state=checked]:bg-blue-500" : ""
                )}
              />
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  task.completed && !selectionMode && "text-muted-foreground line-through"
                )}
              >
                {task.title}
              </span>
            </div>
            {task.priority && !isCompact && <PriorityBadge priority={task.priority} size="sm" />}
            {task.priority && isCompact && (
              <div
                className={cn(
                  "h-2 w-2 flex-shrink-0 rounded-full",
                  task.priority === "P0"
                    ? "bg-red-500"
                    : task.priority === "P1"
                      ? "bg-orange-500"
                      : task.priority === "P2"
                        ? "bg-blue-500"
                        : "bg-slate-500"
                )}
              />
            )}
          </div>

          {!isCompact && (
            <>
              <div className="mt-2 ml-6 flex items-center gap-3">
                {getDueDateDisplay()}
                {task.estimatedMinutes && (
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {task.estimatedMinutes}m
                  </span>
                )}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex gap-1">
                    {task.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-1 py-0 text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtask Progress */}
              {totalSubtasks > 0 && (
                <div className="mt-2 ml-6 space-y-1">
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>
                      {completedSubtasks}/{totalSubtasks} subtasks
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}

              {/* Footer with Assignees */}
              {task.assignees && task.assignees.length > 0 && (
                <div className="mt-3 ml-6 flex -space-x-2 overflow-hidden">
                  {task.assignees.map((assignee, i) => (
                    <Avatar key={i} className="ring-background inline-block h-6 w-6 ring-2">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {assignee.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Task Card for Drag Overlay
function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="ring-primary border-primary/50 bg-card animate-pulse-glow cursor-grabbing rounded-lg border p-3 shadow-2xl ring-2">
      <div className="flex items-center gap-2">
        <GripVertical className="text-muted-foreground/50 h-4 w-4" />
        <span className="text-sm font-medium">{task.title}</span>
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
  selectedIds,
  onSelectTask,
}: {
  column: Column;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (columnId: string) => void;
  selectedIds: string[];
  onSelectTask: (id: string) => void;
}) {
  const isOverLimit =
    column.wipLimit && tasks.length > column.wipLimit && column.id === "InProgress";

  // Make column a droppable zone for empty states
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex max-h-[calc(100vh-12rem)] max-w-[360px] min-w-[280px] flex-1 flex-col rounded-xl p-4",
        "bg-muted/30 border",
        isOverLimit && "bg-destructive/10 ring-destructive/20 ring-2",
        isOver && "ring-primary ring-2 ring-inset"
      )}
    >
      <div className="mb-4 flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className={cn("font-semibold", column.color)}>{column.title}</h3>
          <Badge variant={isOverLimit ? "destructive" : "secondary"} className="text-xs">
            {tasks.length}
            {column.wipLimit ? `/${column.wipLimit}` : ""}
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

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 min-h-[100px] flex-1 space-y-2 overflow-y-auto pr-1">
          <AnimatePresence>
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                isSelected={selectedIds.includes(task.id)}
                onSelect={onSelectTask}
                selectionMode={selectedIds.length > 0}
              />
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center text-sm">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

import { SwimlaneBoard } from "@/components/kanban/swimlane-board";

// Main Kanban Board Component
export function KanbanBoard() {
  const { tasks, toggleTask, updateTask, columns, viewSettings } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewTask, setPreviewTask] = useState<Task | null>(null);

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

  // Group tasks by status (or columnId if present)
  const getTasksByStatus = (columnId: string) => {
    return tasks.filter((task) => {
      // Explicit assignment
      if (task.columnId === columnId) return true;

      // Fallback for legacy/unmigrated data
      if (!task.columnId) {
        if (columnId === "Done") return task.completed;
        if (columnId === "InProgress") return !task.completed && task.tags?.includes("in-progress");
        if (columnId === "Todo") return !task.completed && !task.tags?.includes("in-progress");
      }
      return false;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // In dnd-kit sortable, dropping A over B implies A should be in B's list.
    const overTask = tasks.find((t) => t.id === over.id);
    let targetColumnId = overTask?.columnId;

    // Fallback if overTask doesn't have columnId
    if (!targetColumnId && overTask) {
      if (overTask.completed) targetColumnId = "Done";
      else if (overTask.tags?.includes("in-progress")) targetColumnId = "InProgress";
      else targetColumnId = "Todo";
    }

    // Check if we dropped directly onto a column (e.g., empty state)
    if (!targetColumnId && columns.some((c) => c.id === over.id)) {
      targetColumnId = over.id as string;
    }

    if (targetColumnId && targetColumnId !== activeTask.columnId) {
      updateTask(activeTask.id, { columnId: targetColumnId });

      if (targetColumnId === "Done" && !activeTask.completed) {
        toggleTask(activeTask.id);
      } else if (targetColumnId !== "Done" && activeTask.completed) {
        toggleTask(activeTask.id);
      }
    }
  };

  const handleAddTask = (columnId: string) => {
    console.log("Add task to:", columnId);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  if (viewSettings.mode === "swimlane") {
    return <SwimlaneBoard />;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id)}
              onToggleTask={toggleTask}
              onAddTask={handleAddTask}
              selectedIds={selectedIds}
              onSelectTask={toggleSelection}
            />
          ))}
        </div>

        <DragOverlay>{activeTask && <TaskCardOverlay task={activeTask} />}</DragOverlay>

        <BulkActionBar selectedIds={selectedIds} onClearSelection={() => setSelectedIds([])} />
      </DndContext>

      <TaskPreviewDialog
        task={previewTask}
        open={!!previewTask}
        onOpenChange={(open) => !open && setPreviewTask(null)}
      />
    </>
  );
}

export default KanbanBoard;
