import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { createTask } from "@/actions/tasks";
import { toggleTaskStatus, updateTask as serverUpdateTask } from "@/actions/tasks";
import { deleteTask } from "@/actions/tasks";
import { createEvent } from "@/actions/events";
import { updateEvent as serverUpdateEvent } from "@/actions/events";
import { deleteEvent } from "@/actions/events";
import { createNote } from "@/actions/notes";
import { updateNote as serverUpdateNote } from "@/actions/notes";
import { deleteNote as serverDeleteNote } from "@/actions/notes";
import { syncSubtask } from "@/actions/tasks";
import { deleteSubtask } from "@/actions/tasks";
import { cloneTaskToDb } from "@/actions/tasks";
import { toast } from "sonner";

// --- Types ---

export type Priority = "P0" | "P1" | "P2" | "P3";

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: "image" | "file";
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: string; // ISO Date String
  completedAt?: string;
  priority?: Priority;
  tags?: string[];
  parentId?: string; // For subtasks
  subtasks?: Task[]; // Nested subtasks
  dependsOn?: string; // ID of blocking task (task dependency)
  estimatedMinutes?: number;
  actualMinutes?: number;
  recurrence?: {
    type: "daily" | "weekly" | "monthly";
    interval: number;
  } | null;
  // New fields
  assignees?: string[]; // IDs or names for now
  coverImage?: string;
  attachments?: Attachment[];
  columnId?: string; // For custom columns mapping (optional for now, defaults to derived status)
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO Date String
  end: string; // ISO Date String
  type: "work" | "personal" | "meeting";
  googleId?: string; // ID from Google Calendar
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: string;
    daysOfWeek?: number[]; // 0-6 for weekly, where 0 is Sunday
  } | null;
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
  metadata?: {
    checklist?: { checked: number; total: number };
    hasImages?: boolean;
    images?: string[]; // Array of image URLs (thumbnails)
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO Date String
  read: boolean;
  type: "info" | "success" | "warning" | "error";
  link?: string;
}

// --- Kanban Types ---

export interface Column {
  id: string;
  title: string;
  color: string; // Text color class
  bgColor: string; // Background color class
  wipLimit?: number;
  order: number;
}

export interface ViewSettings {
  mode: "board" | "swimlane";
  density: "compact" | "comfortable";
  swimlaneGroupBy: "priority" | "none" | "assignee"; // Grouping logic
  showCoverImages: boolean;
}

// --- Undo/Redo Stack ---

interface HistoryEntry {
  type: "task" | "event" | "note" | "column";
  action: "add" | "update" | "delete";
  before: Task | CalendarEvent | Note | Column | null;
  after: Task | CalendarEvent | Note | Column | null;
}

// --- Store Interface ---

// --- Timer Types ---

export type TimerMode = "focus" | "shortBreak" | "longBreak";

export interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
}

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
};

// --- Store Interface ---

interface AppState {
  // State
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  notifications: Notification[];
  columns: Column[];
  viewSettings: ViewSettings;
  selectedDate: string;
  googleAccessToken?: string;

  // Timer State
  timerMode: TimerMode;
  timeLeft: number;
  isTimerRunning: boolean;
  completedSessions: number;
  timerSettings: TimerSettings;
  activeTaskId: string | null;

  // Undo/Redo
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setGoogleAccessToken: (token: string) => void;
  setSelectedDate: (date: Date) => void;
  setViewSettings: (settings: Partial<ViewSettings>) => void;

  // Notification Actions
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Bulk set (for hydration from server)
  setTasks: (tasks: Task[]) => void;
  setEvents: (events: CalendarEvent[]) => void;
  setNotes: (notes: Note[]) => void;
  setColumns: (columns: Column[]) => void;

  // Task Actions
  addTask: (
    title: string,
    dueDate?: Date,
    priority?: Priority,
    columnId?: string,
    options?: {
      description?: string;
      subtasks?: Task[];
      estimatedMinutes?: number;
      tags?: string[];
      dependsOn?: string;
    }
  ) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskPriority: (id: string, priority: Priority) => void;

  // Bulk Actions
  bulkDeleteTasks: (ids: string[]) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;

  // Task Clone
  cloneTask: (id: string, options?: { newTitle?: string; shiftDays?: number }) => void;

