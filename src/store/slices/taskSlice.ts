import { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  createTask,
  toggleTaskStatus,
  updateTask as serverUpdateTask,
  deleteTask,
  syncSubtask,
  deleteSubtask,
  cloneTaskToDb,
} from "@/actions/tasks";
import { showToast } from "@/lib/toast-queue";
import { logger } from "@/lib/logger";
import type { Task, Priority, AppState } from "../types";

export interface TaskSlice {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (
    title: string,
    dueDate?: Date,
    priority?: Priority,
    columnId?: string,
    options?: {
      description?: string;
      subtasks?: Task[];
      estimatedMinutes?: number;
      tags?: string[];
      dependsOn?: string;
    }
  ) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskPriority: (id: string, priority: Priority) => void;
  bulkDeleteTasks: (ids: string[]) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  cloneTask: (id: string, options?: { newTitle?: string; shiftDays?: number }) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
}

export const createTaskSlice: StateCreator<AppState, [], [], TaskSlice> = (set, get) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  addTask: async (title, dueDate = new Date(), priority = "P2", columnId, options = {}) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      description: options.description || "",
      completed: false,
      dueDate: dueDate?.toISOString() || new Date().toISOString(),
      priority,
      tags: options.tags || [],
      subtasks: options.subtasks || [],
      estimatedMinutes: options.estimatedMinutes || 25,
      recurrence: null,
      columnId: columnId || "Todo",
      dependsOn: options.dependsOn,
    };

    // Optimistic update
    set((state) => ({ tasks: [...state.tasks, newTask] }));

    // Push to history
    get().pushHistory({
      type: "task",
      action: "add",
      before: null,
      after: newTask,
    });

    try {
      const result = await createTask({
        id: newTask.id,
        title: newTask.title,
        dueDate: newTask.dueDate,
      });

      if (!result.success) {
        // Rollback on failure
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== newTask.id),
        }));
        showToast.error(result.error || "Failed to create task");
      }
    } catch (error) {
      logger.error("Failed to save task", error as Error, { action: "addTask" });
      showToast.error("Failed to save task");
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const isCompleting = !task.completed;
    const updatedTask = {
      ...task,
      completed: isCompleting,
      completedAt: isCompleting ? new Date().toISOString() : undefined,
      actualMinutes: isCompleting ? task.estimatedMinutes || 25 : task.actualMinutes,
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));

    // Check if completing this task unblocks any other tasks
    if (isCompleting) {
      const unblockedTasks = get().tasks.filter((t) => t.dependsOn === id && !t.completed);
      if (unblockedTasks.length > 0) {
        showToast.success(`Unblocked ${unblockedTasks.length} task${unblockedTasks.length > 1 ? "s" : ""}: ${unblockedTasks.map((t) => t.title).join(", ")}`);
      }
    }

    get().pushHistory({
      type: "task",
      action: "update",
      before: task,
      after: updatedTask,
    });

    try {
      const result = await toggleTaskStatus(id, !task.completed);
      if (!result.success) {
        // Rollback
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        }));
        showToast.error(result.error || "Failed to update task");
      }
    } catch (error) {
      logger.error("Failed to toggle task", error as Error, { action: "toggleTask" });
      showToast.error("Failed to sync task status");
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const subtask = task.subtasks.find((st) => st.id === subtaskId);
    if (!subtask) return;

    const isCompleting = !subtask.completed;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId
        ? {
            ...st,
            completed: isCompleting,
            completedAt: isCompleting ? new Date().toISOString() : undefined,
          }
        : st
    );

    const updatedTask = { ...task, subtasks: updatedSubtasks };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));

    get().pushHistory({
      type: "task",
      action: "update",
      before: task,
      after: updatedTask,
    });

    // Sync to database
    try {
      await syncSubtask({
        id: subtaskId,
        parentId: taskId,
        title: subtask.title,
        completed: isCompleting,
      });
    } catch (error) {
      logger.error("Failed to sync subtask", error as Error, { action: "toggleSubtask" });
      showToast.error("Failed to sync subtask");
    }
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

    get().pushHistory({
      type: "task",
      action: "delete",
      before: task,
      after: null,
    });

    try {
      const result = await deleteTask(id);
      if (!result.success) {
        // Rollback
        set((state) => ({ tasks: [...state.tasks, task] }));
        showToast.error(result.error || "Failed to delete task");
      }
    } catch (error) {
      logger.error("Failed to delete task", error as Error, { action: "deleteTask" });
      showToast.error("Failed to delete task");
    }
  },

  updateTask: async (id, updates) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, ...updates };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));

    get().pushHistory({
      type: "task",
      action: "update",
      before: task,
      after: updatedTask,
    });

    // Sync to server
    try {
      // Map Store Task fields to Server Update Input
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serverUpdates: any = {
        id,
        ...updates,
      };

      // Handle specific field transformations if needed
      if (updates.dueDate) {
        // Ensure it's passed as string or null
        serverUpdates.dueDate = updates.dueDate;
      }

      const result = await serverUpdateTask(serverUpdates);
      if (!result.success) {
        // Rollback
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        }));
        showToast.error(result.error || "Failed to update task");
      }
    } catch (error) {
      logger.error("Failed to update task", error as Error, { action: "updateTask" });
      // Rollback
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        }));
        showToast.error("Failed to update task");
    }
  },

  updateTaskPriority: async (id, priority) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, priority };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));

    get().pushHistory({
      type: "task",
      action: "update",
      before: task,
      after: updatedTask,
    });

    showToast.success(`Priority set to ${priority}`);

    // Sync to server
    try {
      const result = await serverUpdateTask({ id, priority });
      if (!result.success) {
        // Rollback
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        }));
        showToast.error(result.error || "Failed to update priority");
      }
    } catch (error) {
      logger.error("Failed to update priority", error as Error, { action: "updateTaskPriority" });
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? task : t)),
      }));
      showToast.error("Failed to update priority");
    }
  },

  bulkDeleteTasks: (ids) => {
    set((state) => ({ tasks: state.tasks.filter((t) => !ids.includes(t.id)) }));
    showToast.success(`Deleted ${ids.length} tasks`);
    ids.forEach((id) => deleteTask(id).catch((error) => logger.error("Failed to bulk delete task", error as Error, { action: "bulkDeleteTasks" })));
  },

  bulkUpdateTasks: async (ids, updates) => {
    // Capture previous state for rollback
    const previousTasks = get().tasks.filter((t) => ids.includes(t.id));

    set((state) => ({
      tasks: state.tasks.map((t) => (ids.includes(t.id) ? { ...t, ...updates } : t)),
    }));
    showToast.success(`Updated ${ids.length} tasks`);

    // Sync each task to server
    const failedIds: string[] = [];
    for (const id of ids) {
      try {
        const result = await serverUpdateTask({ id, ...updates });
        if (!result.success) {
          failedIds.push(id);
        }
      } catch (error) {
        logger.error("Failed to bulk update task", error as Error, { action: "bulkUpdateTasks", taskId: id });
        failedIds.push(id);
      }
    }

    // Rollback failed tasks
    if (failedIds.length > 0) {
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (failedIds.includes(t.id)) {
            const prev = previousTasks.find((pt) => pt.id === t.id);
            return prev || t;
          }
          return t;
        }),
      }));
      showToast.error(`Failed to update ${failedIds.length} task(s)`);
    }
  },

  cloneTask: async (id, options = {}) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newId = uuidv4();
    let newDueDate = task.dueDate;

    if (options.shiftDays && task.dueDate) {
      const date = new Date(task.dueDate);
      date.setDate(date.getDate() + options.shiftDays);
      newDueDate = date.toISOString();
    }

    // Clone subtasks with new IDs
    const clonedSubtasks = task.subtasks?.map((st) => ({
      ...st,
      id: uuidv4(),
      completed: false,
      completedAt: undefined,
    })) || [];

    const clonedTask: Task = {
      ...task,
      id: newId,
      title: options.newTitle || `${task.title} (copy)`,
      completed: false,
      completedAt: undefined,
      dueDate: newDueDate,
      subtasks: clonedSubtasks,
      actualMinutes: undefined,
      dependsOn: undefined,
      columnId: "Todo",
    };

    // Optimistic update
    set((state) => ({ tasks: [...state.tasks, clonedTask] }));

    get().pushHistory({
      type: "task",
      action: "add",
      before: null,
      after: clonedTask,
    });

    showToast.success("Task cloned");

    try {
      await cloneTaskToDb({
        id: newId,
        title: clonedTask.title,
        description: clonedTask.description,
        dueDate: clonedTask.dueDate,
        priority: clonedTask.priority,
        estimatedMinutes: clonedTask.estimatedMinutes,
        tags: clonedTask.tags,
        subtasks: clonedSubtasks.map((st) => ({
          id: st.id,
          title: st.title,
          completed: st.completed,
        })),
      });
    } catch (error) {
      logger.error("Failed to clone task", error as Error, { action: "cloneTask" });
      showToast.error("Failed to save cloned task");
    }
  },

  addSubtask: async (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newSubtask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      dueDate: new Date().toISOString(),
      parentId: taskId,
    };

    const updatedTask = {
      ...task,
      subtasks: [...(task.subtasks || []), newSubtask],
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));

    get().pushHistory({
      type: "task",
      action: "update",
      before: task,
      after: updatedTask,
    });

    // Sync to database
    try {
      await syncSubtask({
        id: newSubtask.id,
        parentId: taskId,
        title: newSubtask.title,
        completed: newSubtask.completed,
      });
    } catch (error) {
      logger.error("Failed to sync subtask", error as Error, { action: "addSubtask" });
      showToast.error("Failed to save subtask");
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      subtasks: task.subtasks?.filter((st) => st.id !== subtaskId) || [],
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));

    get().pushHistory({
      type: "task",
      action: "update",
      before: task,
      after: updatedTask,
    });

    // Sync to database
    try {
      await deleteSubtask(subtaskId);
    } catch (error) {
      logger.error("Failed to delete subtask", error as Error, { action: "deleteSubtask" });
      showToast.error("Failed to delete subtask");
    }
  },
});
