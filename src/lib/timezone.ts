/**
 * Timezone Utilities
 * Handles timezone conversions and display
 */

// Get user's timezone
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Get list of common timezones
export function getCommonTimezones(): Array<{ value: string; label: string; offset: string }> {
  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { value: "Europe/Moscow", label: "Moscow (MSK)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Kolkata", label: "India (IST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Shanghai", label: "China (CST)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
    { value: "Pacific/Auckland", label: "Auckland (NZDT/NZST)" },
    { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  ];

  return timezones.map((tz) => ({
    ...tz,
    offset: getTimezoneOffset(tz.value),
  }));
}

// Get timezone offset string (e.g., "+05:30")
export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    return offsetPart?.value || "";
  } catch {
    return "";
  }
}

// Convert date to specific timezone
export function toTimezone(date: Date | string, timezone: string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(d.toLocaleString("en-US", { timeZone: timezone }));
}

// Format date in specific timezone
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    timeZone: timezone,
    ...options,
  });
}

// Format time in specific timezone
export function formatTimeInTimezone(
  date: Date | string,
  timezone: string,
  use24Hour: boolean = false
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: !use24Hour,
  });
}

// Get the difference in hours between two timezones
export function getTimezoneDifference(tz1: string, tz2: string): number {
  const now = new Date();

  const date1 = new Date(now.toLocaleString("en-US", { timeZone: tz1 }));
  const date2 = new Date(now.toLocaleString("en-US", { timeZone: tz2 }));

  return (date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
}

// Check if a timezone observes DST
export function observesDST(timezone: string): boolean {
  const january = new Date(new Date().getFullYear(), 0, 1);
  const july = new Date(new Date().getFullYear(), 6, 1);

  const janOffset = getTimezoneNumericOffset(january, timezone);
  const julOffset = getTimezoneNumericOffset(july, timezone);

  return janOffset !== julOffset;
}

// Get numeric offset in minutes
function getTimezoneNumericOffset(date: Date, timezone: string): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
}

// Convert ISO string to timezone-aware display
export function toTimezoneAwareString(
  isoString: string,
  timezone: string,
  options?: {
    includeDate?: boolean;
    includeTime?: boolean;
    use24Hour?: boolean;
  }
): string {
  const { includeDate = true, includeTime = true, use24Hour = false } = options || {};

  const date = new Date(isoString);
  const parts: string[] = [];

  if (includeDate) {
    parts.push(
      date.toLocaleDateString("en-US", {
        timeZone: timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );
  }

  if (includeTime) {
    parts.push(
      date.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: !use24Hour,
      })
    );
  }

  return parts.join(" at ");
}

// Create a date in a specific timezone
export function createDateInTimezone(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  timezone: string
): Date {
  // Create a date string in the target timezone
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

  // Get the offset for this timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  });

  // This is a simplified approach - for production, consider using date-fns-tz
  const testDate = new Date(dateStr);
  const utcDate = new Date(testDate.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(testDate.toLocaleString("en-US", { timeZone: timezone }));
  const offset = utcDate.getTime() - tzDate.getTime();

  return new Date(testDate.getTime() + offset);
}
