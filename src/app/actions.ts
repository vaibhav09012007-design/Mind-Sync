/**
 * DEPRECATED: Server Actions Barrel Export
 *
 * This file is deprecated. Please import actions from:
 * - '@/actions'                      (all actions)
 * - '@/actions/tasks'                (task-specific actions)
 * - '@/actions/events'               (event-specific actions)
 * - '@/actions/notes'                (note-specific actions)
 * - '@/actions/ai'                   (AI-specific actions)
 * - '@/actions/shared'               (auth/utils)
 *
 * This file remains for backward compatibility only.
 */

// Export everything from the new structure
export * from "@/actions";

// Export goals (separate file)
export {
  getGoals,
  createGoal,
  updateGoalProgress,
  deleteGoal,
} from "@/actions/goals";