  // Subtask Sync
  addSubtask: (taskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Column Actions
  addColumn: (column: Omit<Column, "id" | "order">) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (columns: Column[]) => void;

  // Event Actions
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Note Actions
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Timer Actions
  setTimerMode: (mode: TimerMode) => void;
  setTimerRunning: (isRunning: boolean) => void;
  setTimeLeft: (time: number) => void;
  tickTimer: () => void;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;
  incrementCompletedSessions: () => void;
  setActiveTimerTask: (taskId: string | null) => void;
  resetTimer: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushHistory: (entry: HistoryEntry) => void;
}

const MAX_HISTORY = 50;

const DEFAULT_COLUMNS: Column[] = [
  {
    id: "Todo",
    title: "To Do",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/50",
    order: 0,
  },
  {
    id: "InProgress",
    title: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    order: 1,
  },
  {
    id: "Done",
    title: "Done",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    order: 2,
  },
  {
    id: "Backlog",
    title: "Backlog",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    order: 3,
  },
];

const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  mode: "board",
  density: "comfortable",
  swimlaneGroupBy: "none",
  showCoverImages: true,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      events: [],
      notes: [],
      notifications: [],
      columns: DEFAULT_COLUMNS,
      viewSettings: DEFAULT_VIEW_SETTINGS,
      selectedDate: new Date().toISOString(),
      googleAccessToken: undefined,

      // Timer Initial State
      timerMode: "focus",
      timeLeft: DEFAULT_TIMER_SETTINGS.focusDuration * 60,
      isTimerRunning: false,
      completedSessions: 0,
      timerSettings: DEFAULT_TIMER_SETTINGS,
      activeTaskId: null,

      // Undo/Redo state
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,

      setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
      setSelectedDate: (date) => set({ selectedDate: date.toISOString() }),
      setViewSettings: (settings) =>
        set((state) => ({ viewSettings: { ...state.viewSettings, ...settings } })),

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

      setTasks: (tasks) => set({ tasks }),
      setEvents: (events) => set({ events }),
      setNotes: (notes) => set({ notes }),
      setColumns: (columns) => set({ columns }),

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

