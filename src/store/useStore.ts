import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  createTask,
  toggleTaskStatus,
  deleteTask,
  createEvent,
  updateEvent as serverUpdateEvent,
  deleteEvent,
  createNote,
  updateNote as serverUpdateNote,
  deleteNote,
} from "@/app/actions";
import { toast } from "sonner";

// --- Types ---

export type Priority = "P0" | "P1" | "P2" | "P3";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // ISO Date String
  priority?: Priority;
  tags?: string[];
  recurrence?: {
    type: "daily" | "weekly" | "monthly";
    interval: number;
  } | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO Date String
  end: string; // ISO Date String
  type: "work" | "personal" | "meeting";
  googleId?: string; // ID from Google Calendar
}

export interface Note {
  id: string;
  title: string;
  preview: string;
  content: string; // HTML content
  date: string; // ISO
  tags: string[];
  type: "meeting" | "personal";
  eventId?: string; // Link to CalendarEvent
}

// --- Undo/Redo Stack ---

interface HistoryEntry {
  type: "task" | "event" | "note";
  action: "add" | "update" | "delete";
  before: Task | CalendarEvent | Note | null;
  after: Task | CalendarEvent | Note | null;
}

// --- Store Interface ---

interface AppState {
  // State
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  selectedDate: string;
  googleAccessToken?: string;

  // Undo/Redo
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setGoogleAccessToken: (token: string) => void;
  setSelectedDate: (date: Date) => void;

  // Bulk set (for hydration from server)
  setTasks: (tasks: Task[]) => void;
  setEvents: (events: CalendarEvent[]) => void;
  setNotes: (notes: Note[]) => void;

  // Task Actions
  addTask: (title: string, dueDate?: Date, priority?: Priority) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTaskPriority: (id: string, priority: Priority) => void;

  // Event Actions
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Note Actions
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushHistory: (entry: HistoryEntry) => void;
}

