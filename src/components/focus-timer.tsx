"use client";

/**
 * Focus Timer Component
 * Pomodoro-style focus timer with visual progress
 */

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Coffee,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, TimerMode } from "@/store/useStore";
import { toast } from "sonner";
import { AudioPlayer } from "@/components/audio-player";
import { Maximize2, Minimize2 } from "lucide-react";
import { BELL_SOUND } from "@/lib/sounds";

const modeConfig = {
  focus: {
    label: "Focus",
    color: "text-red-500",
    bgColor: "bg-red-500",
    ringColor: "ring-red-500",
    icon: Target,
  },
  shortBreak: {
    label: "Short Break",
    color: "text-green-500",
    bgColor: "bg-green-500",
    ringColor: "ring-green-500",
    icon: Coffee,
  },
  longBreak: {
    label: "Long Break",
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    ringColor: "ring-blue-500",
    icon: Zap,
  },
};

export function FocusTimer() {
  const {
    timerMode,
    timeLeft,
    isTimerRunning,
    completedSessions,
    timerSettings,
    activeTaskId,
    setTimerMode,
    setTimerRunning,
    setTimeLeft,
    tickTimer,
    updateTimerSettings,
    incrementCompletedSessions,
    setActiveTimerTask,
    resetTimer,
    tasks,
  } = useStore();

  const [zenMode, setZenMode] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker
  useEffect(() => {
    if (typeof Worker !== "undefined") {
      workerRef.current = new Worker("/timer-worker.js");
      workerRef.current.onmessage = (e) => {
        if (e.data === "tick") {
          tickTimer();
        }
      };
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [tickTimer]);

  // Handle Timer Start/Stop with Worker
  useEffect(() => {
    if (workerRef.current) {
      if (isTimerRunning) {
        workerRef.current.postMessage("start");
      } else {
        workerRef.current.postMessage("stop");
      }
    }
  }, [isTimerRunning]);

  const getDuration = (mode: TimerMode) => {
    switch (mode) {
      case "focus":
        return timerSettings.focusDuration * 60;
      case "shortBreak":
        return timerSettings.shortBreakDuration * 60;
      case "longBreak":
        return timerSettings.longBreakDuration * 60;
    }
  };

  const playSound = () => {
    if (timerSettings.soundEnabled && typeof window !== "undefined") {
      // Use built-in sound for reliability
      const audio = new Audio(BELL_SOUND);
      audio.volume = 0.5;
      audio.play().catch((e) => console.warn("Audio play failed", e));
    }
  };

  const showNotification = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body, icon: "/favicon.ico" });
          }
        });
      }
    }
  };

  // Timer Completion Logic
  useEffect(() => {
    if (timeLeft === 0 && isTimerRunning) {
      setTimerRunning(false);
      playSound();

      if (timerMode === "focus") {
        incrementCompletedSessions();

        const curSessions = completedSessions + 1;
        const nextMode =
          curSessions % timerSettings.sessionsBeforeLongBreak === 0 ? "longBreak" : "shortBreak";

        setTimerMode(nextMode);

        showNotification(
          "Focus session complete!",
          nextMode === "longBreak" ? "Time for a long break!" : "Take a short break."
        );
        toast.success("Focus session complete!");

        if (timerSettings.autoStartBreaks) {
          setTimerRunning(true);
        }
      } else {
        setTimerMode("focus");
        showNotification("Break over!", "Ready to focus?");
        toast.info("Break over! Ready to focus?");

        if (timerSettings.autoStartFocus) {
          setTimerRunning(true);
        }
      }
    }
  }, [
    timeLeft,
    isTimerRunning,
    timerMode,
    completedSessions,
    timerSettings,
    incrementCompletedSessions,
    setTimerMode,
    setTimerRunning,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = getDuration(timerMode);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const currentConfig = modeConfig[timerMode];
  const Icon = currentConfig.icon;

  const incompleteTasks = tasks.filter((t) => !t.completed);

  return (
    <>
      <Card
        className={cn(
          "mx-auto w-full transition-all duration-500",
          zenMode
            ? "bg-background/95 fixed inset-0 z-50 flex h-screen w-screen max-w-none flex-col items-center justify-center rounded-none backdrop-blur-sm"
            : "max-w-md border-2 shadow-lg"
        )}
      >
        <CardHeader className="relative mx-auto w-full max-w-md pb-2 text-center">
          {/* Zen Mode Toggle */}
          {zenMode && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-4"
              onClick={() => setZenMode(false)}
            >
              <Minimize2 className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center justify-between gap-4">
            {!zenMode && (
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className={cn("h-5 w-5", currentConfig.color)} />
                {currentConfig.label}
              </CardTitle>
            )}

            <div className={cn("flex items-center", zenMode ? "mx-auto" : "")}>
              <AudioPlayer />
            </div>

            {!zenMode && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZenMode(true)}
                  title="Zen Mode"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateTimerSettings({ soundEnabled: !timerSettings.soundEnabled })}
                >
                  {timerSettings.soundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Timer Settings</h4>

                      <div className="space-y-2">
                        <Label>Focus: {timerSettings.focusDuration} min</Label>
                        <Slider
                          value={[timerSettings.focusDuration]}
                          onValueChange={([v]) => updateTimerSettings({ focusDuration: v })}
                          min={5}
                          max={60}
                          step={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Short Break: {timerSettings.shortBreakDuration} min</Label>
                        <Slider
                          value={[timerSettings.shortBreakDuration]}
                          onValueChange={([v]) => updateTimerSettings({ shortBreakDuration: v })}
                          min={1}
                          max={15}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Long Break: {timerSettings.longBreakDuration} min</Label>
                        <Slider
                          value={[timerSettings.longBreakDuration]}
                          onValueChange={([v]) => updateTimerSettings({ longBreakDuration: v })}
                          min={10}
                          max={30}
                          step={5}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Auto-start breaks</Label>
                        <Switch
                          checked={timerSettings.autoStartBreaks}
                          onCheckedChange={(v) => updateTimerSettings({ autoStartBreaks: v })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Auto-start focus</Label>
                        <Switch
                          checked={timerSettings.autoStartFocus}
                          onCheckedChange={(v) => updateTimerSettings({ autoStartFocus: v })}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Mode Tabs */}
          <div className="bg-muted mt-4 flex gap-1 rounded-lg p-1">
            {(Object.keys(modeConfig) as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setTimerMode(m)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors",
                  timerMode === m
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {modeConfig[m].label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="mx-auto flex w-full max-w-md flex-col items-center space-y-8 pt-8">
          {/* Task Selection */}
          {timerMode === "focus" && (
            <div className="w-full">
              <Select
                value={activeTaskId || "none"}
                onValueChange={(val) => setActiveTimerTask(val === "none" ? null : val)}
              >
                <SelectTrigger className="bg-background/50 w-full">
                  <SelectValue placeholder="Select a task to focus on..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No active task --</SelectItem>
                  {incompleteTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <span className="flex items-center gap-2">
                        {task.priority === "P0" && (
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                        <span className="max-w-[200px] truncate">{task.title}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Timer Circle */}
          <div
            className={cn(
              "relative mx-auto transition-all",
              zenMode ? "h-96 w-96 scale-110" : "h-56 w-56"
            )}
          >
            <svg className="h-full w-full -rotate-90 transform">
              <circle
                cx={zenMode ? "192" : "112"}
                cy={zenMode ? "192" : "112"}
                r={zenMode ? "180" : "100"}
                fill="none"
                stroke="currentColor"
                strokeWidth={zenMode ? "12" : "8"}
                className="text-muted/30"
              />
              <motion.circle
                cx={zenMode ? "192" : "112"}
                cy={zenMode ? "192" : "112"}
                r={zenMode ? "180" : "100"}
                fill="none"
                stroke="currentColor"
                strokeWidth={zenMode ? "12" : "8"}
                strokeLinecap="round"
                className={currentConfig.color}
                strokeDasharray={zenMode ? 1130 : 628}
                initial={{ strokeDashoffset: zenMode ? 1130 : 628 }}
                animate={{
                  strokeDashoffset:
                    (zenMode ? 1130 : 628) - (progress / 100) * (zenMode ? 1130 : 628),
                }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={timeLeft}
                  initial={{ opacity: 0.5, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "font-bold tracking-tight tabular-nums",
                    zenMode ? "text-8xl" : "text-5xl"
                  )}
                >
                  {formatTime(timeLeft)}
                </motion.span>
              </AnimatePresence>
              <span className="text-muted-foreground mt-2 text-sm font-medium">
                Session {completedSessions + 1} / {timerSettings.sessionsBeforeLongBreak}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={resetTimer}
            >
              <RotateCcw className="text-muted-foreground h-5 w-5" />
            </Button>

            <Button
              size="lg"
              className={cn(
                "rounded-full shadow-lg transition-all active:scale-95",
                zenMode ? "h-20 w-20" : "h-16 w-16",
                isTimerRunning ? currentConfig.bgColor : "bg-primary hover:bg-primary/90"
              )}
              onClick={() => setTimerRunning(!isTimerRunning)}
            >
              {isTimerRunning ? (
                <Pause className={cn("fill-current", zenMode ? "h-10 w-10" : "h-8 w-8")} />
              ) : (
                <Play className={cn("ml-1 fill-current", zenMode ? "h-10 w-10" : "h-8 w-8")} />
              )}
            </Button>

            {!zenMode && <div className="h-12 w-12" />}
            {zenMode && (
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setZenMode(false)}
                title="Exit Zen Mode"
              >
                <Minimize2 className="text-muted-foreground h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Sessions indicator */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: timerSettings.sessionsBeforeLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-3 w-3 rounded-full border transition-colors",
                  i < completedSessions % timerSettings.sessionsBeforeLongBreak
                    ? currentConfig.bgColor + " border-transparent"
                    : "border-muted-foreground/30 bg-transparent"
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Background Dimmer for Zen Mode */}
      {zenMode && <div className="bg-background/80 fixed inset-0 z-40 -m-8 backdrop-blur-sm" />}
    </>
  );
}

export default FocusTimer;
