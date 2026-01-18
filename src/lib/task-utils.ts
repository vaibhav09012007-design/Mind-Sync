/**
 * Task Utilities
 * Helper functions for task operations
 */

import { Task, Priority } from "@/store/useStore";
import { v4 as uuidv4 } from "uuid";

/**
 * Clone a task with a new ID and optional modifications
 */
export function cloneTask(
  task: Task,
  options: {
    resetCompleted?: boolean;
    newTitle?: string;
    shiftDueDate?: number; // days to shift
    includeSubtasks?: boolean;
  } = {}
): Task {
  const {
    resetCompleted = true,
    newTitle,
    shiftDueDate = 0,
    includeSubtasks = true,
  } = options;

  // Calculate new due date if shifting
  let newDueDate = task.dueDate;
  if (shiftDueDate !== 0 && task.dueDate) {
    const date = new Date(task.dueDate);
    date.setDate(date.getDate() + shiftDueDate);
    newDueDate = date.toISOString();
  }

  // Clone subtasks with new IDs
  const clonedSubtasks = includeSubtasks && task.subtasks
    ? task.subtasks.map((st) => ({
        ...st,
        id: uuidv4(),
        completed: resetCompleted ? false : st.completed,
        completedAt: resetCompleted ? undefined : st.completedAt,
      }))
    : [];

  return {
    ...task,
    id: uuidv4(),
    title: newTitle || `${task.title} (copy)`,
    completed: resetCompleted ? false : task.completed,
    completedAt: resetCompleted ? undefined : task.completedAt,
    dueDate: newDueDate,
    subtasks: clonedSubtasks,
    // Clear task-specific tracking
    actualMinutes: resetCompleted ? undefined : task.actualMinutes,
    // Keep the dependency cleared (cloned task shouldn't inherit blocks)
    dependsOn: undefined,
  };
}

/**
 * Export tasks to CSV format
 */
export function exportTasksToCSV(tasks: Task[]): string {
  const headers = [
    "Title",
    "Description",
    "Completed",
    "Due Date",
    "Priority",
    "Tags",
    "Estimated Minutes",
    "Actual Minutes",
    "Column",
  ];

  const rows = tasks.map((task) => [
    escapeCSV(task.title),
    escapeCSV(task.description || ""),
    task.completed ? "Yes" : "No",
    task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "",
    task.priority || "",
    (task.tags || []).join(";"),
    task.estimatedMinutes?.toString() || "",
    task.actualMinutes?.toString() || "",
    task.columnId || "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function escapeCSV(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export tasks to JSON format
 */
export function exportTasksToJSON(tasks: Task[]): string {
  const exportData = tasks.map((task) => ({
    title: task.title,
    description: task.description,
    completed: task.completed,
    dueDate: task.dueDate,
    priority: task.priority,
    tags: task.tags,
    estimatedMinutes: task.estimatedMinutes,
    subtasks: task.subtasks?.map((st) => ({
      title: st.title,
      completed: st.completed,
    })),
  }));

  return JSON.stringify(exportData, null, 2);
}

/**
 * Parse tasks from CSV
 */
export function parseTasksFromCSV(csv: string): Partial<Task>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const tasks: Partial<Task>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const task: Partial<Task> = {
      id: uuidv4(),
      title: values[headers.indexOf("title")] || `Task ${i}`,
      description: values[headers.indexOf("description")] || undefined,
      completed: values[headers.indexOf("completed")]?.toLowerCase() === "yes",
      priority: parsePriority(values[headers.indexOf("priority")]),
      tags: values[headers.indexOf("tags")]?.split(";").filter(Boolean) || [],
    };

    const dueDate = values[headers.indexOf("due date")];
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        task.dueDate = parsed.toISOString();
      }
    }

    const estimated = parseInt(values[headers.indexOf("estimated minutes")]);
    if (!isNaN(estimated)) {
      task.estimatedMinutes = estimated;
    }

    tasks.push(task);
  }

  return tasks;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

function parsePriority(value: string | undefined): Priority | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if (["P0", "P1", "P2", "P3"].includes(upper)) {
    return upper as Priority;
  }
  return undefined;
}

/**
 * Parse tasks from JSON
 */
export function parseTasksFromJSON(json: string): Partial<Task>[] {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return [];

    return data.map((item: Record<string, unknown>) => ({
      id: uuidv4(),
      title: String(item.title || "Untitled"),
      description: item.description ? String(item.description) : undefined,
      completed: Boolean(item.completed),
      dueDate: item.dueDate ? String(item.dueDate) : undefined,
      priority: parsePriority(item.priority as string),
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      estimatedMinutes:
        typeof item.estimatedMinutes === "number"
          ? item.estimatedMinutes
          : undefined,
      subtasks: Array.isArray(item.subtasks)
        ? item.subtasks.map((st: Record<string, unknown>) => ({
            id: uuidv4(),
            title: String(st.title || ""),
            completed: Boolean(st.completed),
            dueDate: new Date().toISOString(),
          }))
        : [],
      columnId: "Todo",
    }));
  } catch {
    return [];
  }
}
