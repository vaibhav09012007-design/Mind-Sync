"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { MouseEvent, useEffect, useRef, useState, useCallback } from "react";
import { Plus } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Activity type colors - glassmorphism style
const EVENT_STYLES = {
  work: {
    bg: "bg-blue-500/15 backdrop-blur-sm",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    label: "Deep Work",
  },
  meeting: {
    bg: "bg-purple-500/15 backdrop-blur-sm",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
    label: "Meeting",
  },
  personal: {
    bg: "bg-emerald-500/15 backdrop-blur-sm",
    border: "border-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Personal",
  },
  break: {
    bg: "bg-amber-500/15 backdrop-blur-sm",
    border: "border-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    label: "Break",
  },
  shallow: {
    bg: "bg-slate-400/15 backdrop-blur-sm",
    border: "border-slate-400",
    text: "text-slate-600 dark:text-slate-400",
    label: "Shallow Work",
  },
};

export interface GridEvent {
  id: string;
  title: string;
  start: number; // minutes from midnight
  duration: number; // minutes
  timeString: string;
  type?: "work" | "personal" | "meeting" | "break" | "shallow";
}

interface TimeGridProps {
  events?: GridEvent[];
  onAddEvent?: (time: string) => void;
  onEditEvent?: (event: GridEvent) => void;
  onResizeEvent?: (eventId: string, newDuration: number) => void;
}

