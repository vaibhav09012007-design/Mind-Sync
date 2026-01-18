"use client";

/**
 * Time Blocking Component
 * Drag tasks onto calendar to create time blocks
 */

import { useState, useCallback, useMemo } from "react";
import { useStore, Task, CalendarEvent } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import { format, addHours, startOfDay, isSameDay } from "date-fns";
import { Clock, GripVertical, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface TimeBlockingProps {
  selectedDate: Date;
  className?: string;
}

// Time slots from 6 AM to 10 PM
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => i + 6);

export function TimeBlocking({ selectedDate, className }: TimeBlockingProps) {
  const { tasks, events, addEvent } = useStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Get unscheduled tasks (not completed, not already on calendar for this day)
  const unscheduledTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.completed) return false;

      // Check if task is already scheduled as an event today
      const isScheduled = events.some((event) => {
        if (!event.title.includes(task.title)) return false;
        return isSameDay(new Date(event.start), selectedDate);
      });

      return !isScheduled;
    });
  }, [tasks, events, selectedDate]);

  // Get events for selected date
  const dayEvents = useMemo(() => {
    return events.filter((event) =>
      isSameDay(new Date(event.start), selectedDate)
    );
  }, [events, selectedDate]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    // Parse the hour from the droppable ID (format: "timeslot-HH")
    const hour = parseInt(over.id.toString().replace("timeslot-", ""));
    if (isNaN(hour)) return;

    // Create event from task
    const start = new Date(selectedDate);
    start.setHours(hour, 0, 0, 0);

    const duration = task.estimatedMinutes || 30;
    const end = new Date(start.getTime() + duration * 60 * 1000);

    addEvent({
      title: task.title,
      start: start.toISOString(),
      end: end.toISOString(),
      type: "work",
    });

    toast.success(`Scheduled "${task.title}" at ${format(start, "h:mm a")}`);
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className={cn("flex gap-4 h-full", className)}>
        {/* Unscheduled Tasks Panel */}
        <Card className="w-64 flex-shrink-0 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Unscheduled
          </h3>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-2 pr-2">
              {unscheduledTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All tasks scheduled!
                </p>
              ) : (
                unscheduledTasks.map((task) => (
                  <DraggableTask key={task.id} task={task} />
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Time Grid */}
        <Card className="flex-1 p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {format(selectedDate, "EEEE, MMMM d")}
            </h3>
            <Badge variant="secondary">
              {dayEvents.length} events
            </Badge>
          </div>

          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="relative">
              {TIME_SLOTS.map((hour) => (
                <TimeSlot
                  key={hour}
                  hour={hour}
                  events={dayEvents.filter((e) => {
                    const eventHour = new Date(e.start).getHours();
                    return eventHour === hour;
                  })}
                  date={selectedDate}
                />
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow-xl">
            <p className="text-sm font-medium">{activeTask.title}</p>
            {activeTask.estimatedMinutes && (
              <p className="text-xs opacity-75">
                {activeTask.estimatedMinutes} min
              </p>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Draggable Task Component
function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border cursor-grab",
        "bg-card hover:bg-accent transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        {task.estimatedMinutes && (
          <p className="text-xs text-muted-foreground">
            {task.estimatedMinutes} min
          </p>
        )}
      </div>
    </div>
  );
}

// Time Slot Component
function TimeSlot({
  hour,
  events,
  date,
}: {
  hour: number;
  events: CalendarEvent[];
  date: Date;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${hour}`,
  });

  const timeLabel = format(new Date().setHours(hour, 0, 0, 0), "h a");

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[60px] border-b border-border/50",
        isOver && "bg-primary/10"
      )}
    >
      {/* Time Label */}
      <div className="w-16 flex-shrink-0 text-xs text-muted-foreground py-2 pr-2 text-right">
        {timeLabel}
      </div>

      {/* Slot Content */}
      <div
        className={cn(
          "flex-1 border-l border-border/50 px-2 py-1",
          isOver && "border-primary border-2 border-dashed rounded-lg"
        )}
      >
        {events.length > 0 ? (
          <div className="space-y-1">
            {events.map((event) => (
              <EventBlock key={event.id} event={event} />
            ))}
          </div>
        ) : isOver ? (
          <div className="flex items-center justify-center h-full text-sm text-primary">
            <Plus className="h-4 w-4 mr-1" />
            Drop to schedule
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Event Block Component
function EventBlock({ event }: { event: CalendarEvent }) {
  const startTime = format(new Date(event.start), "h:mm a");
  const endTime = format(new Date(event.end), "h:mm a");

  const bgColor =
    event.type === "meeting"
      ? "bg-blue-500/20 border-blue-500/50"
      : event.type === "personal"
        ? "bg-green-500/20 border-green-500/50"
        : "bg-purple-500/20 border-purple-500/50";

  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1.5",
        bgColor
      )}
    >
      <p className="text-sm font-medium truncate">{event.title}</p>
      <p className="text-xs text-muted-foreground">
        {startTime} - {endTime}
      </p>
    </div>
  );
}

export default TimeBlocking;
