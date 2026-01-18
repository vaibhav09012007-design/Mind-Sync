"use client";

/**
 * Recurring Task Settings Component
 * Enhanced UI for configuring task recurrence
 */

import { useState } from "react";
import { Task } from "@/store/useStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurringTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (recurrence: Task["recurrence"]) => void;
}

const DAYS_OF_WEEK = [
  { id: 0, label: "Su" },
  { id: 1, label: "Mo" },
  { id: 2, label: "Tu" },
  { id: 3, label: "We" },
  { id: 4, label: "Th" },
  { id: 5, label: "Fr" },
  { id: 6, label: "Sa" },
];

export function RecurringTaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: RecurringTaskDialogProps) {
  const [enabled, setEnabled] = useState(!!task.recurrence);
  const [type, setType] = useState<"daily" | "weekly" | "monthly">(
    task.recurrence?.type || "daily"
  );
  const [interval, setInterval] = useState(task.recurrence?.interval || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const handleSave = () => {
    if (!enabled) {
      onSave(null);
    } else {
      onSave({
        type,
        interval,
      });
    }
    onOpenChange(false);
  };

  const handleRemove = () => {
    onSave(null);
    onOpenChange(false);
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId]
    );
  };

  const getRecurrenceDescription = () => {
    if (!enabled) return "No recurrence";

    let desc = `Every ${interval > 1 ? interval : ""}`;
    switch (type) {
      case "daily":
        desc += interval === 1 ? " day" : " days";
        break;
      case "weekly":
        desc += interval === 1 ? " week" : " weeks";
        if (selectedDays.length > 0) {
          const dayNames = selectedDays
            .sort()
            .map((d) => DAYS_OF_WEEK[d].label)
            .join(", ");
          desc += ` on ${dayNames}`;
        }
        break;
      case "monthly":
        desc += interval === 1 ? " month" : " months";
        break;
    }
    return desc;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Task
          </DialogTitle>
          <DialogDescription>
            Configure how often this task should repeat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring-enabled">Enable Recurrence</Label>
            <Switch
              id="recurring-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <>
              {/* Recurrence Type */}
              <div className="space-y-2">
                <Label>Repeat</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interval */}
              <div className="space-y-2">
                <Label>Every</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={interval}
                    onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">
                    {type === "daily" && (interval === 1 ? "day" : "days")}
                    {type === "weekly" && (interval === 1 ? "week" : "weeks")}
                    {type === "monthly" && (interval === 1 ? "month" : "months")}
                  </span>
                </div>
              </div>

              {/* Days of Week (for weekly) */}
              {type === "weekly" && (
                <div className="space-y-2">
                  <Label>On days</Label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                          selectedDays.includes(day.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Preview:</span>
                </div>
                <p className="mt-1 font-medium">{getRecurrenceDescription()}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {task.recurrence && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Remove Recurrence
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Badge showing recurrence status
 */
export function RecurrenceBadge({
  recurrence,
  onClick,
  className,
}: {
  recurrence: Task["recurrence"];
  onClick?: () => void;
  className?: string;
}) {
  if (!recurrence) return null;

  const label =
    recurrence.type === "daily"
      ? recurrence.interval === 1
        ? "Daily"
        : `Every ${recurrence.interval} days`
      : recurrence.type === "weekly"
        ? recurrence.interval === 1
          ? "Weekly"
          : `Every ${recurrence.interval} weeks`
        : recurrence.interval === 1
          ? "Monthly"
          : `Every ${recurrence.interval} months`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer text-xs hover:bg-accent",
        className
      )}
      onClick={onClick}
    >
      <Repeat className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}
