"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState, useEffect } from "react";
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
    parseISO
} from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const { events, setSelectedDate, addEvent } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true) }, []);

  // Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("09:00");
  const [newEventEnd, setNewEventEnd] = useState("10:00");

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Calendar Grid Generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate
  });

  const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      router.push('/dashboard');
  };

  const handleSaveEvent = () => {
      if (!newEventTitle) return;

      const [startH, startM] = newEventStart.split(':').map(Number);
      const [endH, endM] = newEventEnd.split(':').map(Number);

      const start = new Date(currentDate);
      start.setHours(startH, startM);

      const end = new Date(currentDate);
      end.setHours(endH, endM);

      addEvent({
          title: newEventTitle,
          start: start.toISOString(),
          end: end.toISOString(),
          type: 'meeting'
      });

      setNewEventOpen(false);
      setNewEventTitle("");
  };

  if (!hydrated) return null;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight w-48">
                {format(currentDate, "MMMM yyyy")}
            </h1>
            <div className="flex items-center gap-1 border rounded-md p-0.5 bg-background shadow-sm">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToToday}>Today</Button>
            
            <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Event
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                        <DialogDescription>
                            Add a new event to your calendar.
                        </DialogDescription>
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
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveEvent}>Save Event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

            {/* Calendar Grid */}

            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-card shadow-sm overflow-x-auto">

              <div className="min-w-[600px] flex flex-col h-full"> {/* Min width wrapper */}

                  {/* Header Row */}

                  <div className="grid grid-cols-7 border-b text-center py-2 bg-muted/40">

                      {DAYS.map(day => (

                          <div key={day} className="text-xs font-medium text-muted-foreground uppercase tracking-widest">

                              {day}

                          </div>

                      ))}

                  </div>

                  

                  {/* Days Grid */}

                  <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6 divide-x divide-y">

                      {calendarDays.map((day, i) => {

                          const isCurrentMonth = isSameMonth(day, monthStart);

                          const isDayToday = isToday(day);

                          

                          // Filter events for this day

                          const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day));

      

                          return (

                              <div 

                                  key={day.toISOString()} 

                                  className={cn(

                                      "p-2 min-h-[80px] transition-colors hover:bg-muted/5 flex flex-col gap-1 cursor-pointer group",

                                      !isCurrentMonth && "bg-muted/5 text-muted-foreground/50",

                                      isDayToday && "bg-primary/5"

                                  )}

                                  onClick={() => handleDateClick(day)}

                              >

                                  <div className="flex justify-between items-start">

                                      <span className={cn(

                                          "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors group-hover:bg-muted",

                                          isDayToday && "bg-primary text-primary-foreground group-hover:bg-primary"

                                      )}>

                                          {format(day, "d")}

                                      </span>

                                  </div>

                                  

                                  {/* Render Real Events */}

                                  {dayEvents.map(event => (

                                      <div 

                                          key={event.id}

                                          className="text-[10px] bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-500 pl-1 py-0.5 rounded-sm truncate cursor-pointer hover:bg-indigo-500/25"

                                      >

                                          {event.title}

                                      </div>

                                  ))}

                              </div>

                          );

                      })}

                  </div>

              </div>

            </div>

          </div>

        );

      }

      