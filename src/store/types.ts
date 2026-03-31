// --- Type Aliases ---

export type Priority = "P0" | "P1" | "P2" | "P3";
export type ViewMode = "board" | "swimlane";
export type Density = "compact" | "comfortable";
export type TimerMode = "focus" | "shortBreak" | "longBreak";

// --- Interfaces ---

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
  type: "meeting" | "personal" | "journal";
  eventId?: string; // Link to CalendarEvent
  sentiment?: "positive" | "neutral" | "negative";
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

export interface Column {
  id: string;
  title: string;
  color: string; // Text color class
  bgColor: string; // Background color class
  wipLimit?: number;
  order: number;
}

export interface ViewSettings {
  mode: ViewMode;
  density: Density;
  swimlaneGroupBy: "priority" | "none" | "assignee"; // Grouping logic
  showCoverImages: boolean;
}

export interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
}

// --- Undo/Redo ---

export interface HistoryEntry {
  type: "task" | "event" | "note" | "column";
  action: "add" | "update" | "delete";
  before: Task | CalendarEvent | Note | Column | null;
  after: Task | CalendarEvent | Note | Column | null;
}

// --- Constants ---

export const MAX_HISTORY = 50;

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
};

export const DEFAULT_COLUMNS: Column[] = [
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

export const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  mode: "board",
  density: "comfortable",
  swimlaneGroupBy: "none",
  showCoverImages: true,
};

// --- Store Interface ---

export interface AppState {
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
