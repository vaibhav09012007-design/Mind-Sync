"use client";

import { format } from "date-fns";
import { TimeGrid, GridEvent } from "./TimeGrid";
import { useStore } from "@/store/useStore";
import { useMemo } from "react";

interface DayViewProps {
  date: Date;
  onAddEvent?: (time: string) => void;
  onEditEvent?: (id: string) => void;
}

export function DayView({ date, onAddEvent, onEditEvent }: DayViewProps) {
  const { events } = useStore();

  const dayEvents = useMemo(() => {
    return events
      .filter((e) => {
        const eventDate = new Date(e.start);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      })
      .map((e) => {
        const start = new Date(e.start);
        const end = new Date(e.end);

        // Calculate minutes from midnight
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const duration = (end.getTime() - start.getTime()) / (1000 * 60);

        return {
          id: e.id,
          title: e.title,
          start: startMinutes,
          duration: Math.max(15, duration),
          timeString: `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`,
          type: e.type,
        } as GridEvent;
      });
  }, [events, date]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <TimeGrid
          events={dayEvents}
          onAddEvent={onAddEvent}
          // Assuming onEditEvent in TimeGrid returns the whole event, but we just need ID or the event object
          onEditEvent={(e) => onEditEvent?.(e.id)}
        />
      </div>
    </div>
  );
}
