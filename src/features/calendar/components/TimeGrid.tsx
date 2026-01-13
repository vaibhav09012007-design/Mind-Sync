"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { MouseEvent, useEffect, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export interface GridEvent {
    id: string;
    title: string;
    start: number; // minutes from midnight
    duration: number; // minutes
    timeString: string;
    type?: "work" | "personal";
}

interface TimeGridProps {
    events?: GridEvent[];
    onAddEvent?: (time: string) => void;
    onEditEvent?: (event: GridEvent) => void;
}

export function TimeGrid({ events = [], onAddEvent, onEditEvent }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoverTime, setHoverTime] = useState<string | null>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
        const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        // Scroll to 1 hour before current time for context
        const scrollPosition = Math.max(0, minutes - 60) * 2; // Assuming 2px per minute approx logic
        // But our rows are 60px high, so 1px = 1 minute
        scrollRef.current.scrollTop = Math.max(0, (minutes * 1) - 100);
    }
  }, []);

  const { setNodeRef, isOver } = useDroppable({
    id: 'time-grid',
  });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top; // Relative Y in the viewport
      // We need absolute Y including scroll, but for visual hover relative is fine if markers are relative
      // Actually, simplest is to just track which hour row we are hovering
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden relative">
      <div className="p-4 border-b flex justify-between items-center bg-muted/30 flex-shrink-0">
        <h2 className="font-semibold text-sm">Schedule</h2>
        <span className="text-xs text-muted-foreground font-mono bg-background px-2 py-1 rounded border">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      {/* Scroll container needs a ref to control scroll position */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div 
            ref={setNodeRef}
            className={cn(
                "relative min-h-[1440px] bg-background", // 60px * 24h = 1440px
                isOver && "bg-indigo-50/30 dark:bg-indigo-950/10"
            )}
        > 
          {/* Grid Lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full h-[60px] border-b border-border/30 group cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ top: `${hour * 60}px` }}
              onClick={() => onAddEvent?.(`${hour.toString().padStart(2, '0')}:00`)}
            >
               {/* Time Label */}
              <div className="absolute -top-3 left-0 w-16 text-right pr-4 text-xs font-medium text-muted-foreground select-none">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              
              {/* Half-hour dashed line */}
              <div className="absolute top-[30px] left-16 right-0 border-t border-border/20 border-dashed" />
            </div>
          ))}

          {/* Current Time Indicator */}
          <div 
            className="absolute left-16 right-0 flex items-center z-30 pointer-events-none"
            style={{ top: `${currentMinutes}px` }}
          >
             <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 ring-4 ring-red-500/20" />
             <div className="h-[2px] w-full bg-red-500" />
          </div>

          {/* Events Layer */}
          {events.map((event) => (
            <div
                key={event.id}
                className={cn(
                    "absolute left-16 right-4 rounded-md border-l-4 p-2 text-xs cursor-pointer hover:brightness-95 transition-all shadow-sm z-20 overflow-hidden",
                    event.type === 'personal' 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                        : "bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                )}
                style={{ 
                    top: `${event.start}px`, 
                    height: `${event.duration}px`,
                    minHeight: '30px'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onEditEvent?.(event);
                }}
            >
                <div className="font-semibold truncate">{event.title}</div>
                <div className="opacity-80 truncate">{event.timeString}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}