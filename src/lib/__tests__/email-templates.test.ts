import { describe, it, expect } from "vitest";
import { generateWeeklyReportEmail, type WeeklyStats } from "@/lib/email-templates";

/**
 * Tests for the weekly report email template generator
 */
describe("Email Templates", () => {
  const mockStats: WeeklyStats = {
    userName: "vaibhav",
    weekStart: "Apr 8",
    weekEnd: "Apr 15, 2026",
    tasksCompleted: 23,
    tasksCreated: 30,
    completionRate: 77,
    streakDays: 5,
    focusMinutes: 420,
    eventsAttended: 8,
    topTags: [
      { tag: "feature", count: 10 },
      { tag: "bug", count: 5 },
    ],
    notesCreated: 3,
  };

  it("generates valid HTML", () => {
    const html = generateWeeklyReportEmail(mockStats);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes user name", () => {
    const html = generateWeeklyReportEmail(mockStats);
    expect(html).toContain("vaibhav");
  });

  it("includes task stats", () => {
    const html = generateWeeklyReportEmail(mockStats);
    expect(html).toContain("23");    // tasks completed
    expect(html).toContain("77%");   // completion rate
  });

  it("includes streak days", () => {
    const html = generateWeeklyReportEmail(mockStats);
    expect(html).toContain("5");     // streak
    expect(html).toContain("🔥");   // fire emoji
  });

  it("includes focus hours (converted from minutes)", () => {
    const html = generateWeeklyReportEmail(mockStats);
    expect(html).toContain("7h");    // 420 min = 7 hours
  });

  it("includes top tags as badges", () => {
    const html = generateWeeklyReportEmail(mockStats);
    expect(html).toContain("feature (10)");
    expect(html).toContain("bug (5)");
  });

  it("includes date range", () => {
    const html = generateWeeklyReportEmail(mockStats);
    expect(html).toContain("Apr 8");
    expect(html).toContain("Apr 15, 2026");
  });

  it("includes progress bar with correct width", () => {
    const html = generateWeeklyReportEmail(mockStats);
    expect(html).toContain("width:77%");
  });

  it("caps progress bar at 100%", () => {
    const overStats = { ...mockStats, completionRate: 150 };
    const html = generateWeeklyReportEmail(overStats);
    expect(html).toContain("width:100%");
  });

  it("handles zero tags gracefully", () => {
    const noTagStats = { ...mockStats, topTags: [] };
    const html = generateWeeklyReportEmail(noTagStats);
    expect(html).toContain("<!DOCTYPE html>");
    // Should not contain the Top Categories section
    expect(html).not.toContain("Top Categories");
  });
});
