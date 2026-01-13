/**
 * Export utilities for MindSync
 * Export notes to Markdown and tasks to CSV
 */

import { Task, Note, CalendarEvent } from "@/store/useStore";
import { format } from "date-fns";

/**
 * Export a note to Markdown format
 */
export function exportNoteToMarkdown(note: Note): string {
  const lines: string[] = [];

  lines.push(`# ${note.title}`);
  lines.push("");
  lines.push(`*Created: ${format(new Date(note.date), "MMMM d, yyyy 'at' h:mm a")}*`);

  if (note.tags.length > 0) {
    lines.push(`*Tags: ${note.tags.join(", ")}*`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // Convert HTML content to simple markdown (basic conversion)
  const content = note.content
    .replace(/<h1[^>]*>/g, "# ")
    .replace(/<h2[^>]*>/g, "## ")
    .replace(/<h3[^>]*>/g, "### ")
    .replace(/<\/h[1-6]>/g, "\n")
    .replace(/<p[^>]*>/g, "")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<strong[^>]*>/g, "**")
    .replace(/<\/strong>/g, "**")
    .replace(/<em[^>]*>/g, "*")
    .replace(/<\/em>/g, "*")
    .replace(/<ul[^>]*>/g, "")
    .replace(/<\/ul>/g, "\n")
    .replace(/<ol[^>]*>/g, "")
    .replace(/<\/ol>/g, "\n")
    .replace(/<li[^>]*>/g, "- ")
    .replace(/<\/li>/g, "\n")
    .replace(/<[^>]+>/g, ""); // Remove any remaining HTML tags

  lines.push(content.trim());

  return lines.join("\n");
}

/**
 * Export tasks to CSV format
 */
export function exportTasksToCSV(tasks: Task[]): string {
  const headers = ["Title", "Status", "Due Date", "Priority", "Tags"];
  const rows = tasks.map((task) => [
    `"${task.title.replace(/"/g, '""')}"`,
    task.completed ? "Done" : "Todo",
    task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
    task.priority || "P2",
    task.tags?.join("; ") || "",
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Export events to ICS (iCalendar) format
 */
export function exportEventsToICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MindSync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@mindsync`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(start)}`);
    lines.push(`DTEND:${formatICSDate(end)}`);
    lines.push(`SUMMARY:${escapeICS(event.title)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Download a file to the user's device
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a note and download it
 */
export function downloadNoteAsMarkdown(note: Note): void {
  const content = exportNoteToMarkdown(note);
  const filename = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
  downloadFile(content, filename, "text/markdown");
}

/**
 * Export tasks and download them
 */
export function downloadTasksAsCSV(tasks: Task[]): void {
  const content = exportTasksToCSV(tasks);
  const filename = `tasks_${format(new Date(), "yyyy-MM-dd")}.csv`;
  downloadFile(content, filename, "text/csv");
}

/**
 * Export events and download them
 */
export function downloadEventsAsICS(events: CalendarEvent[]): void {
  const content = exportEventsToICS(events);
  const filename = `calendar_${format(new Date(), "yyyy-MM-dd")}.ics`;
  downloadFile(content, filename, "text/calendar");
}
