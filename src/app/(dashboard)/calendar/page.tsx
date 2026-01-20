"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, MapPin, Repeat } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, CalendarEvent } from "@/store/useStore";
import { useCalendarSync } from "@/hooks/use-calendar-sync";
// Import new components
import {
  CalendarViewTabs,
  CalendarViewType,
} from "@/features/calendar/components/CalendarViewTabs";
import { WeekView } from "@/features/calendar/components/WeekView";
import { DayView } from "@/features/calendar/components/DayView";
import { AgendaView } from "@/features/calendar/components/AgendaView";
import { QuickAddPopover } from "@/features/calendar/components/QuickAddPopover";
import { EVENT_STYLES } from "@/features/calendar/components/calendar-utils";
import { CalendarSyncStatus } from "@/components/calendar/calendar-sync-status";
import { GlassCard } from "@/components/ui/card";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const { events, setSelectedDate, addEvent } = useStore();
  const { pushToGoogle, hasGoogleAccount } = useCalendarSync();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>("month");

  // Dialog & Popover State
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState<{ date: Date; time: string } | null>(null);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  // Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("09:00");
  const [newEventEnd, setNewEventEnd] = useState("10:00");
  const [newEventType, setNewEventType] = useState("work");
  const [recurrenceFreq, setRecurrenceFreq] = useState("none");

  // Navigation handlers
  const navigate = (direction: "prev" | "next") => {
    if (view === "month") {
      setCurrentDate((curr) => (direction === "next" ? addMonths(curr, 1) : subMonths(curr, 1)));
    } else if (view === "week") {
      setCurrentDate((curr) => (direction === "next" ? addWeeks(curr, 1) : subWeeks(curr, 1)));
    } else if (view === "day") {
      setCurrentDate((curr) => (direction === "next" ? addDays(curr, 1) : subDays(curr, 1)));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Month Grid Generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startDate,
        end: endDate,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startDate.getTime(), endDate.getTime()]
  );

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Switch to day view for that date instead of dashboard
    setCurrentDate(date);
    setView("day");
  };

  const handleQuickAddTrigger = (date: Date, timeStr: string) => {
    setQuickAddData({ date, time: timeStr });
    setQuickAddOpen(true);
  };

  const handleQuickAddSave = (event: { title: string; start: Date; end: Date; type: string }) => {
    const newEvent = {
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      type: event.type as "work" | "meeting" | "personal",
    };
    addEvent(newEvent);

    // Sync to Google Calendar if connected
    if (hasGoogleAccount) {
      const eventForSync: CalendarEvent = {
        id: crypto.randomUUID(),
        ...newEvent,
        recurrence: null,
      };
      pushToGoogle(eventForSync);
    }
    setQuickAddOpen(false);
  };

  const handleSaveEvent = () => {
    if (!newEventTitle) return;

    const [startH, startM] = newEventStart.split(":").map(Number);
    const [endH, endM] = newEventEnd.split(":").map(Number);

    const start = new Date(currentDate);
    start.setHours(startH, startM);

    const end = new Date(currentDate);
    end.setHours(endH, endM);

    // Basic validation
    if (end < start) end.setHours(startH + 1);

    const recurrence =
      recurrenceFreq !== "none"
        ? {
            frequency: recurrenceFreq as "daily" | "weekly" | "monthly" | "yearly",
            interval: 1,
          }
        : null;

    const newEvent = {
      title: newEventTitle,
      start: start.toISOString(),
      end: end.toISOString(),
      type: newEventType as "work" | "meeting" | "personal",
      recurrence,
    };

    addEvent(newEvent);

    // Sync to Google Calendar if connected
    if (hasGoogleAccount) {
      const eventForSync: CalendarEvent = {
        id: crypto.randomUUID(),
        ...newEvent,
      };
      pushToGoogle(eventForSync);
    }

    setNewEventOpen(false);
    setNewEventTitle("");
    setRecurrenceFreq("none");
  };

  if (!hydrated) return null;

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight gradient-text w-fit truncate">
            {view === "agenda"
              ? "Agenda"
              : format(currentDate, view === "day" ? "MMMM d, yyyy" : "MMMM yyyy")}
            {view === "week" && (
              <span className="text-muted-foreground ml-2 hidden text-lg font-normal lg:inline">
                Week of {format(startOfWeek(currentDate), "MMM d")}
              </span>
            )}
          </h1>
          <div className="bg-background flex items-center gap-1 rounded-md border p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday} className="hidden sm:flex">
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarSyncStatus />
          <CalendarViewTabs currentView={view} onViewChange={setView} />

          <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Event</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>Add a new event to your calendar.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    placeholder="Marketing Sync"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start">Start Time</Label>
                    <Input
                      id="start"
                      type="time"
                      value={newEventStart}
                      onChange={(e) => setNewEventStart(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end">End Time</Label>
                    <Input
                      id="end"
                      type="time"
                      value={newEventEnd}
                      onChange={(e) => setNewEventEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={newEventType} onValueChange={setNewEventType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work">Deep Work</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Repeat</Label>
                    <Select value={recurrenceFreq} onValueChange={setRecurrenceFreq}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Does not repeat</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveEvent}>Save Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <QuickAddPopover
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSave={handleQuickAddSave}
        initialDate={quickAddData?.date}
        initialTime={quickAddData?.time}
      />

      {/* View Rendering */}
      <GlassCard hover="none" className="flex-1 overflow-hidden shadow-sm p-0 flex flex-col">
        {view === "month" && (
          <div className="flex h-full flex-col overflow-x-auto">
            <div className="flex h-full min-w-[600px] flex-col">
              {/* Month Header */}
              <div className="bg-black/5 dark:bg-white/5 grid grid-cols-7 border-b border-black/5 dark:border-white/10 py-3 text-center">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-muted-foreground text-xs font-medium tracking-widest uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div className="grid flex-1 grid-cols-7 grid-rows-5 divide-x divide-y lg:grid-rows-6">
                {calendarDays.map((day, i) => {
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isDayToday = isToday(day);
                  const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), day));

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "hover:bg-black/5 dark:hover:bg-white/5 group relative flex min-h-[100px] cursor-pointer flex-col gap-1 p-2 transition-all border-b border-r border-black/5 dark:border-white/5",
                        !isCurrentMonth && "bg-black/5 dark:bg-white/5 text-muted-foreground/30",
                        isDayToday && "bg-primary/10 shadow-[inset_0_0_20px_rgba(255,215,0,0.15)]"
                      )}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={cn(
                            "group-hover:bg-muted flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors",
                            isDayToday &&
                              "bg-primary text-primary-foreground group-hover:bg-primary"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>

                      {/* Render Events */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 4).map((event) => {
                          const styles = EVENT_STYLES[event.type || "work"];
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "cursor-pointer truncate rounded-sm border-l-2 py-0.5 pl-1 text-[10px] transition-colors",
                                styles.bg,
                                styles.text,
                                styles.border
                              )}
                            >
                              <span className="mr-1 opacity-70">
                                {format(parseISO(event.start), "ha")}
                              </span>
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 4 && (
                          <div className="text-muted-foreground pl-1 text-[10px]">
                            + {dayEvents.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === "week" && (
          <WeekView
            date={currentDate}
            onAddEvent={handleQuickAddTrigger}
            onEditEvent={(id) => console.log("Edit", id)}
          />
        )}

        {view === "day" && (
          <DayView
            date={currentDate}
            onAddEvent={(time) => handleQuickAddTrigger(currentDate, time)}
          />
        )}

        {view === "agenda" && <AgendaView />}
      </GlassCard>
    </div>
  );
}
