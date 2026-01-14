"use client";

import { useStore, Task, Column, Priority } from "@/store/useStore";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/features/tasks/components/PriorityBadge";
import { GripVertical, Plus } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";

// Reusing SortableTaskCard logic but simplified for swimlanes if needed
// For now, let's duplicate the core card to avoid circular deps or complex prop drilling
// In a real refactor, we'd extract `TaskCard` to a shared component.

function SwimlaneTaskCard({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const { viewSettings } = useStore();

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-md border bg-white p-2 text-sm shadow-sm active:cursor-grabbing dark:bg-slate-800",
        "flex items-center gap-2 transition-shadow hover:shadow-md",
        isDragging && "ring-primary opacity-50 shadow-lg ring-2"
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="h-4 w-4"
      />
      <span
        className={cn("flex-1 truncate", task.completed && "text-muted-foreground line-through")}
      >
        {task.title}
      </span>
      {viewSettings.density !== "compact" && task.priority && (
        <PriorityBadge priority={task.priority} size="sm" />
      )}
    </div>
  );
}

function SwimlaneCell({
  column,
  groupByValue,
  tasks,
  onToggle,
}: {
  column: Column;
  groupByValue: string;
  tasks: Task[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className={cn("h-full min-w-[200px] flex-1 border-r p-2 last:border-r-0", column.bgColor)}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-[50px] space-y-2">
          {tasks.map((task) => (
            <SwimlaneTaskCard key={task.id} task={task} onToggle={onToggle} />
          ))}
          {tasks.length === 0 && (
            <div className="h-12 rounded-md border-2 border-dashed border-slate-200 dark:border-slate-800" />
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function SwimlaneBoard() {
  const { tasks, columns, viewSettings, updateTask, toggleTask } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Grouping Logic
  const swimlanes =
    viewSettings.swimlaneGroupBy === "priority" ? ["P0", "P1", "P2", "P3"] : ["Unassigned"]; // Fallback

  const getTasks = (columnId: string, laneValue: string) => {
    return tasks.filter((t) => {
      const matchesColumn =
        t.columnId === columnId ||
        (!t.columnId &&
          ((columnId === "Done" && t.completed) ||
            (columnId === "InProgress" && !t.completed && t.tags?.includes("in-progress")) ||
            (columnId === "Todo" && !t.completed && !t.tags?.includes("in-progress"))));

      if (!matchesColumn) return false;

      if (viewSettings.swimlaneGroupBy === "priority") {
        return (t.priority || "P2") === laneValue; // Default P2
      }
      return true;
    });
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    // Logic to determine drop target is trickier in matrix
    // We need to know which Column AND which Swimlane we dropped into.
    // If we drop onto a Task, we inherit its Column & Priority.

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (activeTask && overTask) {
      let updates: Partial<Task> = {};

      // Update Column
      let targetColumnId = overTask.columnId;
      if (!targetColumnId) {
        if (overTask.completed) targetColumnId = "Done";
        else if (overTask.tags?.includes("in-progress")) targetColumnId = "InProgress";
        else targetColumnId = "Todo";
      }
      if (targetColumnId !== activeTask.columnId) {
        updates.columnId = targetColumnId;
        // Handle completion toggle
        if (targetColumnId === "Done" && !activeTask.completed) toggleTask(activeTask.id);
        else if (targetColumnId !== "Done" && activeTask.completed) toggleTask(activeTask.id);
      }

      // Update Priority (Swimlane)
      if (viewSettings.swimlaneGroupBy === "priority") {
        if (overTask.priority && overTask.priority !== activeTask.priority) {
          updates.priority = overTask.priority;
        }
      }

      if (Object.keys(updates).length > 0) {
        updateTask(activeTask.id, updates);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="flex border-b">
            <div className="text-muted-foreground w-32 shrink-0 p-4 font-semibold">
              {viewSettings.swimlaneGroupBy === "priority" ? "Priority" : "Group"}
            </div>
            {columns.map((col) => (
              <div key={col.id} className={cn("flex-1 p-3 font-medium", col.color)}>
                {col.title}
              </div>
            ))}
          </div>

          {/* Swimlanes */}
          {swimlanes.map((lane) => (
            <div key={lane} className="flex min-h-[120px] border-b last:border-b-0">
              <div className="flex w-32 shrink-0 items-center border-r bg-slate-50 p-4 text-sm font-medium dark:bg-slate-900/50">
                {lane === "P0" && <span className="text-red-600">Urgent (P0)</span>}
                {lane === "P1" && <span className="text-orange-600">High (P1)</span>}
                {lane === "P2" && <span className="text-blue-600">Normal (P2)</span>}
                {lane === "P3" && <span className="text-slate-500">Low (P3)</span>}
                {!["P0", "P1", "P2", "P3"].includes(lane) && lane}
              </div>
              {columns.map((col) => (
                <SwimlaneCell
                  key={`${lane}-${col.id}`}
                  column={col}
                  groupByValue={lane}
                  tasks={getTasks(col.id, lane)}
                  onToggle={toggleTask}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeId ? <div className="rounded border bg-white p-2 shadow-lg">Dragging...</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
