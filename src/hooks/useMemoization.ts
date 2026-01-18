/**
 * Memoization utilities for expensive computations
 */

import { useMemo, useCallback, useRef, useEffect } from "react";
import { Task, CalendarEvent, Note } from "@/store/useStore";

/**
 * Memoized task statistics calculator
 */
export function useTaskStats(tasks: Task[]) {
  return useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const byPriority = {
      P0: tasks.filter((t) => t.priority === "P0" && !t.completed).length,
      P1: tasks.filter((t) => t.priority === "P1" && !t.completed).length,
      P2: tasks.filter((t) => t.priority === "P2" && !t.completed).length,
      P3: tasks.filter((t) => t.priority === "P3" && !t.completed).length,
    };

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const totalEstimatedMinutes = tasks.reduce(
      (sum, t) => sum + (t.estimatedMinutes || 0),
      0
    );
    const completedMinutes = tasks
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);

    return {
      total,
      completed,
      pending,
      overdue,
      byPriority,
      completionRate,
      totalEstimatedMinutes,
      completedMinutes,
    };
  }, [tasks]);
}

/**
 * Memoized task grouping by column/status
 */
export function useTasksByColumn(tasks: Task[], columns: Array<{ id: string }>) {
  return useMemo(() => {
    const grouped = new Map<string, Task[]>();

    columns.forEach((col) => {
      grouped.set(col.id, []);
    });

    tasks.forEach((task) => {
      const columnId = task.columnId || (task.completed ? "Done" : "Todo");
      const existing = grouped.get(columnId) || [];
      grouped.set(columnId, [...existing, task]);
    });

    return grouped;
  }, [tasks, columns]);
}

/**
 * Memoized task filtering
 */
export function useFilteredTasks(
  tasks: Task[],
  filters: {
    search?: string;
    status?: "all" | "pending" | "completed";
    priority?: string | null;
    tags?: string[];
    dateRange?: { start: Date; end: Date } | null;
  }
) {
  return useMemo(() => {
    let result = tasks;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.status && filters.status !== "all") {
      result = result.filter((t) =>
        filters.status === "completed" ? t.completed : !t.completed
      );
    }

    if (filters.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter((t) =>
        filters.tags!.some((tag) => t.tags?.includes(tag))
      );
    }

    if (filters.dateRange) {
      result = result.filter((t) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= filters.dateRange!.start && dueDate <= filters.dateRange!.end;
      });
    }

    return result;
  }, [tasks, filters.search, filters.status, filters.priority, filters.tags, filters.dateRange]);
}

/**
 * Memoized event grouping by day
 */
export function useEventsByDay(events: CalendarEvent[]) {
  return useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const dateKey = new Date(event.start).toISOString().split("T")[0];
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, event]);
    });

    // Sort events within each day
    grouped.forEach((dayEvents, key) => {
      grouped.set(
        key,
        dayEvents.sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        )
      );
    });

    return grouped;
  }, [events]);
}

/**
 * Memoized notes search and filter
 */
export function useFilteredNotes(
  notes: Note[],
  filters: {
    search?: string;
    type?: "all" | "meeting" | "personal";
    tags?: string[];
  }
) {
  return useMemo(() => {
    let result = notes;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.preview.toLowerCase().includes(searchLower) ||
          n.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.type && filters.type !== "all") {
      result = result.filter((n) => n.type === filters.type);
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter((n) =>
        filters.tags!.some((tag) => n.tags?.includes(tag))
      );
    }

    return result;
  }, [notes, filters.search, filters.type, filters.tags]);
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    }) as T,
    [delay]
  );
}

/**
 * Memoized unique tags extractor
 */
export function useUniqueTags(tasks: Task[], notes: Note[]) {
  return useMemo(() => {
    const tagSet = new Set<string>();

    tasks.forEach((t) => {
      t.tags?.forEach((tag) => tagSet.add(tag));
    });

    notes.forEach((n) => {
      n.tags?.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }, [tasks, notes]);
}
