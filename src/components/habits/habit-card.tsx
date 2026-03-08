"use client";

import { useState } from "react";
import { format, subDays, isSameDay } from "date-fns";
import { Check, Flame, MoreVertical, Trash2, Edit, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { logHabit, deleteHabit } from "@/actions/habits";
import { toast } from "sonner";
import { HabitForm } from "./habit-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Habit {
  id: string;
  title: string;
  description?: string | null;
  frequency: "daily" | "weekly" | "custom";
  currentStreak: number | null;
  createdAt: Date | null;
  logs?: { date: string; completedAt: Date | null }[]; // Injected by parent or fetcher
}

interface HabitCardProps {
  habit: Habit;
  completedToday: boolean;
  recentLogs?: string[]; // Array of date strings YYYY-MM-DD
}

export function HabitCard({ habit, completedToday, recentLogs = [] }: HabitCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleToggle = async () => {
    setIsCompleting(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const result = await logHabit({
        habitId: habit.id,
        date: today,
        completed: !completedToday,
      });

      if (result.success) {
        toast.success(completedToday ? "Habit unchecked" : "Habit completed!");
      } else {
        toast.error(result.error || "Failed to update habit");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this habit? This cannot be undone.")) return;

    try {
      const result = await deleteHabit(habit.id);
      if (result.success) {
        toast.success("Habit deleted");
      } else {
        toast.error("Failed to delete habit");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  // Generate last 7 days for mini-visualization
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const isCompleted = recentLogs.includes(dateStr);
    const isToday = isSameDay(d, new Date());
    return { date: d, dateStr, isCompleted, isToday };
  });

  return (
    <>
      <Card className={cn(
        "transition-all duration-300 overflow-hidden group",
        completedToday ? "border-success/50 bg-success/5" : "hover:border-primary/50"
      )}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className={cn(
              "text-lg font-medium leading-none truncate pr-4",
              completedToday && "text-muted-foreground line-through decoration-primary/50"
            )}>
              {habit.title}
            </CardTitle>
            {habit.description && (
              <CardDescription className="line-clamp-1 text-xs">
                {habit.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
               <div className={cn(
                 "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                 (habit.currentStreak || 0) > 0
                   ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                   : "bg-muted text-muted-foreground border-transparent"
               )}>
                 <Flame className={cn("h-3 w-3", (habit.currentStreak || 0) > 0 && "fill-orange-500 text-orange-500")} />
                 <span>{habit.currentStreak || 0} streak</span>
               </div>
            </div>
            <div className="flex gap-1">
              <TooltipProvider>
                {last7Days.map((day) => (
                  <Tooltip key={day.dateStr}>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all",
                        day.isCompleted
                          ? "bg-primary shadow-[0_0_4px_rgba(255,215,0,0.5)]"
                          : day.isToday
                            ? "bg-muted border border-primary/50 animate-pulse"
                            : "bg-muted/30"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {format(day.date, "EEE, MMM d")}
                      {day.isCompleted ? " (Done)" : ""}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            className={cn(
              "w-full transition-all duration-300",
              completedToday
                ? "bg-transparent border border-success/30 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm"
            )}
            onClick={handleToggle}
            disabled={isCompleting}
          >
            {completedToday ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" /> Undo
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Complete Today
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          <HabitForm
            initialData={habit}
            onSuccess={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
