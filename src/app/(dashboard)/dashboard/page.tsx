"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { useStore, Task } from "@/store/useStore";
import {
  format,
  isSameDay,
  parseISO,
  startOfDay,
  addMinutes,
  setHours,
  setMinutes,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, Wand2, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";
import { EditEventDialog } from "@/features/dashboard/components/EditEventDialog";
import { TaskColumn } from "@/features/dashboard/components/TaskColumn";
import { TimeGrid, GridEvent } from "@/features/calendar/components/TimeGrid";
import { PlanDayWizard, SchedulePreferences } from "@/features/dashboard/components/PlanDayWizard";
import { syncGoogleCalendar, generateSchedule } from "@/app/actions";
import { smartReschedule } from "@/lib/smartReschedule";

export default function DashboardPage() {
  const { events, selectedDate, setSelectedDate, addEvent, updateEvent } = useStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Edit Modal State
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Safe Date Parsing
  const currentDate = selectedDate ? parseISO(selectedDate) : new Date();

  // Navigate Days
  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  // Map Store Events to Grid Format
  const dayEvents: GridEvent[] = events
    .filter((e) => isSameDay(parseISO(e.start), currentDate))
    .map((e) => {
      const start = parseISO(e.start);
      const end = parseISO(e.end);
      const duration = (end.getTime() - start.getTime()) / 60000;
      const startMinutes = start.getHours() * 60 + start.getMinutes();

      return {
        id: e.id,
        title: e.title,
        start: startMinutes,
        duration: duration,
        timeString: `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`,
        type: e.type as GridEvent["type"],
      };
    });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncGoogleCalendar();

      if (result.success) {
        toast.success(`Synced ${result.data.count} events from Google Calendar.`);
      } else {
        if (result.error === "No Google Token") {
          toast.error("Google Account not connected.", {
            description: "Please connect your Google Calendar in your Profile settings.",
          });
        } else {
          toast.error("Sync failed: " + result.error);
        }
      }
    } catch (err) {
      console.error("Sync Error:", err);
      toast.error("An unexpected error occurred during sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePlanDay = async (preferences: SchedulePreferences) => {
    setIsPlanning(true);
    toast.info("Consulting AI to plan your day...", { duration: 3000 });
    try {
      // Pass preferences to the schedule generator
      const result = await generateSchedule();
      if (result.success) {
        toast.success(`AI scheduled ${result.data.count} tasks!`, {
          description: `Using ${preferences.focusDuration} min blocks based on your ${preferences.energyLevel} energy level.`,
        });
      } else {
        toast.error(result.error || "Failed to generate schedule");
      }
    } catch (err) {
      console.error("Planning Error:", err);
      toast.error("Failed to plan day.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSmartReschedule = () => {
    // Get current events for today
    const todayEvents = events
      .filter((e) => isSameDay(parseISO(e.start), currentDate))
      .map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        type: e.type,
        isFixed: e.type === "meeting", // Meetings are fixed
      }));

    if (todayEvents.length === 0) {
      toast.info("No events to reschedule");
      return;
    }

    // Reschedule with 5 minute delay and buffers
    const result = smartReschedule(todayEvents, 0, {
      bufferMinutes: 5,
      respectFixedEvents: true,
    });

    // Update events in store
    result.changes.forEach((change) => {
      const event = events.find((e) => e.id === change.eventId);
      if (event) {
        const newEvent = result.events.find((e) => e.id === change.eventId);
        if (newEvent) {
          updateEvent(change.eventId, {
            start: newEvent.start,
            end: newEvent.end,
          });
        }
      }
    });

    if (result.changes.length > 0) {
      toast.success(`Rescheduled ${result.changes.length} events with buffer times`);
    } else {
      toast.info("Schedule already optimized");
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => toast.warning(w));
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    setActiveTask(event.active.data.current?.task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (over && over.id === "time-grid") {
      const task = active.data.current?.task as Task;
      if (!task) return;

      const start = setMinutes(setHours(currentDate, 9), 0); // Default 9 AM
      const end = addMinutes(start, 60);

      addEvent({
        title: task.title,
        start: start.toISOString(),
        end: end.toISOString(),
        type: "work",
      });

      toast.success("Task scheduled!");
    }
  };

  const handleAddEvent = async (timeStr: string) => {
    const [hour, minute] = timeStr.split(":").map(Number);
    const start = setMinutes(setHours(currentDate, hour), minute);
    const end = addMinutes(start, 60);

    addEvent({
      title: "New Event",
      start: start.toISOString(),
      end: end.toISOString(),
      type: "work",
    });
    toast.success("Event created!");
  };

  const handleEditEvent = (gridEvent: GridEvent) => {
    setEditingEventId(gridEvent.id);
    setEditEventOpen(true);
  };

  const handleResizeEvent = (eventId: string, newDuration: number) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const start = parseISO(event.start);
    const newEnd = addMinutes(start, newDuration);

    updateEvent(eventId, {
      end: newEnd.toISOString(),
    });

    toast.success(`Duration updated to ${newDuration} minutes`);
  };

  if (!hydrated) return null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full flex-col gap-6 overflow-hidden lg:flex-row">
        <TaskColumn currentDate={currentDate} onNextDay={nextDay} onPrevDay={prevDay} />

        <div className="bg-background flex h-full min-w-0 flex-1 flex-col lg:border-l lg:pl-6">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="font-semibold">{format(currentDate, "EEEE, MMM d")}</span>
          </div>

          <div className="mb-2 hidden items-center justify-between lg:flex">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={prevDay}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Prev Day
              </Button>
              <span className="min-w-50 text-center text-lg font-semibold">
                {format(currentDate, "EEEE, MMMM do")}
              </span>
              <Button variant="ghost" onClick={nextDay}>
                Next Day <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSmartReschedule}
                disabled={isPlanning || isSyncing}
                title="Add buffer times between events"
              >
                <Clock className="mr-2 h-4 w-4" />
                Add Buffers
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWizardOpen(true)}
                disabled={isPlanning || isSyncing}
                title="Auto-schedule tasks with AI"
              >
                <Wand2 className={`mr-2 h-4 w-4 ${isPlanning ? "animate-pulse" : ""}`} />
                Plan Day
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing || isPlanning}
                title="Sync with Google Calendar"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
            <TimeGrid
              events={dayEvents}
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
              onResizeEvent={handleResizeEvent}
            />
          </div>
        </div>

        <DragOverlay>
          {activeId && activeTask ? (
            <div className="bg-background flex w-62.5 cursor-grabbing items-center gap-2 rounded-md border p-3 opacity-90 shadow-xl">
              <span className="font-medium">{activeTask.title}</span>
            </div>
          ) : null}
        </DragOverlay>

        <EditEventDialog
          isOpen={editEventOpen}
          onOpenChange={setEditEventOpen}
          eventId={editingEventId}
          currentDate={currentDate}
        />

        {/* Plan Day Wizard */}
        <PlanDayWizard open={wizardOpen} onOpenChange={setWizardOpen} onGenerate={handlePlanDay} />
      </div>
    </DndContext>
  );
}
