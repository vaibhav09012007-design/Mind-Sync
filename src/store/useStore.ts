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
      partialize: (state) => ({
        tasks: state.tasks,
        events: state.events,
        notes: state.notes,
        notifications: state.notifications,
        columns: state.columns,
        viewSettings: state.viewSettings,
        selectedDate: state.selectedDate,
        timerMode: state.timerMode,
        timeLeft: state.timeLeft,
        completedSessions: state.completedSessions,
        timerSettings: state.timerSettings,
        activeTaskId: state.activeTaskId,
        // Don't persist history or isTimerRunning (reset on load)
      }),
    }
  )
);
