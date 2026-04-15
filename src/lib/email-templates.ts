/**
 * Email template generator for weekly productivity reports
 * Produces styled HTML emails with productivity stats
 */

export interface WeeklyStats {
  userName: string;
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: number; // 0-100
  streakDays: number;
  focusMinutes: number;
  eventsAttended: number;
  topTags: { tag: string; count: number }[];
  notesCreated: number;
}

export function generateWeeklyReportEmail(stats: WeeklyStats): string {
  const focusHours = Math.round(stats.focusMinutes / 60 * 10) / 10;

  const tagBadges = stats.topTags
    .slice(0, 5)
    .map(
      (t) =>
        `<span style="display:inline-block;background:#f0f0ff;color:#6366f1;padding:2px 10px;border-radius:12px;font-size:12px;margin:2px;">${t.tag} (${t.count})</span>`
    )
    .join(" ");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Productivity Report</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0;">
        ✨ Your Weekly Report
      </h1>
      <p style="color:#64748b;font-size:14px;margin:8px 0 0;">
        ${stats.weekStart} — ${stats.weekEnd}
      </p>
    </div>

    <!-- Greeting -->
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Hey ${stats.userName} 👋 — here's how your week went with Mind-Sync.
    </p>

    <!-- Stats Grid -->
    <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:20px;text-align:center;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;width:50%;">
            <div style="font-size:28px;font-weight:700;color:#8b5cf6;">${stats.tasksCompleted}</div>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Tasks Done</div>
          </td>
          <td style="padding:20px;text-align:center;border-bottom:1px solid #e2e8f0;width:50%;">
            <div style="font-size:28px;font-weight:700;color:#06b6d4;">${stats.completionRate}%</div>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Completion Rate</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;text-align:center;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;width:50%;">
            <div style="font-size:28px;font-weight:700;color:#f59e0b;">${stats.streakDays}</div>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Day Streak 🔥</div>
          </td>
          <td style="padding:20px;text-align:center;border-bottom:1px solid #e2e8f0;width:50%;">
            <div style="font-size:28px;font-weight:700;color:#10b981;">${focusHours}h</div>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Focus Time</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;text-align:center;border-right:1px solid #e2e8f0;width:50%;">
            <div style="font-size:28px;font-weight:700;color:#ec4899;">${stats.eventsAttended}</div>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Events</div>
          </td>
          <td style="padding:20px;text-align:center;width:50%;">
            <div style="font-size:28px;font-weight:700;color:#3b82f6;">${stats.notesCreated}</div>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Notes Created</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Top Tags -->
    ${stats.topTags.length > 0 ? `
    <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;padding:20px;margin:20px 0;">
      <h3 style="font-size:14px;font-weight:600;color:#334155;margin:0 0 12px;">Top Categories</h3>
      <div>${tagBadges}</div>
    </div>
    ` : ""}

    <!-- Completion Bar -->
    <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;padding:20px;margin:20px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:500;color:#334155;">Weekly Progress</span>
        <span style="font-size:13px;color:#64748b;">${stats.tasksCompleted}/${stats.tasksCreated} tasks</span>
      </div>
      <div style="background:#e2e8f0;border-radius:999px;height:8px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#8b5cf6,#06b6d4);height:100%;border-radius:999px;width:${Math.min(stats.completionRate, 100)}%;transition:width 0.3s;"></div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;border-top:1px solid #e2e8f0;margin-top:24px;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        Sent by Mind-Sync • <a href="#" style="color:#8b5cf6;text-decoration:none;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
