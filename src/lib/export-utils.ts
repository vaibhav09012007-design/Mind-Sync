import { Task, CalendarEvent, Note } from "@/store/useStore";

// Download helper
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
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

// Export to JSON
export function exportToJSON<T>(data: T, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  downloadFile(jsonStr, `${filename}.json`, "application/json");
}

// Export to CSV
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
): void {
  if (data.length === 0) {
    downloadFile("", `${filename}.csv`, "text/csv");
    return;
  }

  // Use provided columns or infer from first item
  const cols = columns || Object.keys(data[0]).map((key) => ({ key: key as keyof T, header: key }));

  // Header row
  const header = cols.map((col) => `"${col.header}"`).join(",");

  // Data rows
  const rows = data.map((item) =>
    cols
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${value}"`;
      })
      .join(",")
  );

  const csvContent = [header, ...rows].join("\n");
  downloadFile(csvContent, `${filename}.csv`, "text/csv");
}

// Export note to Markdown
export function exportNoteToMarkdown(note: Note): void {
  const markdown = `# ${note.title}

${note.content}

---
*Exported from Mind-Sync on ${new Date().toLocaleDateString()}*
`;
  downloadFile(markdown, `${note.title.replace(/[^a-z0-9]/gi, "_")}.md`, "text/markdown");
}

// Export tasks to CSV
export function exportTasksToCSV(tasks: Task[]): void {
  exportToCSV(
    tasks.map((t) => ({
      title: t.title,
      completed: t.completed ? "Yes" : "No",
      priority: t.priority || "P2",
      dueDate: t.dueDate || "",
      tags: t.tags?.join(", ") || "",
      completedAt: t.completedAt || "",
    })),
    "mind-sync-tasks",
    [
      { key: "title", header: "Title" },
      { key: "completed", header: "Completed" },
      { key: "priority", header: "Priority" },
      { key: "dueDate", header: "Due Date" },
      { key: "tags", header: "Tags" },
      { key: "completedAt", header: "Completed At" },
    ]
  );
}

// Export tasks to JSON
export function exportTasksToJSON(tasks: Task[]): void {
  exportToJSON(tasks, "mind-sync-tasks");
}

// Export events to CSV
export function exportEventsToCSV(events: CalendarEvent[]): void {
  exportToCSV(
    events.map((e) => ({
      title: e.title,
      start: e.start,
      end: e.end,
      type: e.type,
    })),
    "mind-sync-events",
    [
      { key: "title", header: "Title" },
      { key: "start", header: "Start" },
      { key: "end", header: "End" },
      { key: "type", header: "Type" },
    ]
  );
}

// Export all data (bulk export)
export function exportAllData(data: {
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
}): void {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: {
      tasks: data.tasks,
      events: data.events,
      notes: data.notes,
    },
  };
  exportToJSON(exportData, "mind-sync-backup");
}
