import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppState } from "./types";

// Re-export all types for backward compatibility
// (many files import types from "@/store/useStore")
export type {
  Priority,
  Task,
  CalendarEvent,
  Note,
  Notification,
  Column,
  ViewMode,
  Density,
  ViewSettings,
  TimerMode,
  TimerSettings,
  Attachment,
  HistoryEntry,
  AppState,
} from "./types";

// Import slice creators
import { createTaskSlice } from "./slices/taskSlice";
import { createEventSlice } from "./slices/eventSlice";
import { createNoteSlice } from "./slices/noteSlice";
import { createTimerSlice } from "./slices/timerSlice";
import { createKanbanSlice } from "./slices/kanbanSlice";
import { createAppSlice } from "./slices/appSlice";

export const useStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createTaskSlice(...a),
      ...createEventSlice(...a),
      ...createNoteSlice(...a),
      ...createTimerSlice(...a),
      ...createKanbanSlice(...a),
      ...createAppSlice(...a),
    }),
    {
      name: "mindsync-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown, _version: number) => {
        // Future migrations go here
        // if (version === 0) { ... }
        return persistedState as AppState;
      },
      partialize: (state) => ({
        // Only persist UI preferences — NOT data arrays (tasks, events, notes).
        // Data is server-fetched via StoreHydrator on each load.
        columns: state.columns,
        viewSettings: state.viewSettings,
        selectedDate: state.selectedDate,
        timerMode: state.timerMode,
        timeLeft: state.timeLeft,
        completedSessions: state.completedSessions,
        timerSettings: state.timerSettings,
        activeTaskId: state.activeTaskId,
        // Don't persist: tasks, events, notes, notifications, history, isTimerRunning
      }),
    }
  )
);
