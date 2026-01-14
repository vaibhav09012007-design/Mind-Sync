"use client";

import { useStore } from "@/store/useStore";
import { format, isToday, isTomorrow, isSameDay, startOfDay } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { EVENT_STYLES } from "./calendar-utils";

interface AgendaViewProps {
  onEditEvent?: (id: string) => void;
}

export function AgendaView({ onEditEvent }: AgendaViewProps) {
  const { events } = useStore();

  const sortedEvents = useMemo(() => {
    return [...events]
      .filter((e) => new Date(e.start) >= startOfDay(new Date())) // Only future/current events
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, typeof events>();

    sortedEvents.forEach((event) => {
      const dateKey = startOfDay(new Date(event.start)).toISOString();
      const current = groups.get(dateKey) || [];
      groups.set(dateKey, [...current, event]);
    });

    return groups;
  }, [sortedEvents]);

  if (sortedEvents.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
        <p>No upcoming events.</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6 overflow-y-auto p-4">
      {Array.from(groupedEvents.entries()).map(([dateStr, dayEvents]) => {
        const date = new Date(dateStr);
        const dayLabel = isToday(date)
          ? "Today"
          : isTomorrow(date)
            ? "Tomorrow"
            : format(date, "EEEE, MMMM d");

        return (
          <div key={dateStr} className="space-y-2">
            <h3 className="text-muted-foreground bg-background sticky top-0 py-2 text-sm font-semibold">
              {dayLabel}
            </h3>
            <div className="grid gap-2">
              {dayEvents.map((event) => {
                const styles = EVENT_STYLES[event.type || "work"];
                const start = new Date(event.start);
                const end = new Date(event.end);

                return (
                  <div
                    key={event.id}
                    onClick={() => onEditEvent?.(event.id)}
                    className={cn(
                      "hover:bg-muted/50 flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition-colors",
                      styles.border.replace("border-", "border- border-l-4")
                    )}
                  >
                    <div className="flex min-w-[100px] flex-col text-sm">
                      <span className="font-medium">{format(start, "h:mm a")}</span>
                      <span className="text-muted-foreground text-xs">{format(end, "h:mm a")}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium hover:underline">{event.title}</div>
                      {event.type && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] tracking-wider uppercase",
                            styles.bg,
                            styles.text
                          )}
                        >
                          {event.type}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