        toast.info("Action undone");
      },

      redo: () => {
        const { history, historyIndex, tasks, events, notes, columns } = get();
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

        toast.info("Action redone");
      },

      // --- Task Actions ---

      addTask: async (title, dueDate = new Date(), priority = "P2", columnId, options = {}) => {
        const newTask: Task = {
          id: uuidv4(),
          title,
          description: options.description || "",
          completed: false,
          dueDate: dueDate?.toISOString() || new Date().toISOString(),
          priority,
          tags: options.tags || [],
          subtasks: options.subtasks || [],
          estimatedMinutes: options.estimatedMinutes || 25,
          recurrence: null,
          columnId: columnId || "Todo",
          dependsOn: options.dependsOn,
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

        const isCompleting = !task.completed;
        const updatedTask = {
          ...task,
          completed: isCompleting,
          completedAt: isCompleting ? new Date().toISOString() : undefined,
          actualMinutes: isCompleting ? task.estimatedMinutes || 25 : task.actualMinutes,
        };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        }));

        // Check if completing this task unblocks any other tasks
        if (isCompleting) {
          const unblockedTasks = get().tasks.filter((t) => t.dependsOn === id && !t.completed);
          if (unblockedTasks.length > 0) {
            toast.success(`Unblocked ${unblockedTasks.length} task${unblockedTasks.length > 1 ? "s" : ""}: ${unblockedTasks.map((t) => t.title).join(", ")}`);
          }
        }

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

      toggleSubtask: async (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task || !task.subtasks) return;

        const subtask = task.subtasks.find((st) => st.id === subtaskId);
        if (!subtask) return;

        const isCompleting = !subtask.completed;

        const updatedSubtasks = task.subtasks.map((st) =>
          st.id === subtaskId
            ? {
                ...st,
                completed: isCompleting,
                completedAt: isCompleting ? new Date().toISOString() : undefined,
              }
            : st
        );

        const updatedTask = { ...task, subtasks: updatedSubtasks };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        }));

        get().pushHistory({
          type: "task",
          action: "update",
          before: task,
          after: updatedTask,
        });

        // Sync to database
        try {
          await syncSubtask({
            id: subtaskId,
            parentId: taskId,
            title: subtask.title,
            completed: isCompleting,
          });
        } catch (error) {
          console.error("Failed to sync subtask", error);
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

      updateTask: async (id, updates) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const updatedTask = { ...task, ...updates };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        }));

        get().pushHistory({
          type: "task",
          action: "update",
          before: task,
          after: updatedTask,
        });

        // Sync to server
        try {
          // Map Store Task fields to Server Update Input
          const serverUpdates: any = {
            id,
            ...updates,
          };

          // Handle specific field transformations if needed
          if (updates.dueDate) {
            // Ensure it's passed as string or null
            serverUpdates.dueDate = updates.dueDate;
          }

          const result = await serverUpdateTask(serverUpdates);
          if (!result.success) {
            // Rollback
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === id ? task : t)),
            }));
            toast.error(result.error || "Failed to update task");
          }
        } catch (error) {
          console.error("Failed to update task", error);
          // Rollback
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === id ? task : t)),
            }));
            toast.error("Failed to update task");
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

        toast.success(`Priority set to ${priority}`);
      },

      bulkDeleteTasks: (ids) => {
        const tasksToDelete = get().tasks.filter((t) => ids.includes(t.id));
        set((state) => ({ tasks: state.tasks.filter((t) => !ids.includes(t.id)) }));
        toast.success(`Deleted ${ids.length} tasks`);
        ids.forEach((id) => deleteTask(id).catch(console.error));
      },

      bulkUpdateTasks: (ids, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (ids.includes(t.id) ? { ...t, ...updates } : t)),
        }));
        toast.success(`Updated ${ids.length} tasks`);
      },

      // --- Task Clone ---

      cloneTask: async (id, options = {}) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const newId = uuidv4();
        let newDueDate = task.dueDate;

        if (options.shiftDays && task.dueDate) {
          const date = new Date(task.dueDate);
          date.setDate(date.getDate() + options.shiftDays);
          newDueDate = date.toISOString();
        }

        // Clone subtasks with new IDs
        const clonedSubtasks = task.subtasks?.map((st) => ({
          ...st,
          id: uuidv4(),
          completed: false,
          completedAt: undefined,
        })) || [];

        const clonedTask: Task = {
          ...task,
          id: newId,
          title: options.newTitle || `${task.title} (copy)`,
          completed: false,
          completedAt: undefined,
          dueDate: newDueDate,
          subtasks: clonedSubtasks,
          actualMinutes: undefined,
          dependsOn: undefined,
          columnId: "Todo",
        };

        // Optimistic update
        set((state) => ({ tasks: [...state.tasks, clonedTask] }));

        get().pushHistory({
          type: "task",
          action: "add",
          before: null,
          after: clonedTask,
        });

        toast.success("Task cloned");

        try {
          await cloneTaskToDb({
            id: newId,
            title: clonedTask.title,
            description: clonedTask.description,
            dueDate: clonedTask.dueDate,
            priority: clonedTask.priority,
            estimatedMinutes: clonedTask.estimatedMinutes,
            tags: clonedTask.tags,
            subtasks: clonedSubtasks.map((st) => ({
              id: st.id,
              title: st.title,
              completed: st.completed,
            })),
          });
        } catch (error) {
          console.error("Failed to clone task", error);
          toast.error("Failed to save cloned task");
        }
      },

      // --- Subtask Actions ---

      addSubtask: async (taskId, title) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newSubtask: Task = {
          id: uuidv4(),
          title,
          completed: false,
          dueDate: new Date().toISOString(),
          parentId: taskId,
        };

        const updatedTask = {
          ...task,
          subtasks: [...(task.subtasks || []), newSubtask],
        };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        }));

        get().pushHistory({
          type: "task",
          action: "update",
          before: task,
          after: updatedTask,
        });

        // Sync to database
        try {
          await syncSubtask({
            id: newSubtask.id,
            parentId: taskId,
            title: newSubtask.title,
            completed: newSubtask.completed,
          });
        } catch (error) {
          console.error("Failed to sync subtask", error);
        }
      },

      deleteSubtask: async (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const updatedTask = {
          ...task,
          subtasks: task.subtasks?.filter((st) => st.id !== subtaskId) || [],
        };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        }));

        get().pushHistory({
          type: "task",
          action: "update",
          before: task,
          after: updatedTask,
        });

        // Sync to database
        try {
          await deleteSubtask(subtaskId);
        } catch (error) {
          console.error("Failed to delete subtask", error);
        }
      },

      // --- Column Actions ---

      addColumn: (column) => {
        const newColumn: Column = {
          ...column,
          id: uuidv4(),
          order: get().columns.length,
        };
        set((state) => ({ columns: [...state.columns, newColumn] }));
      },

      updateColumn: (id, updates) => {
        set((state) => ({
          columns: state.columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteColumn: (id) => {
        set((state) => ({ columns: state.columns.filter((c) => c.id !== id) }));
      },

      reorderColumns: (columns) => {
        // Assume columns are passed in new order
        const updated = columns.map((c, i) => ({ ...c, order: i }));
        set({ columns: updated });
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
            tags: updates.tags,
            type: updates.type,
            metadata: updates.metadata,
            date: updates.date,
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
          const result = await serverDeleteNote(id);
          if (!result.success && note) {
            set((state) => ({ notes: [...state.notes, note] }));
            toast.error(result.error || "Failed to delete note");
          }
        } catch (error) {
          console.error("Failed to delete note", error);
        }
      },

      // --- Timer Actions ---
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
