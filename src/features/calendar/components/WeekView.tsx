"use client";

import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useStore } from "@/store/useStore";
import { useMemo, useRef, useState, useEffect } from "react";
import { calculateEventLayout, EVENT_STYLES } from "./calendar-utils";
import { GridEvent } from "./TimeGrid";

interface WeekViewProps {
  date: Date;
  onAddEvent?: (date: Date, timeStr: string) => void;
  onEditEvent?: (id: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({ date, onAddEvent, onEditEvent }: WeekViewProps) {
  const { events } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Scroll to 9 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      // 9 AM = 9 * 60 = 540 minutes
      scrollRef.current.scrollTop = 500;
    }

    // Update current time indicator
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [date]);

  const weekEvents = useMemo(() => {
    return events.filter((e) => {
      const eDate = new Date(e.start);
      const start = weekDays[0];
      const end = addDays(weekDays[6], 1); // Comparing up to end of week
      return eDate >= start && eDate < end;
    });
  }, [events, weekDays]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, GridEvent[]>();
    weekDays.forEach((day) => map.set(day.toISOString(), []));

    weekEvents.forEach((e) => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const duration = Math.max(15, (end.getTime() - start.getTime()) / (1000 * 60));

      // Find which day this belongs to
      const dayKey = weekDays.find((d) => isSameDay(d, start))?.toISOString();

      if (dayKey) {
        const gridEvent: GridEvent = {
          id: e.id,
          title: e.title,
          start: startMinutes,
          duration,
          timeString: `${format(start, "h:mm")} - ${format(end, "h:mm")}`,
          type: e.type as any,
        };
        const current = map.get(dayKey) || [];
        map.set(dayKey, [...current, gridEvent]);
      }
    });
    return map;
  }, [weekEvents, weekDays]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isCurrentWeek = weekDays.some((d) => isSameDay(d, currentTime));

  return (
    <div className="bg-card flex h-full flex-col overflow-hidden rounded-lg border shadow-sm">
      {/* Header Row */}
      <div className="bg-muted/30 flex border-b">
        <div className="w-16 flex-shrink-0 border-r" /> {/* Time axis placeholder */}
        <div className="grid flex-1 grid-cols-7 divide-x">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn("p-2 text-center", isToday && "bg-primary/5")}
              >
                <div
                  className={cn(
                    "text-muted-foreground text-xs font-medium uppercase",
                    isToday && "text-primary"
                  )}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Grid */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto scroll-smooth">
        <div className="relative flex min-h-[1440px]">
          {/* Time Axis */}
          <div className="bg-background sticky left-0 z-30 w-16 flex-shrink-0 border-r">
            {HOURS.map((hour) => (
              <div key={hour} className="relative h-[60px]">
                <div className="text-muted-foreground absolute -top-3 right-2 text-xs">
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </div>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          <div className="relative grid flex-1 grid-cols-7 divide-x">
            {/* Horizontal Grid Lines Background */}
            <div className="pointer-events-none absolute inset-0 z-0">
              {HOURS.map((hour) => (
                <div key={hour} className="border-border/30 h-[60px] w-full border-b" />
              ))}
            </div>

            {/* Current Time Line */}
            {isCurrentWeek &&
              weekDays.map((day, i) => {
                if (!isSameDay(day, currentTime)) return null;
                return (
                  <div
                    key="current-time"
                    className="pointer-events-none absolute z-40 flex w-[calc(100%/7)] items-center"
                    style={{
                      top: `${currentMinutes}px`,
                      left: `${(i * 100) / 7}%`,
                    }}
                  >
                    <div className="-ml-1.5 h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-[2px] w-full bg-red-500" />
                  </div>
                );
              })}

            {weekDays.map((day) => {
              const events = eventsByDay.get(day.toISOString()) || [];
              const layout = calculateEventLayout(events);

              return (
                <div
                  key={day.toISOString()}
                  className="group/col hover:bg-muted/5 relative h-full transition-colors"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top + e.currentTarget.scrollTop; // need correct scroll offset
                    // Since we can't easily get scroll offset here on the sticky item,
                    // we might rely on the parent scrollRef or just approximate with event.nativeEvent.offsetY
                    const offsetY = (e.nativeEvent as any).offsetY;
                    const hour = Math.floor(offsetY / 60);
                    const minute = Math.floor(offsetY % 60);
                    const timeStr = `${hour.toString().padStart(2, "0")}:${minute < 30 ? "00" : "30"}`;
                    onAddEvent?.(day, timeStr);
                  }}
                >
                  {events.map((event) => {
                    const pos = layout.get(event.id) || { column: 0, totalColumns: 1 };
                    const styles = EVENT_STYLES[event.type || "work"];

                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute z-10 cursor-pointer truncate rounded border-l-2 p-1 text-[10px] shadow-sm transition-all hover:brightness-95",
                          styles.bg,
                          styles.border,
                          styles.text
                        )}
                        style={{
                          top: `${event.start}px`,
                          height: `${event.duration}px`,
                          left: `${(pos.column / pos.totalColumns) * 100}%`,
                          width: `${(1 / pos.totalColumns) * 100}%`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent?.(event.id);
                        }}
                      >
                        <div className="truncate font-semibold">{event.title}</div>
                        {event.duration > 30 && (
                          <div className="opacity-75">{event.timeString}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
