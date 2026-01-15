import { describe, it, expect } from "vitest";
import { StatsCalculator, DailyActivity } from "../stats-calculator";
import { subDays } from "date-fns";

describe("StatsCalculator", () => {
  describe("calculateStreak", () => {
    it("should return 0 for empty activities", () => {
      expect(StatsCalculator.calculateStreak([])).toBe(0);
    });

    it("should return 1 for activity only today", () => {
      const today = new Date();
      const activities: DailyActivity[] = [{ date: today, tasksCompleted: 1, focusMinutes: 0 }];
      expect(StatsCalculator.calculateStreak(activities)).toBe(1);
    });

    it("should count consecutive days with activity", () => {
      const today = new Date();
      const activities: DailyActivity[] = [
        { date: today, tasksCompleted: 1, focusMinutes: 25 },
        { date: subDays(today, 1), tasksCompleted: 2, focusMinutes: 50 },
        { date: subDays(today, 2), tasksCompleted: 1, focusMinutes: 0 },
      ];
      expect(StatsCalculator.calculateStreak(activities)).toBe(3);
    });

    it("should break streak when there is a gap", () => {
      const today = new Date();
      const activities: DailyActivity[] = [
        { date: today, tasksCompleted: 1, focusMinutes: 25 },
        { date: subDays(today, 1), tasksCompleted: 0, focusMinutes: 0 }, // Gap
        { date: subDays(today, 2), tasksCompleted: 1, focusMinutes: 25 },
      ];
      // Should return 1 because yesterday had zero activity
      expect(StatsCalculator.calculateStreak(activities)).toBe(1);
    });

    it("should count focus minutes as activity", () => {
      const today = new Date();
      const activities: DailyActivity[] = [{ date: today, tasksCompleted: 0, focusMinutes: 25 }];
      expect(StatsCalculator.calculateStreak(activities)).toBe(1);
    });

    it("should return 0 if last activity was not today or yesterday", () => {
      const twoDaysAgo = subDays(new Date(), 2);
      const activities: DailyActivity[] = [
        { date: twoDaysAgo, tasksCompleted: 5, focusMinutes: 100 },
      ];
      expect(StatsCalculator.calculateStreak(activities)).toBe(0);
    });
  });

  describe("calculateROI", () => {
    it("should return 0 for 0 tasks", () => {
      expect(StatsCalculator.calculateROI(0)).toBe(0);
    });

    it("should calculate hours saved (15 min per task)", () => {
      // 4 tasks * 15 min = 60 min = 1 hour
      expect(StatsCalculator.calculateROI(4)).toBe(1);
    });

    it("should return correct hours for any number of tasks", () => {
      // 10 tasks * 15 min = 150 min = 2.5 hours
      expect(StatsCalculator.calculateROI(10)).toBe(2.5);
    });
  });

  describe("getCoachingMessage", () => {
    it("should return welcome message for empty activities", () => {
      const message = StatsCalculator.getCoachingMessage([]);
      expect(message).toContain("Welcome");
    });

    it("should encourage starting when no activity", () => {
      const activities: DailyActivity[] = [
        { date: new Date(), tasksCompleted: 0, focusMinutes: 0 },
      ];
      const message = StatsCalculator.getCoachingMessage(activities);
      expect(message).toContain("small task");
    });

    it("should warn about recharging when high focus", () => {
      const activities: DailyActivity[] = [
        { date: new Date(), tasksCompleted: 0, focusMinutes: 1500 },
      ];
      const message = StatsCalculator.getCoachingMessage(activities);
      expect(message).toContain("recharge");
    });

    it("should celebrate high task completion", () => {
      const activities: DailyActivity[] = [
        { date: new Date(), tasksCompleted: 25, focusMinutes: 0 },
      ];
      const message = StatsCalculator.getCoachingMessage(activities);
      expect(message).toContain("crushing");
    });

    it("should give consistency message for moderate activity", () => {
      const activities: DailyActivity[] = [
        { date: new Date(), tasksCompleted: 5, focusMinutes: 60 },
      ];
      const message = StatsCalculator.getCoachingMessage(activities);
      expect(message).toContain("Consistency");
    });
  });
});
