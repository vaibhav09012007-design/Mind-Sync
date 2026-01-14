"use client";

/**
 * Focus Timer Component
 * Pomodoro-style focus timer with visual progress
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

type TimerMode = "focus" | "shortBreak" | "longBreak";

interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
}

const defaultSettings: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
};

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
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getDuration = useCallback(
    (timerMode: TimerMode) => {
      switch (timerMode) {
        case "focus":
          return settings.focusDuration * 60;
        case "shortBreak":
          return settings.shortBreakDuration * 60;
        case "longBreak":
          return settings.longBreakDuration * 60;
      }
    },
    [settings]
  );

  const playSound = useCallback(() => {
    if (settings.soundEnabled && typeof window !== "undefined") {
      const audio = new Audio("/sounds/bell.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => console.log("Audio play failed"));
    }
  }, [settings.soundEnabled]);

  const showNotification = useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    playSound();

    if (mode === "focus") {
      const newSessions = completedSessions + 1;
      setCompletedSessions(newSessions);

      const nextMode =
        newSessions % settings.sessionsBeforeLongBreak === 0
          ? "longBreak"
          : "shortBreak";

      setMode(nextMode);
      setTimeLeft(getDuration(nextMode));

      showNotification(
        "Focus session complete!",
        nextMode === "longBreak"
          ? "Time for a long break!"
          : "Take a short break."
      );

      if (settings.autoStartBreaks) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    } else {
      setMode("focus");
      setTimeLeft(getDuration("focus"));

      showNotification("Break over!", "Ready to focus?");

      if (settings.autoStartFocus) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    }
  }, [
    mode,
    completedSessions,
    settings,
    getDuration,
    playSound,
    showNotification,
  ]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress =
    ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100;

  const currentConfig = modeConfig[mode];
  const Icon = currentConfig.icon;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className={cn("h-5 w-5", currentConfig.color)} />
            {currentConfig.label}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))
              }
            >
              {settings.soundEnabled ? (
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
                    <Label>Focus: {settings.focusDuration} min</Label>
                    <Slider
                      value={[settings.focusDuration]}
                      onValueChange={([v]) =>
                        setSettings((s) => ({ ...s, focusDuration: v }))
                      }
                      min={5}
                      max={60}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Short Break: {settings.shortBreakDuration} min</Label>
                    <Slider
                      value={[settings.shortBreakDuration]}
                      onValueChange={([v]) =>
                        setSettings((s) => ({ ...s, shortBreakDuration: v }))
                      }
                      min={1}
                      max={15}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Long Break: {settings.longBreakDuration} min</Label>
                    <Slider
                      value={[settings.longBreakDuration]}
                      onValueChange={([v]) =>
                        setSettings((s) => ({ ...s, longBreakDuration: v }))
                      }
                      min={10}
                      max={30}
                      step={5}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-start breaks</Label>
                    <Switch
                      checked={settings.autoStartBreaks}
                      onCheckedChange={(v) =>
                        setSettings((s) => ({ ...s, autoStartBreaks: v }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-start focus</Label>
                    <Switch
                      checked={settings.autoStartFocus}
                      onCheckedChange={(v) =>
                        setSettings((s) => ({ ...s, autoStartFocus: v }))
                      }
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-muted rounded-lg">
          {(Object.keys(modeConfig) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 py-1.5 px-3 text-sm rounded-md transition-colors",
                mode === m
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {modeConfig[m].label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Timer Circle */}
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={currentConfig.color}
              strokeDasharray={553}
              initial={{ strokeDashoffset: 553 }}
              animate={{
                strokeDashoffset: 553 - (progress / 100) * 553,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={timeLeft}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-4xl font-bold tabular-nums"
              >
                {formatTime(timeLeft)}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm text-muted-foreground mt-1">
              Session {completedSessions + 1}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={resetTimer}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full",
              isRunning && currentConfig.bgColor,
              !isRunning && "bg-primary"
            )}
            onClick={toggleTimer}
          >
            {isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>

          <div className="h-12 w-12" /> {/* Spacer for symmetry */}
        </div>

        {/* Sessions indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                i < completedSessions % settings.sessionsBeforeLongBreak
                  ? currentConfig.bgColor
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default FocusTimer;