// Calculate overlapping groups for side-by-side rendering
function calculateEventLayout(
  events: GridEvent[]
): Map<string, { column: number; totalColumns: number }> {
  const layout = new Map<string, { column: number; totalColumns: number }>();

  if (events.length === 0) return layout;

  // Sort by start time
  const sorted = [...events].sort((a, b) => a.start - b.start);

  // Group overlapping events
  const groups: GridEvent[][] = [];
  let currentGroup: GridEvent[] = [];

  for (const event of sorted) {
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else {
      // Check if overlaps with any event in current group
      const overlaps = currentGroup.some((e) => {
        const eEnd = e.start + e.duration;
        const eventEnd = event.start + event.duration;
        return event.start < eEnd && eventEnd > e.start;
      });

      if (overlaps) {
        currentGroup.push(event);
      } else {
        groups.push(currentGroup);
        currentGroup = [event];
      }
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Assign columns within each group
  for (const group of groups) {
    const totalColumns = group.length;
    group.forEach((event, index) => {
      layout.set(event.id, { column: index, totalColumns });
    });
  }

  return layout;
}

export function TimeGrid({ events = [], onAddEvent, onEditEvent, onResizeEvent }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [resizing, setResizing] = useState<{
    eventId: string;
    startY: number;
    startDuration: number;
  } | null>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      scrollRef.current.scrollTop = Math.max(0, minutes - 100);
    }
  }, []);

  const { setNodeRef, isOver } = useDroppable({
    id: "time-grid",
  });

  // Handle resize drag
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, eventId: string, currentDuration: number) => {
      e.stopPropagation();
      e.preventDefault();
      setResizing({ eventId, startY: e.clientY, startDuration: currentDuration });
    },
    []
  );

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const deltaY = e.clientY - resizing.startY;
      const deltaMinutes = Math.round(deltaY); // 1px = 1 minute
      const newDuration = Math.max(15, resizing.startDuration + deltaMinutes);
      // Visual feedback handled by state
    };

    const handleMouseUp = (e: globalThis.MouseEvent) => {
      const deltaY = e.clientY - resizing.startY;
      const deltaMinutes = Math.round(deltaY);
      const newDuration = Math.max(15, resizing.startDuration + deltaMinutes);
      onResizeEvent?.(resizing.eventId, newDuration);
      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, onResizeEvent]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Calculate event layout for overlapping
  const eventLayout = calculateEventLayout(events);

  // Identify free time slots (gaps > 30 min)
  const getFreeSlots = () => {
    if (events.length === 0) return [];

    const sorted = [...events].sort((a, b) => a.start - b.start);
    const freeSlots: { start: number; end: number }[] = [];

    // Check gap before first event (from 8 AM)
    const dayStart = 8 * 60; // 8 AM
    if (sorted[0].start > dayStart + 30) {
      freeSlots.push({ start: dayStart, end: sorted[0].start });
    }

    // Check gaps between events
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = sorted[i].start + sorted[i].duration;
      const nextStart = sorted[i + 1].start;
      if (nextStart - currentEnd > 30) {
        freeSlots.push({ start: currentEnd, end: nextStart });
      }
    }

    return freeSlots;
  };

  const freeSlots = getFreeSlots();

  return (
    <div className="bg-card relative flex h-full flex-col overflow-hidden rounded-xl border shadow-sm">
      {/* Header */}
      <div className="bg-muted/30 flex flex-shrink-0 items-center justify-between border-b p-4">
        <h2 className="text-sm font-semibold">Schedule</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Object.entries(EVENT_STYLES)
              .slice(0, 3)
              .map(([key, style]) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className={cn("h-2 w-2 rounded-full", style.border, "bg-current")}
                    style={{ color: style.border.replace("border-", "") }}
                  />
                </div>
              ))}
          </div>
          <span className="text-muted-foreground bg-background rounded border px-2 py-1 font-mono text-xs">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        <div
          ref={setNodeRef}
          className={cn("bg-background relative min-h-[1440px]", isOver && "bg-primary/5")}
        >
          {/* Grid Lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className={cn(
                "border-border/30 group absolute h-[60px] w-full cursor-pointer border-b transition-colors",
                hoveredHour === hour && "bg-primary/5"
              )}
              style={{ top: `${hour * 60}px` }}
              onClick={() => onAddEvent?.(`${hour.toString().padStart(2, "0")}:00`)}
              onMouseEnter={() => setHoveredHour(hour)}
              onMouseLeave={() => setHoveredHour(null)}
            >
              {/* Time Label */}
              <div className="text-muted-foreground absolute -top-3 left-0 w-16 pr-4 text-right text-xs font-medium select-none">
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
              </div>

              {/* Half-hour dashed line */}
              <div className="border-border/20 absolute top-[30px] right-0 left-16 border-t border-dashed" />

              {/* Add event hint on hover */}
              {hoveredHour === hour && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="text-muted-foreground bg-background/80 flex items-center gap-1 rounded-full border px-2 py-1 text-xs shadow-sm">
                    <Plus className="h-3 w-3" />
                    Click to add
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Free Time Slots */}
          {freeSlots.map((slot, i) => (
            <div
              key={`free-${i}`}
              className="absolute right-4 left-16 z-10 cursor-pointer rounded-lg border-2 border-dashed border-emerald-300/50 transition-colors hover:bg-emerald-50/50 dark:border-emerald-700/50 dark:hover:bg-emerald-950/20"
              style={{
                top: `${slot.start}px`,
                height: `${slot.end - slot.start}px`,
              }}
              onClick={() => {
                const hours = Math.floor(slot.start / 60);
                const mins = slot.start % 60;
                onAddEvent?.(
                  `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
                );
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Free Time
              </div>
            </div>
          ))}

          {/* Current Time Indicator - Enhanced */}
          <div
            className="pointer-events-none absolute right-0 left-16 z-40 flex items-center"
            style={{ top: `${currentMinutes}px` }}
          >
            <div className="relative">
              <div className="absolute -left-1 h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <div className="absolute -left-1 h-3 w-3 animate-ping rounded-full bg-red-500" />
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-red-500 via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          </div>

          {/* Events Layer */}
          {events.map((event) => {
            const layout = eventLayout.get(event.id) || { column: 0, totalColumns: 1 };
            const styles = EVENT_STYLES[event.type || "work"];
            const widthPercent = 100 / layout.totalColumns;
            const leftOffset = layout.column * widthPercent;

            return (
              <div
                key={event.id}
                className={cn(
                  "group absolute z-20 cursor-pointer overflow-hidden rounded-lg border-l-4 p-2 text-xs shadow-sm transition-all",
                  "hover:z-30 hover:scale-[1.01] hover:shadow-md",
                  styles.bg,
                  styles.border,
                  styles.text
                )}
                style={{
                  top: `${event.start}px`,
                  height: `${event.duration}px`,
                  minHeight: "30px",
                  left: `calc(4rem + ${leftOffset}%)`,
                  width: `calc(${widthPercent}% - 5rem)`,
                  right: layout.totalColumns === 1 ? "1rem" : "auto",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditEvent?.(event);
                }}
              >
                <div className="truncate font-semibold">{event.title}</div>
                {event.duration > 30 && (
                  <div className="truncate text-[11px] opacity-70">{event.timeString}</div>
                )}

                {/* Resize Handle */}
                {onResizeEvent && (
                  <div
                    className="absolute right-0 bottom-0 left-0 h-2 cursor-s-resize rounded-b-lg bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, event.id, event.duration)}
                  >
                    <div className="absolute bottom-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-current opacity-50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
