import { isSameDay, subDays } from "date-fns";

export interface DailyActivity {
  date: Date;
  tasksCompleted: number;
  focusMinutes: number;
}

export class StatsCalculator {
  /**
   * Calculates the current streak of consecutive days with activity.
   * Activity is defined as completing at least one task or having focus time > 0.
   */
  static calculateStreak(activities: DailyActivity[]): number {
    if (!activities.length) return 0;

    // Sort by date descending
    const sortedActivities = [...activities].sort((a, b) => b.date.getTime() - a.date.getTime());

    // Check if there was activity today or yesterday to keep the streak alive
    const today = new Date();
    const yesterday = subDays(today, 1);

    // Find the most recent activity
    const lastActivity = sortedActivities[0];

    // If the last activity wasn't today or yesterday, the streak is broken (0)
    if (!isSameDay(lastActivity.date, today) && !isSameDay(lastActivity.date, yesterday)) {
      return 0;
    }

    let streak = 0;
    let currentCheckDate = isSameDay(lastActivity.date, today) ? today : yesterday;

    // We iterate through dates backwards.
    // Ideally activities are dense (every day has an entry), but if they are sparse, we need to handle gaps.
    // If the input `activities` is ONLY days with activity, we check if they are consecutive.

    for (const activity of sortedActivities) {
      if (isSameDay(activity.date, currentCheckDate)) {
        if (activity.tasksCompleted > 0 || activity.focusMinutes > 0) {
          streak++;
          currentCheckDate = subDays(currentCheckDate, 1);
        } else {
          // Explicit record of 0 activity breaks streak
          break;
        }
      } else if (activity.date.getTime() > currentCheckDate.getTime()) {
        // This activity is in the future relative to current check (duplicate or out of order), ignore
        continue;
      } else {
        // Gap in dates means streak broken
        break;
      }
    }

    return streak;
  }

  /**
   * Calculates estimated ROI (Time Saved) based on completed tasks.
   * Simple heuristic: 15 mins saved per task simply by organizing it.
   */
  static calculateROI(tasksCompleted: number): number {
    const MINUTES_SAVED_PER_TASK = 15;
    return (tasksCompleted * MINUTES_SAVED_PER_TASK) / 60; // Returns hours
  }

  /**
   * Generates a coaching message based on recent performance.
   */
  static getCoachingMessage(activities: DailyActivity[]): string {
    if (!activities.length) return "Welcome! Start completing tasks to see your analytics grow.";

    const totalFocus = activities.reduce((acc, curr) => acc + curr.focusMinutes, 0);
    const totalTasks = activities.reduce((acc, curr) => acc + curr.tasksCompleted, 0);

    if (totalFocus === 0 && totalTasks === 0)
      return "Try to complete a small task today to get the ball rolling!";
    if (totalFocus > 1200) return "You've been incredibly focused lately! make sure to recharge.";
    if (totalTasks > 20) return "You're crushing your task list! Great momentum.";

    return "Consistency is key. Keep up the good work!";
  }
}
