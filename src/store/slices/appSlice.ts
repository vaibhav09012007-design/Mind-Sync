import { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { showToast } from "@/lib/toast-queue";
import type {
  Notification,
  HistoryEntry,
  Task,
  CalendarEvent,
  Note,
  Column,
  AppState,
} from "../types";
import { MAX_HISTORY } from "../types";

export interface AppSlice {
  notifications: Notification[];
  selectedDate: string;
  googleAccessToken?: string;
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  setGoogleAccessToken: (token: string) => void;
  setSelectedDate: (date: Date) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  pushHistory: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
}

export const createAppSlice: StateCreator<AppState, [], [], AppSlice> = (set, get) => ({
  notifications: [],
  selectedDate: new Date().toISOString(),
  googleAccessToken: undefined,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,

  setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
  setSelectedDate: (date) => set({ selectedDate: date.toISOString() }),

  // --- Notification Actions ---
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })),

  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotifications: () => set({ notifications: [] }),

  // --- History / Undo / Redo ---
  pushHistory: (entry) => {
    const { history, historyIndex } = get();
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false,
    });
  },

  undo: () => {
    const { history, historyIndex, tasks, events, notes, columns } = get();
    if (historyIndex < 0) return;

    const entry = history[historyIndex];

    // Restore previous state based on entity type
    if (entry.type === "task") {
      if (entry.action === "add") {
        set({ tasks: tasks.filter((t) => t.id !== (entry.after as Task).id) });
      } else if (entry.action === "delete" && entry.before) {
        set({ tasks: [...tasks, entry.before as Task] });
      } else if (entry.action === "update" && entry.before) {
        set({
          tasks: tasks.map((t) =>
            t.id === (entry.before as Task).id ? (entry.before as Task) : t
          ),
        });
      }
    } else if (entry.type === "event") {
      if (entry.action === "add") {
        set({ events: events.filter((e) => e.id !== (entry.after as CalendarEvent).id) });
      } else if (entry.action === "delete" && entry.before) {
        set({ events: [...events, entry.before as CalendarEvent] });
      } else if (entry.action === "update" && entry.before) {
        set({
          events: events.map((e) =>
            e.id === (entry.before as CalendarEvent).id ? (entry.before as CalendarEvent) : e
          ),
        });
      }
    } else if (entry.type === "note") {
      if (entry.action === "add") {
        set({ notes: notes.filter((n) => n.id !== (entry.after as Note).id) });
      } else if (entry.action === "delete" && entry.before) {
        set({ notes: [...notes, entry.before as Note] });
      } else if (entry.action === "update" && entry.before) {
        set({
          notes: notes.map((n) =>
            n.id === (entry.before as Note).id ? (entry.before as Note) : n
          ),
        });
      }
    } else if (entry.type === "column" && entry.before) {
      if (entry.action === "update") {
        set({
          columns: columns.map((c) =>
            c.id === (entry.before as Column).id ? (entry.before as Column) : c
          ),
        });
      }
    }

    set({
      historyIndex: historyIndex - 1,
      canUndo: historyIndex - 1 >= 0,
      canRedo: true,
    });

    showToast.info("Action undone");
  },

  redo: () => {
    const { history, historyIndex, tasks, events, notes } = get();
    if (historyIndex >= history.length - 1) return;

    const entry = history[historyIndex + 1];

    // Apply the action again based on entity type
    if (entry.type === "task" && entry.after) {
      if (entry.action === "add") {
        set({ tasks: [...tasks, entry.after as Task] });
      } else if (entry.action === "delete") {
        set({ tasks: tasks.filter((t) => t.id !== (entry.before as Task).id) });
      } else if (entry.action === "update") {
        set({
          tasks: tasks.map((t) =>
            t.id === (entry.after as Task).id ? (entry.after as Task) : t
          ),
        });
      }
    } else if (entry.type === "event" && entry.after) {
      if (entry.action === "add") {
        set({ events: [...events, entry.after as CalendarEvent] });
      } else if (entry.action === "delete") {
        set({ events: events.filter((e) => e.id !== (entry.before as CalendarEvent).id) });
      } else if (entry.action === "update") {
        set({
          events: events.map((e) =>
            e.id === (entry.after as CalendarEvent).id ? (entry.after as CalendarEvent) : e
          ),
        });
      }
    } else if (entry.type === "note" && entry.after) {
      if (entry.action === "add") {
        set({ notes: [...notes, entry.after as Note] });
      } else if (entry.action === "delete") {
        set({ notes: notes.filter((n) => n.id !== (entry.before as Note).id) });
      } else if (entry.action === "update") {
        set({
          notes: notes.map((n) =>
            n.id === (entry.after as Note).id ? (entry.after as Note) : n
          ),
        });
      }
    }

    set({
      historyIndex: historyIndex + 1,
      canUndo: true,
      canRedo: historyIndex + 1 < history.length - 1,
    });

    showToast.info("Action redone");
  },
});
