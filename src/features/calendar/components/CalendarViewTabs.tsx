"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, Calendar as CalendarIcon, List, LayoutPanelLeft } from "lucide-react";

export type CalendarViewType = "month" | "week" | "day" | "agenda";

interface CalendarViewTabsProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export function CalendarViewTabs({ currentView, onViewChange }: CalendarViewTabsProps) {
  return (
    <div className="bg-muted/40 flex items-center rounded-lg border p-1 shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("month")}
        className={cn(
          "hover:bg-background/80 h-8 px-3 text-xs font-medium transition-all",
          currentView === "month" && "bg-background text-foreground hover:bg-background shadow-sm"
        )}
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
        Month
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("week")}
        className={cn(
          "hover:bg-background/80 h-8 px-3 text-xs font-medium transition-all",
          currentView === "week" && "bg-background text-foreground hover:bg-background shadow-sm"
        )}
      >
        <LayoutPanelLeft className="mr-2 h-3.5 w-3.5 rotate-90" />
        Week
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("day")}
        className={cn(
          "hover:bg-background/80 h-8 px-3 text-xs font-medium transition-all",
          currentView === "day" && "bg-background text-foreground hover:bg-background shadow-sm"
        )}
      >
        <CalendarDays className="mr-2 h-3.5 w-3.5" />
        Day
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("agenda")}
        className={cn(
          "hover:bg-background/80 h-8 px-3 text-xs font-medium transition-all",
          currentView === "agenda" && "bg-background text-foreground hover:bg-background shadow-sm"
        )}
      >
        <List className="mr-2 h-3.5 w-3.5" />
        Agenda
      </Button>
    </div>
  );
}
