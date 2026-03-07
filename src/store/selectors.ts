import { useMemo } from "react";
import { useStore } from "./useStore";

// ── State selectors (return stable references) ──────────────────

export const useTasks = () => useStore((s) => s.tasks);
export const useEvents = () => useStore((s) => s.events);
export const useNotes = () => useStore((s) => s.notes);
export const useNotifications = () => useStore((s) => s.notifications);
export const useColumns = () => useStore((s) => s.columns);
export const useViewSettings = () => useStore((s) => s.viewSettings);
export const useSelectedDate = () => useStore((s) => s.selectedDate);

// ── Timer selectors (individual primitives) ─────────────────────

export const useTimerMode = () => useStore((s) => s.timerMode);
export const useTimeLeft = () => useStore((s) => s.timeLeft);
export const useIsTimerRunning = () => useStore((s) => s.isTimerRunning);
export const useCompletedSessions = () => useStore((s) => s.completedSessions);
export const useTimerSettings = () => useStore((s) => s.timerSettings);
export const useActiveTaskId = () => useStore((s) => s.activeTaskId);

// Backward-compatible object selector using individual hooks
export const useTimerState = () => {
  const timerMode = useTimerMode();
  const timeLeft = useTimeLeft();
  const isTimerRunning = useIsTimerRunning();
  const completedSessions = useCompletedSessions();
  const timerSettings = useTimerSettings();
  const activeTaskId = useActiveTaskId();
  return useMemo(() => ({
    timerMode,
    timeLeft,
    isTimerRunning,
    completedSessions,
    timerSettings,
    activeTaskId,
  }), [timerMode, timeLeft, isTimerRunning, completedSessions, timerSettings, activeTaskId]);
};

// ── History selectors (individual primitives) ───────────────────

export const useCanUndo = () => useStore((s) => s.canUndo);
export const useCanRedo = () => useStore((s) => s.canRedo);

// Backward-compatible object selector
export const useHistory = () => {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  return useMemo(() => ({ canUndo, canRedo }), [canUndo, canRedo]);
};

// ── Action selectors (individual function refs) ─────────────────

// Task actions
export const useAddTask = () => useStore((s) => s.addTask);
export const useUpdateTask = () => useStore((s) => s.updateTask);
export const useDeleteTaskAction = () => useStore((s) => s.deleteTask);
export const useToggleTask = () => useStore((s) => s.toggleTask);
export const useToggleSubtask = () => useStore((s) => s.toggleSubtask);
export const useUpdateTaskPriority = () => useStore((s) => s.updateTaskPriority);
export const useBulkDeleteTasks = () => useStore((s) => s.bulkDeleteTasks);
export const useBulkUpdateTasks = () => useStore((s) => s.bulkUpdateTasks);
export const useCloneTask = () => useStore((s) => s.cloneTask);
export const useAddSubtask = () => useStore((s) => s.addSubtask);
export const useDeleteSubtask = () => useStore((s) => s.deleteSubtask);

// Backward-compatible object selector
export const useTaskActions = () => {
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTaskAction();
  const toggleTask = useToggleTask();
  const toggleSubtask = useToggleSubtask();
  const updateTaskPriority = useUpdateTaskPriority();
  const bulkDeleteTasks = useBulkDeleteTasks();
  const bulkUpdateTasks = useBulkUpdateTasks();
  const cloneTask = useCloneTask();
  const addSubtask = useAddSubtask();
  const deleteSubtaskAction = useDeleteSubtask();
  return useMemo(() => ({
    addTask, updateTask, deleteTask, toggleTask, toggleSubtask,
    updateTaskPriority, bulkDeleteTasks, bulkUpdateTasks, cloneTask,
    addSubtask, deleteSubtask: deleteSubtaskAction,
  }), [addTask, updateTask, deleteTask, toggleTask, toggleSubtask,
    updateTaskPriority, bulkDeleteTasks, bulkUpdateTasks, cloneTask,
    addSubtask, deleteSubtaskAction]);
};

// Event actions
export const useEventActions = () => {
  const addEvent = useStore((s) => s.addEvent);
  const updateEvent = useStore((s) => s.updateEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  return useMemo(() => ({ addEvent, updateEvent, deleteEvent }), [addEvent, updateEvent, deleteEvent]);
};

// Note actions
export const useNoteActions = () => {
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);
  return useMemo(() => ({ addNote, updateNote, deleteNote }), [addNote, updateNote, deleteNote]);
};

// Column actions
export const useColumnActions = () => {
  const addColumn = useStore((s) => s.addColumn);
  const updateColumn = useStore((s) => s.updateColumn);
  const deleteColumn = useStore((s) => s.deleteColumn);
  const reorderColumns = useStore((s) => s.reorderColumns);
  return useMemo(() => ({ addColumn, updateColumn, deleteColumn, reorderColumns }), [addColumn, updateColumn, deleteColumn, reorderColumns]);
};

// Timer actions
export const useTimerActions = () => {
  const setTimerMode = useStore((s) => s.setTimerMode);
  const setTimerRunning = useStore((s) => s.setTimerRunning);
  const setTimeLeft = useStore((s) => s.setTimeLeft);
  const tickTimer = useStore((s) => s.tickTimer);
  const updateTimerSettings = useStore((s) => s.updateTimerSettings);
  const incrementCompletedSessions = useStore((s) => s.incrementCompletedSessions);
  const setActiveTimerTask = useStore((s) => s.setActiveTimerTask);
  const resetTimer = useStore((s) => s.resetTimer);
  return useMemo(() => ({
    setTimerMode, setTimerRunning, setTimeLeft, tickTimer,
    updateTimerSettings, incrementCompletedSessions, setActiveTimerTask, resetTimer,
  }), [setTimerMode, setTimerRunning, setTimeLeft, tickTimer,
    updateTimerSettings, incrementCompletedSessions, setActiveTimerTask, resetTimer]);
};

// Notification actions
export const useNotificationActions = () => {
  const addNotification = useStore((s) => s.addNotification);
  const markNotificationAsRead = useStore((s) => s.markNotificationAsRead);
  const markAllNotificationsAsRead = useStore((s) => s.markAllNotificationsAsRead);
  const clearNotifications = useStore((s) => s.clearNotifications);
  return useMemo(() => ({
    addNotification, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications,
  }), [addNotification, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications]);
};

// View actions
export const useViewActions = () => {
  const setViewSettings = useStore((s) => s.setViewSettings);
  const setSelectedDate = useStore((s) => s.setSelectedDate);
  const setGoogleAccessToken = useStore((s) => s.setGoogleAccessToken);
  return useMemo(() => ({ setViewSettings, setSelectedDate, setGoogleAccessToken }), [setViewSettings, setSelectedDate, setGoogleAccessToken]);
};

// Hydration actions
export const useHydrationActions = () => {
  const setTasks = useStore((s) => s.setTasks);
  const setEvents = useStore((s) => s.setEvents);
  const setNotes = useStore((s) => s.setNotes);
  const setColumns = useStore((s) => s.setColumns);
  return useMemo(() => ({ setTasks, setEvents, setNotes, setColumns }), [setTasks, setEvents, setNotes, setColumns]);
};

// History actions
export const useHistoryActions = () => {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const pushHistory = useStore((s) => s.pushHistory);
  return useMemo(() => ({ undo, redo, pushHistory }), [undo, redo, pushHistory]);
};

// ── Derived selectors ────────────────────────────────────────────

export const useTaskMap = () => {
  const tasks = useTasks();
  return useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
};

