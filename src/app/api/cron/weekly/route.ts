import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, events, notes, users, habits, habitLogs } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { generateWeeklyReportEmail, type WeeklyStats } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * Weekly Productivity Report Cron Endpoint
 * 
 * Secured with CRON_SECRET header.
 * Vercel Cron: schedule "0 9 * * 1" (every Monday at 9 AM).
 * 
 * Local test: GET /api/cron/weekly?secret=your_cron_secret
 */
export async function GET(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const providedSecret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    url.searchParams.get("secret");

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate date range (past 7 days)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Fetch all users
    const allUsers = await db.select().from(users);

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of allUsers) {
      try {
        // Fetch weekly stats for this user
        const [
          userTasks,
          userEvents,
          userNotes,
        ] = await Promise.all([
          db
            .select()
            .from(tasks)
            .where(eq(tasks.userId, user.id)),
          db
            .select()
            .from(events)
            .where(
              and(
                eq(events.userId, user.id),
                gte(events.startTime, weekStart),
                lte(events.startTime, weekEnd)
              )
            ),
          db
            .select()
            .from(notes)
            .where(
              and(
                eq(notes.userId, user.id),
                gte(notes.createdAt, weekStart),
                lte(notes.createdAt, weekEnd)
              )
            ),
        ]);

        // Calculate stats
        const tasksCreatedThisWeek = userTasks.filter(
          (t) => t.createdAt && t.createdAt >= weekStart
        );
        const tasksCompletedThisWeek = userTasks.filter(
          (t) =>
            t.status === "Done" &&
            t.completedAt &&
            t.completedAt >= weekStart
        );

        const completionRate =
          tasksCreatedThisWeek.length > 0
            ? Math.round(
                (tasksCompletedThisWeek.length / tasksCreatedThisWeek.length) *
                  100
              )
            : 0;

        // Calculate focus time (sum of actual minutes for completed tasks this week)
        const focusMinutes = tasksCompletedThisWeek.reduce(
          (sum, t) => sum + (t.actualMinutes ?? 0),
          0
        );

        // Tag frequency
        const tagCounts: Record<string, number> = {};
        for (const t of tasksCompletedThisWeek) {
          for (const tag of t.tags ?? []) {
            tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
          }
        }
        const topTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({ tag, count }));

        // Streak — count consecutive days with at least 1 task completed
        let streakDays = 0;
        const checkDate = new Date(now);
        for (let i = 0; i < 30; i++) {
          const dayStart = new Date(checkDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(checkDate);
          dayEnd.setHours(23, 59, 59, 999);

          const completedThatDay = userTasks.some(
            (t) =>
              t.status === "Done" &&
              t.completedAt &&
              t.completedAt >= dayStart &&
              t.completedAt <= dayEnd
          );

          if (completedThatDay) {
            streakDays++;
          } else if (i > 0) {
            break; // Streak broken
          }

          checkDate.setDate(checkDate.getDate() - 1);
        }

        const stats: WeeklyStats = {
          userName: user.email.split("@")[0],
          weekStart: weekStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          weekEnd: weekEnd.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          tasksCompleted: tasksCompletedThisWeek.length,
          tasksCreated: tasksCreatedThisWeek.length,
          completionRate,
          streakDays,
          focusMinutes,
          eventsAttended: userEvents.length,
          topTags,
          notesCreated: userNotes.length,
        };

        const html = generateWeeklyReportEmail(stats);
        const sent = await sendEmail({
          to: user.email,
          subject: `Your Week in Mind-Sync: ${stats.tasksCompleted} tasks done ✨`,
          html,
        });

        if (sent) sentCount++;
      } catch (userError) {
        const errMsg = `Failed for user ${user.email}: ${(userError as Error).message}`;
        errors.push(errMsg);
        logger.error("Weekly report failed for user", userError as Error, {
          action: "weeklyReport",
          userId: user.id,
        });
      }
    }

    logger.info("Weekly reports sent", {
      action: "weeklyReport",
      sentCount,
      totalUsers: allUsers.length,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: allUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error("Weekly cron failed", error as Error, {
      action: "weeklyReport",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
