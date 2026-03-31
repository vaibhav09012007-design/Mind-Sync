import { StateCreator } from "zustand";
import type { TimerMode, TimerSettings, AppState } from "../types";
import { DEFAULT_TIMER_SETTINGS } from "../types";

export interface TimerSlice {
  timerMode: TimerMode;
  timeLeft: number;
  isTimerRunning: boolean;
  completedSessions: number;
  timerSettings: TimerSettings;
  activeTaskId: string | null;
  setTimerMode: (mode: TimerMode) => void;
  setTimerRunning: (isRunning: boolean) => void;
  setTimeLeft: (time: number) => void;
  tickTimer: () => void;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;
  incrementCompletedSessions: () => void;
  setActiveTimerTask: (taskId: string | null) => void;
  resetTimer: () => void;
}

export const createTimerSlice: StateCreator<AppState, [], [], TimerSlice> = (set) => ({
  timerMode: "focus",
  timeLeft: DEFAULT_TIMER_SETTINGS.focusDuration * 60,
  isTimerRunning: false,
  completedSessions: 0,
  timerSettings: DEFAULT_TIMER_SETTINGS,
  activeTaskId: null,

  setTimerMode: (mode) =>
    set((state) => {
      let duration = state.timerSettings.focusDuration * 60;
      if (mode === "shortBreak") duration = state.timerSettings.shortBreakDuration * 60;
      if (mode === "longBreak") duration = state.timerSettings.longBreakDuration * 60;

      return {
        timerMode: mode,
        timeLeft: duration,
        isTimerRunning: false,
      };
    }),

  setTimerRunning: (isRunning) => set({ isTimerRunning: isRunning }),
  setTimeLeft: (time) => set({ timeLeft: time }),
  tickTimer: () =>
    set((state) => ({
      timeLeft: Math.max(0, state.timeLeft - 1),
    })),

  updateTimerSettings: (settings) =>
    set((state) => ({
      timerSettings: { ...state.timerSettings, ...settings },
    })),

  incrementCompletedSessions: () =>
    set((state) => ({ completedSessions: state.completedSessions + 1 })),

  setActiveTimerTask: (taskId) => set({ activeTaskId: taskId }),

  resetTimer: () =>
    set((state) => {
      let duration = state.timerSettings.focusDuration * 60;
      if (state.timerMode === "shortBreak")
        duration = state.timerSettings.shortBreakDuration * 60;
      if (state.timerMode === "longBreak")
        duration = state.timerSettings.longBreakDuration * 60;

      return {
        isTimerRunning: false,
        timeLeft: duration,
      };
    }),
});
