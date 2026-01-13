"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { useStore, Task } from "@/store/useStore";
import { format, isSameDay, parseISO, startOfDay, addMinutes, setHours, setMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { EditEventDialog } from "@/features/dashboard/components/EditEventDialog";
import { TaskColumn } from "@/features/dashboard/components/TaskColumn";
import { TimeGrid } from "@/features/calendar/components/TimeGrid";
import { syncGoogleCalendar, generateSchedule } from "@/app/actions";

export default function DashboardPage() {
  const {
    events,
    selectedDate,
    setSelectedDate,
    addEvent,
  } = useStore();

  const [activeId, setActiveId] = useState<string | null>(null);   
  const [activeTask, setActiveTask] = useState<Task | null>(null); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);

  // Edit Modal State
  const [editEventOpen, setEditEventOpen] = useState(false);       
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true) }, []);

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
  const dayEvents = events
    .filter(e => isSameDay(parseISO(e.start), currentDate))        
    .map(e => {
        const start = parseISO(e.start);
        const end = parseISO(e.end);
        const duration = (end.getTime() - start.getTime()) / 60000;
        const startMinutes = start.getHours() * 60 + start.getMinutes();

        return {
            id: e.id,
            title: e.title,
            start: startMinutes,
            duration: duration,
            timeString: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
            type: e.type
        };
    });

  const handleSync = async () => {
      setIsSyncing(true);
      try {
          const result = await syncGoogleCalendar();
          
          if (result.success) {
             toast.success(`Synced ${result.count} events from Google Calendar.`);
          } else {
             if (result.error === "No Google Token") {
                 toast.error("Google Account not connected.", {
                     description: "Please connect your Google Calendar in your Profile settings."
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

  const handlePlanDay = async () => {
      setIsPlanning(true);
      toast.info("Consulting AI to plan your day...", { duration: 3000 });
      try {
          const result = await generateSchedule();
          if (result.success) {
              toast.success(`AI scheduled ${result.count} tasks!`);
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

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    setActiveTask(event.active.data.current?.task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (over && over.id === 'time-grid') {
       const task = active.data.current?.task as Task;
       if (!task) return;

       const start = setMinutes(setHours(currentDate, 9), 0); // Default 9 AM
       const end = addMinutes(start, 60);

       addEvent({
           title: task.title,
           start: start.toISOString(),
           end: end.toISOString(),
           type: 'work'
       });
       
       // Note: Drag-to-schedule currently just updates local/DB. 
       // Pushing back to Google Calendar would require another Server Action.
       toast.success("Task scheduled!"); 
    }
  };

  const handleAddEvent = async (timeStr: string) => {
      const [hour, minute] = timeStr.split(':').map(Number);       
      const start = setMinutes(setHours(currentDate, hour), minute);
      const end = addMinutes(start, 60);

      const title = "New Event";

      addEvent({
           title,
           start: start.toISOString(),
           end: end.toISOString(),
           type: 'work'
       });
       // Same note: Pushing to Google Calendar needs a Server Action.
       toast.success("Event created!");   
  };

  const handleEditEvent = (gridEvent: any) => {
      setEditingEventId(gridEvent.id);
      setEditEventOpen(true);
  };

  if (!hydrated) return null;

  return (
    <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
        <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden">
            <TaskColumn
                currentDate={currentDate}
                onNextDay={nextDay}
                onPrevDay={prevDay}
            />

            <div className="flex-1 h-full min-w-0 bg-background lg:border-l lg:pl-6 flex flex-col">
                 <div className="flex items-center justify-between mb-4 lg:hidden">
                    <span className="font-semibold">{format(currentDate, "EEEE, MMM d")}</span>
                 </div>

                 <div className="hidden lg:flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">     
                        <Button variant="ghost" onClick={prevDay}><ChevronLeft className="mr-2 h-4 w-4" /> Prev Day</Button>
                        <span className="font-semibold text-lg min-w-50 text-center">{format(currentDate, "EEEE, MMMM do")}</span>    
                        <Button variant="ghost" onClick={nextDay}>Next Day <ChevronRight className="ml-2 h-4 w-4" /></Button>
                     </div>

                     <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePlanDay}
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

                <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                    <TimeGrid
                        events={dayEvents}
                        onAddEvent={handleAddEvent}
                        onEditEvent={handleEditEvent}
                    />
                </div>
            </div>

            <DragOverlay>
                {activeId && activeTask ? (
                    <div className="bg-background border rounded-md p-3 shadow-xl w-62.5 opacity-90 cursor-grabbing flex items-center gap-2">
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
        </div>
    </DndContext>
  );
}
