"use client";

/**
 * Plan Day Wizard Component
 * Interactive modal for AI schedule generation preferences
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, Task } from "@/store/useStore";
import { cn } from "@/lib/utils";
import {
  Wand2,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Clock,
  CheckSquare,
  Loader2,
  Zap,
  Coffee,
  Brain,
} from "lucide-react";

type EnergyLevel = "low" | "medium" | "high";
type FocusDuration = 25 | 50 | 90;

interface PlanDayWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (preferences: SchedulePreferences) => Promise<void>;
}

export interface SchedulePreferences {
  energyLevel: EnergyLevel;
  focusDuration: FocusDuration;
  priorityTaskIds: string[];
  includeBreaks: boolean;
  startHour: number;
  endHour: number;
}

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; icon: any; description: string }[] = [
  { value: "low", label: "Low Energy", icon: BatteryLow, description: "Start with easier tasks" },
  {
    value: "medium",
    label: "Medium Energy",
    icon: BatteryMedium,
    description: "Balanced schedule",
  },
  {
    value: "high",
    label: "High Energy",
    icon: BatteryFull,
    description: "Tackle hardest tasks first",
  },
];

const FOCUS_OPTIONS: { value: FocusDuration; label: string; icon: any; description: string }[] = [
  { value: 25, label: "25 min", icon: Clock, description: "Pomodoro-style sprints" },
  { value: 50, label: "50 min", icon: Brain, description: "Deep work blocks" },
  { value: 90, label: "90 min", icon: Zap, description: "Flow state sessions" },
];

export function PlanDayWizard({ open, onOpenChange, onGenerate }: PlanDayWizardProps) {
  const { tasks } = useStore();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Preferences state
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("medium");
  const [focusDuration, setFocusDuration] = useState<FocusDuration>(50);
  const [priorityTaskIds, setPriorityTaskIds] = useState<string[]>([]);
  const [includeBreaks, setIncludeBreaks] = useState(true);

  // Get incomplete tasks
  const incompleteTasks = tasks.filter((t) => !t.completed);

  const handleTaskToggle = (taskId: string) => {
    setPriorityTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate({
        energyLevel,
        focusDuration,
        priorityTaskIds,
        includeBreaks,
        startHour: 9, // Default work hours
        endHour: 18,
      });
      onOpenChange(false);
      // Reset state
      setStep(1);
      setPriorityTaskIds([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="text-primary h-5 w-5" />
            Plan Your Day
          </DialogTitle>
          <DialogDescription>
            Tell us how you're feeling and we'll create an optimal schedule.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                step >= s ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="py-4">
          {/* Step 1: Energy Level */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">How's your energy today?</Label>
              <div className="grid gap-3">
                {ENERGY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setEnergyLevel(option.value)}
                      className={cn(
                        "flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all",
                        energyLevel === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-full p-2",
                          energyLevel === option.value ? "bg-primary/10" : "bg-muted"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            energyLevel === option.value ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-muted-foreground text-sm">{option.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Focus Duration */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Preferred focus session length?</Label>
              <div className="grid gap-3">
                {FOCUS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFocusDuration(option.value)}
                      className={cn(
                        "flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all",
                        focusDuration === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-full p-2",
                          focusDuration === option.value ? "bg-primary/10" : "bg-muted"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            focusDuration === option.value
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-muted-foreground text-sm">{option.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Include Breaks Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <Checkbox
                  id="breaks"
                  checked={includeBreaks}
                  onCheckedChange={(checked) => setIncludeBreaks(checked === true)}
                />
                <Label htmlFor="breaks" className="flex cursor-pointer items-center gap-2">
                  <Coffee className="text-muted-foreground h-4 w-4" />
                  Include break times between sessions
                </Label>
              </div>
            </div>
          )}

          {/* Step 3: Priority Tasks */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Which tasks should be scheduled first?
                <span className="text-muted-foreground ml-2 font-normal">(Optional)</span>
              </Label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
                {incompleteTasks.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">No pending tasks</div>
                ) : (
                  incompleteTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskToggle(task.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors",
                        priorityTaskIds.includes(task.id)
                          ? "bg-primary/10 border-primary/30 border"
                          : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={priorityTaskIds.includes(task.id)}
                        onCheckedChange={() => handleTaskToggle(task.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{task.title}</div>
                        {task.priority && (
                          <div className="text-muted-foreground text-xs">{task.priority}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {priorityTaskIds.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  {priorityTaskIds.length} task{priorityTaskIds.length > 1 ? "s" : ""} will be
                  scheduled first
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Schedule
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PlanDayWizard;
