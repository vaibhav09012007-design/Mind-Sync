import { describe, it, expect } from "vitest";
import {
  generateRecurringDates,
  shouldCreateInstance,
  getNextOccurrence,
  describeRecurrence,
} from "../recurring-tasks";

describe("Recurring Tasks Utility", () => {
  describe("generateRecurringDates", () => {
    it("should generate daily occurrences", () => {
      const start = new Date("2026-04-01");
      const rangeStart = new Date("2026-04-01");
      const rangeEnd = new Date("2026-04-05");
      const dates = generateRecurringDates(start, { type: "daily", interval: 1 }, rangeStart, rangeEnd);
      expect(dates).toHaveLength(5); // Apr 1,2,3,4,5
    });

    it("should generate daily occurrences with interval > 1", () => {
      const start = new Date("2026-04-01");
      const rangeStart = new Date("2026-04-01");
      const rangeEnd = new Date("2026-04-10");
      const dates = generateRecurringDates(start, { type: "daily", interval: 3 }, rangeStart, rangeEnd);
      // Apr 1, 4, 7, 10
      expect(dates).toHaveLength(4);
    });

    it("should generate weekly occurrences", () => {
      const start = new Date("2026-04-01");
      const rangeStart = new Date("2026-04-01");
      const rangeEnd = new Date("2026-04-30");
      const dates = generateRecurringDates(start, { type: "weekly", interval: 1 }, rangeStart, rangeEnd);
      // Apr 1, 8, 15, 22, 29
      expect(dates).toHaveLength(5);
    });

    it("should generate bi-weekly occurrences", () => {
      const start = new Date("2026-04-01");
      const rangeStart = new Date("2026-04-01");
      const rangeEnd = new Date("2026-04-30");
      const dates = generateRecurringDates(start, { type: "weekly", interval: 2 }, rangeStart, rangeEnd);
      // Apr 1, 15, 29
      expect(dates).toHaveLength(3);
    });

    it("should generate monthly occurrences", () => {
      const start = new Date("2026-01-15");
      const rangeStart = new Date("2026-01-15");
      const rangeEnd = new Date("2026-06-15");
      const dates = generateRecurringDates(start, { type: "monthly", interval: 1 }, rangeStart, rangeEnd);
      // Jan 15, Feb 15, Mar 15, Apr 15, May 15, Jun 15
      expect(dates).toHaveLength(6);
    });

    it("should only return dates within the range", () => {
      const start = new Date("2026-04-01");
      const rangeStart = new Date("2026-04-05");
      const rangeEnd = new Date("2026-04-10");
      const dates = generateRecurringDates(start, { type: "daily", interval: 1 }, rangeStart, rangeEnd);
      // Apr 5,6,7,8,9,10
      expect(dates).toHaveLength(6);
      expect(dates[0].getDate()).toBe(5);
    });

    it("should return empty array when start is after range", () => {
      const start = new Date("2026-05-01");
      const rangeStart = new Date("2026-04-01");
      const rangeEnd = new Date("2026-04-10");
      const dates = generateRecurringDates(start, { type: "daily", interval: 1 }, rangeStart, rangeEnd);
      expect(dates).toHaveLength(0);
    });
  });

  describe("shouldCreateInstance", () => {
    it("should return true when no existing instance for the date", () => {
      const date = new Date("2026-04-05");
      const existing = [new Date("2026-04-01"), new Date("2026-04-03")];
      expect(shouldCreateInstance(date, existing)).toBe(true);
    });

    it("should return false when instance already exists for that date", () => {
      const date = new Date("2026-04-05");
      const existing = [new Date("2026-04-05"), new Date("2026-04-06")];
      expect(shouldCreateInstance(date, existing)).toBe(false);
    });

    it("should ignore time when comparing dates", () => {
      const date = new Date("2026-04-05T10:00:00");
      const existing = [new Date("2026-04-05T22:00:00")];
      expect(shouldCreateInstance(date, existing)).toBe(false);
    });

    it("should return true for empty existing array", () => {
      const date = new Date("2026-04-05");
      expect(shouldCreateInstance(date, [])).toBe(true);
    });
  });

  describe("getNextOccurrence", () => {
    it("should return next day for daily interval 1", () => {
      const from = new Date("2026-04-01");
      const next = getNextOccurrence(from, { type: "daily", interval: 1 });
      expect(next.getDate()).toBe(2);
    });

    it("should return date 3 days later for daily interval 3", () => {
      const from = new Date("2026-04-01");
      const next = getNextOccurrence(from, { type: "daily", interval: 3 });
      expect(next.getDate()).toBe(4);
    });

    it("should return next week for weekly interval 1", () => {
      const from = new Date("2026-04-01");
      const next = getNextOccurrence(from, { type: "weekly", interval: 1 });
      expect(next.getDate()).toBe(8);
    });

    it("should return next month for monthly interval 1", () => {
      const from = new Date("2026-04-15");
      const next = getNextOccurrence(from, { type: "monthly", interval: 1 });
      expect(next.getMonth()).toBe(4); // May (0-indexed)
    });
  });

  describe("describeRecurrence", () => {
    it("should describe daily interval 1", () => {
      expect(describeRecurrence({ type: "daily", interval: 1 })).toBe("Every day");
    });

    it("should describe weekly interval 1", () => {
      expect(describeRecurrence({ type: "weekly", interval: 1 })).toBe("Every week");
    });

    it("should describe monthly interval 1", () => {
      expect(describeRecurrence({ type: "monthly", interval: 1 })).toBe("Every month");
    });

    it("should describe daily interval > 1", () => {
      expect(describeRecurrence({ type: "daily", interval: 3 })).toBe("Every 3 days");
    });

    it("should describe weekly interval > 1", () => {
      expect(describeRecurrence({ type: "weekly", interval: 2 })).toBe("Every 2 weeks");
    });

    it("should describe monthly interval > 1", () => {
      expect(describeRecurrence({ type: "monthly", interval: 6 })).toBe("Every 6 months");
    });
  });
});
