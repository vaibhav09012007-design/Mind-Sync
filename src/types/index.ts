export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: "today" | "tomorrow" | "overdue" | string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date; // standard Date object
  end: Date;
  type?: "meeting" | "work" | "personal";
  color?: string;
}

export interface Note {
  id: string;
  title: string;
  preview: string;
  content?: string; // HTML/JSON
  updatedAt: Date;
  tags?: string[];
  type: "meeting" | "personal" | "idea";
}
