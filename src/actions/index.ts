"use server";

/**
 * Server Actions Barrel Export
 * Re-exports all server actions from their respective modules
 */

// User sync
export { syncUser, requireAuth, ensureUserExists } from "./shared";

// Tasks
export {
  getTasks,
  createTask,
  toggleTaskStatus,
  deleteTask,
  deleteCompletedTasks,
  syncSubtask,
  deleteSubtask,
  cloneTaskToDb,
  bulkImportTasks,
} from "./tasks";

// Events
export {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  syncGoogleCalendar,
} from "./events";

// Notes
export {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from "./notes";

// AI
export {
  summarizeMeeting,
  generateSchedule,
} from "./ai";

// Goals (already in separate file)
export {
  getGoals,
  createGoal,
  updateGoalProgress,
  deleteGoal,
} from "./goals";
