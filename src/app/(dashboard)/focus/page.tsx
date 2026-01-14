"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import { Play, Pause, RotateCcw, CheckCircle2, Settings, Coffee, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Time presets in minutes
const TIME_PRESETS = [
  { label: "25 min", value: 25, description: "Standard Pomodoro" },
  { label: "50 min", value: 50, description: "Deep Work" },
  { label: "90 min", value: 90, description: "Flow State" },
  { label: "Custom", value: 0, description: "Set your own" },
];

const BREAK_PRESETS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "20 min", value: 20 },
];

export default function FocusPage() {
  const { tasks, toggleTask } = useStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [workDuration, setWorkDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [customMinutes, setCustomMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeTask = tasks.find((t) => t.id === selectedTaskId);
  const todoTasks = tasks.filter((t) => !t.completed);

  // Handle duration change
  const handleDurationChange = (minutes: number) => {
    if (minutes === 0) {
      // Custom mode - use custom input
      setWorkDuration(customMinutes);
      setTimeLeft(customMinutes * 60);
    } else {
      setWorkDuration(minutes);
      setTimeLeft(minutes * 60);
    }
    setIsActive(false);
    setMode("work");
  };

  // Handle custom time input
  const handleCustomTimeChange = (value: string) => {
    const mins = parseInt(value) || 1;
    const clampedMins = Math.min(Math.max(mins, 1), 180); // 1 to 180 minutes
    setCustomMinutes(clampedMins);
  };

  const applyCustomTime = () => {
    setWorkDuration(customMinutes);
    setTimeLeft(customMinutes * 60);
    setIsActive(false);
    setMode("work");
    toast.success(`Timer set to ${customMinutes} minutes`);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (intervalRef.current) clearInterval(intervalRef.current);

      if (mode === "work") {
        setSessionsCompleted((prev) => prev + 1);
        toast.success("Focus session complete! Take a break.", {
          description: `You've completed ${sessionsCompleted + 1} sessions today!`,
        });
        setMode("break");
        setTimeLeft(breakDuration * 60);
      } else {
        toast.info("Break is over. Ready to focus?");
        setMode("work");
        setTimeLeft(workDuration * 60);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, mode, workDuration, breakDuration, sessionsCompleted]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "work" ? workDuration * 60 : breakDuration * 60);
  };

  const skipToBreak = () => {
    setIsActive(false);
    setMode("break");
    setTimeLeft(breakDuration * 60);
  };

  const skipToWork = () => {
    setIsActive(false);
    setMode("work");
    setTimeLeft(workDuration * 60);
  };

  const handleTaskComplete = () => {
    if (selectedTaskId) {
      toggleTask(selectedTaskId);
      toast.success("Task completed!");
      setSelectedTaskId("");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalTime = mode === "work" ? workDuration * 60 : breakDuration * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Focus Mode</h1>
        <p className="text-muted-foreground">
          {mode === "work" ? "Stay focused and productive" : "Take a well-deserved break"}
        </p>
      </div>

      {/* Duration Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TIME_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={workDuration === preset.value && preset.value !== 0 ? "default" : "outline"}
            size="sm"
            onClick={() => preset.value !== 0 && handleDurationChange(preset.value)}
            className={cn("relative", preset.value === 0 && "border-dashed")}
          >
            {preset.value === 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    Custom
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Work Duration (minutes)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={180}
                          value={customMinutes}
                          onChange={(e) => handleCustomTimeChange(e.target.value)}
                          className="w-20"
                        />
                        <Button size="sm" onClick={applyCustomTime}>
                          Apply
                        </Button>
                      </div>
                      <p className="text-muted-foreground text-xs">Enter 1-180 minutes</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Break Duration</Label>
                      <Select
                        value={breakDuration.toString()}
                        onValueChange={(v) => setBreakDuration(parseInt(v))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BREAK_PRESETS.map((b) => (
                            <SelectItem key={b.value} value={b.value.toString()}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              preset.label
            )}
          </Button>
        ))}
      </div>

      <Card className="bg-card/50 w-full border-2 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center space-y-6 p-8 md:p-12">
          {/* Task Selector */}
          <div className="w-full max-w-md">
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder="Select a task to focus on..." />
              </SelectTrigger>
              <SelectContent>
                {todoTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id} className="text-base">
                    {task.title}
                  </SelectItem>
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-muted-foreground p-2 text-center text-sm">
                    No pending tasks
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Timer Display */}
          <div className="relative flex items-center justify-center">
            <div className="relative h-64 w-64 md:h-72 md:w-72">
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted/20"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 45}%`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}%`}
                  className={cn(
                    "transition-all duration-1000 ease-linear",
                    mode === "work" ? "text-primary" : "text-emerald-500"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-5xl font-bold tracking-tighter md:text-6xl">
                  {formatTime(timeLeft)}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  {mode === "work" ? (
                    <Zap className="text-primary h-4 w-4" />
                  ) : (
                    <Coffee className="h-4 w-4 text-emerald-500" />
                  )}
                  <span className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
                    {mode === "work" ? "Focus Time" : "Break Time"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Counter */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>Sessions today:</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(sessionsCompleted, 8) }).map((_, i) => (
                <div key={i} className="bg-primary h-2 w-2 rounded-full" />
              ))}
              {sessionsCompleted > 8 && (
                <span className="ml-1 text-xs">+{sessionsCompleted - 8}</span>
              )}
              {sessionsCompleted === 0 && <span className="text-xs">None yet</span>}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full"
              onClick={resetTimer}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              className={cn(
                "h-16 w-16 rounded-full text-lg",
                mode === "break" && "bg-emerald-500 hover:bg-emerald-600"
              )}
              onClick={toggleTimer}
            >
              {isActive ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full"
              onClick={mode === "work" ? skipToBreak : skipToWork}
            >
              {mode === "work" ? <Coffee className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Task Actions */}
      {selectedTaskId && (
        <div className="animate-in fade-in slide-in-from-bottom-4 flex items-center gap-4">
          <span className="text-muted-foreground">Done with this task?</span>
          <Button onClick={handleTaskComplete} variant="outline" className="gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Mark as Complete
          </Button>
        </div>
      )}
    </div>
  );
}