const MAX_HISTORY = 50;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      events: [],
      notes: [],
      selectedDate: new Date().toISOString(),
      googleAccessToken: undefined,

      // Undo/Redo state
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,

      setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
      setSelectedDate: (date) => set({ selectedDate: date.toISOString() }),

      setTasks: (tasks) => set({ tasks }),
      setEvents: (events) => set({ events }),
      setNotes: (notes) => set({ notes }),

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
        const { history, historyIndex, tasks, events, notes } = get();
        if (historyIndex < 0) return;

        const entry = history[historyIndex];

        // Restore previous state
        if (entry.type === "task" && entry.before) {
          if (entry.action === "add") {
            set({ tasks: tasks.filter((t) => t.id !== (entry.after as Task).id) });
          } else if (entry.action === "delete") {
            set({ tasks: [...tasks, entry.before as Task] });
          } else if (entry.action === "update") {
            set({
              tasks: tasks.map((t) =>
                t.id === (entry.before as Task).id ? (entry.before as Task) : t
              ),
            });
          }
        }

        set({
          historyIndex: historyIndex - 1,
          canUndo: historyIndex - 1 >= 0,
          canRedo: true,
        });

        toast.info("Action undone");
      },

      redo: () => {
        const { history, historyIndex, tasks, events, notes } = get();
        if (historyIndex >= history.length - 1) return;

        const entry = history[historyIndex + 1];

        // Apply the action again
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
        }

        set({
          historyIndex: historyIndex + 1,
          canUndo: true,
          canRedo: historyIndex + 1 < history.length - 1,
        });

        toast.info("Action redone");
      },

      // --- Task Actions ---

      addTask: async (title, dueDate = new Date(), priority = "P2") => {
        const newTask: Task = {
          id: uuidv4(),
          title,
          completed: false,
          dueDate: dueDate.toISOString(),
          priority,
          tags: [],
          recurrence: null,
        };

        // Optimistic update
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        // Push to history
        get().pushHistory({
          type: "task",
          action: "add",
          before: null,
          after: newTask,
        });

        try {
          const result = await createTask({
            id: newTask.id,
            title: newTask.title,
            dueDate: newTask.dueDate,
          });

          if (!result.success) {
            // Rollback on failure
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== newTask.id),
            }));
            toast.error(result.error || "Failed to create task");
          }
        } catch (error) {
          console.error("Failed to save task", error);
          toast.error("Failed to save task");
        }
      },

      toggleTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const updatedTask = { ...task, completed: !task.completed };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        }));

        get().pushHistory({
          type: "task",
          action: "update",
          before: task,
          after: updatedTask,
        });

        try {
          const result = await toggleTaskStatus(id, !task.completed);
          if (!result.success) {
            // Rollback
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === id ? task : t)),
            }));
            toast.error(result.error || "Failed to update task");
          }
        } catch (error) {
          console.error("Failed to toggle task", error);
        }
      },

      deleteTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

        get().pushHistory({
          type: "task",
          action: "delete",
          before: task,
          after: null,
        });

        try {
          const result = await deleteTask(id);
          if (!result.success) {
            // Rollback
            set((state) => ({ tasks: [...state.tasks, task] }));
            toast.error(result.error || "Failed to delete task");
          }
        } catch (error) {
          console.error("Failed to delete task", error);
        }
      },

      updateTaskPriority: (id, priority) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const updatedTask = { ...task, priority };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        }));

        get().pushHistory({
          type: "task",
          action: "update",
          before: task,
          after: updatedTask,
        });

        // Note: Priority is stored locally only for now
        toast.success(`Priority set to ${priority}`);
      },

      // --- Event Actions ---

      addEvent: async (event) => {
        const newEvent: CalendarEvent = { ...event, id: uuidv4() };
        set((state) => ({ events: [...state.events, newEvent] }));

        try {
          const result = await createEvent(newEvent);
          if (!result.success) {
            set((state) => ({
              events: state.events.filter((e) => e.id !== newEvent.id),
            }));
            toast.error(result.error || "Failed to create event");
          }
        } catch (error) {
          console.error("Failed to create event", error);
        }
      },

      updateEvent: async (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));

        try {
          const result = await serverUpdateEvent(id, {
            title: updates.title,
            start: updates.start,
            end: updates.end,
          });
          if (!result.success) {
            toast.error(result.error || "Failed to update event");
          }
        } catch (error) {
          console.error("Failed to update event", error);
        }
      },

      deleteEvent: async (id) => {
        const event = get().events.find((e) => e.id === id);
        set((state) => ({ events: state.events.filter((e) => e.id !== id) }));

        try {
          const result = await deleteEvent(id);
          if (!result.success && event) {
            set((state) => ({ events: [...state.events, event] }));
            toast.error(result.error || "Failed to delete event");
          }
        } catch (error) {
          console.error("Failed to delete event", error);
        }
      },

      // --- Note Actions ---

      addNote: async (note) => {
        set((state) => ({ notes: [note, ...state.notes] }));

        try {
          const result = await createNote(note);
          if (!result.success) {
            set((state) => ({
              notes: state.notes.filter((n) => n.id !== note.id),
            }));
            toast.error(result.error || "Failed to create note");
          }
        } catch (error) {
          console.error("Failed to create note", error);
        }
      },

      updateNote: async (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        }));

        try {
          const result = await serverUpdateNote(id, {
            title: updates.title,
            content: updates.content,
            preview: updates.preview,
          });
          if (!result.success) {
            toast.error(result.error || "Failed to update note");
          }
        } catch (error) {
          console.error("Failed to update note", error);
        }
      },

      deleteNote: async (id) => {
        const note = get().notes.find((n) => n.id === id);
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));

        try {
          const result = await deleteNote(id);
          if (!result.success && note) {
            set((state) => ({ notes: [...state.notes, note] }));
            toast.error(result.error || "Failed to delete note");
          }
        } catch (error) {
          console.error("Failed to delete note", error);
        }
      },
    }),
    {
      name: "mindsync-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        events: state.events,
        notes: state.notes,
        selectedDate: state.selectedDate,
        // Don't persist history
      }),
    }
  )
);
